import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import {
  LEAGUE_AKARI_CHECK_ANNOUNCEMENT_URL,
  LEAGUE_AKARI_GITEE_CHECK_UPDATES_URL,
  LEAGUE_AKARI_GITHUB_CHECK_UPDATES_URL
} from '@shared/constants/common'
import { FileInfo, GithubApiLatestRelease } from '@shared/types/github'
import { formatError } from '@shared/utils/errors'
import axios, { AxiosResponse } from 'axios'
import { app, shell } from 'electron'
import { comparer } from 'mobx'
import { extractFull } from 'node-7z'
import { spawn } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join } from 'node:path'
import { Readable, pipeline } from 'node:stream'
import { lt } from 'semver'

import sevenBinPath from '../../../../resources/7za.exe?asset'
import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { MobxSettingService } from '../setting-factory/mobx-setting-service'
import { SelfUpdateSettings, SelfUpdateState } from './state'

/**
 * 自我更新逻辑, 包括拉取最新版本, 下载最新版本, 以及在下一次启动
 * 也同时集成了公告功能, 会定期拉取新的公告
 */
export class SelfUpdateMain implements IAkariShardInitDispose {
  static id = 'self-update-main'
  static dependencies = [
    'akari-ipc-main',
    'mobx-utils-main',
    'logger-factory-main',
    'setting-factory-main'
  ]

  static UPDATES_CHECK_INTERVAL = 7.2e6 // 2 hours
  static ANNOUNCEMENT_CHECK_INTERVAL = 7.2e6 // 2 hours
  static DOWNLOAD_DIR_NAME = 'NewUpdates'
  static UPDATE_SCRIPT_NAME = 'LeagueAkariUpdate.ps1'
  static UPDATE_PROGRESS_UPDATE_INTERVAL = 200
  static USER_AGENT = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0 LeagueAkari/${app.getVersion()} `

  static UPDATE_SOURCE = {
    gitee: LEAGUE_AKARI_GITEE_CHECK_UPDATES_URL,
    github: LEAGUE_AKARI_GITHUB_CHECK_UPDATES_URL
  }

  public readonly settings = new SelfUpdateSettings()
  public readonly state = new SelfUpdateState()

  private readonly _ipc: AkariIpcMain
  private readonly _mobx: MobxUtilsMain
  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _settingFactory: SettingFactoryMain
  private readonly _log: AkariLogger
  private readonly _setting: MobxSettingService

  private _http = axios.create({
    headers: {
      'User-Agent': SelfUpdateMain.USER_AGENT
    }
  })

  private _checkUpdateTimerId: NodeJS.Timeout | null = null
  private _checkAnnouncementTimerId: NodeJS.Timeout | null = null

  private _lastQuitTask: (() => void) | null = null
  private _currentUpdateTaskCanceler: (() => void) | null = null

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
    this._mobx = deps['mobx-utils-main']
    this._loggerFactory = deps['logger-factory-main']
    this._settingFactory = deps['setting-factory-main']

    this._log = this._loggerFactory.create(SelfUpdateMain.id)
    this._setting = this._settingFactory.create(
      SelfUpdateMain.id,
      {
        autoCheckUpdates: { default: this.settings.autoCheckUpdates },
        autoDownloadUpdates: { default: this.settings.autoDownloadUpdates },
        downloadSource: { default: this.settings.downloadSource }
      },
      this.settings
    )
  }

  private async _handleState() {
    await this._setting.applyToState()

    this._mobx.propSync(SelfUpdateMain.id, 'state', this.state, [
      'isCheckingUpdates',
      'newUpdates',
      'updateProgressInfo',
      'lastCheckAt',
      'currentAnnouncement'
    ])

    this._mobx.propSync(SelfUpdateMain.id, 'settings', this.settings, [
      'autoCheckUpdates',
      'autoDownloadUpdates',
      'downloadSource'
    ])
  }

  private _handlePeriodicCheck() {
    this._mobx.reaction(
      () => this.settings.autoCheckUpdates,
      (sure) => {
        if (sure) {
          this._updateReleaseUpdatesInfo()
          this._checkUpdateTimerId = setInterval(() => {
            this._updateReleaseUpdatesInfo()
          }, SelfUpdateMain.UPDATES_CHECK_INTERVAL)
        } else {
          if (this._checkUpdateTimerId) {
            clearInterval(this._checkUpdateTimerId)
            this._checkUpdateTimerId = null
          }
        }
      },
      { fireImmediately: true, delay: 3500 }
    )

    this._mobx.reaction(
      () => [this.settings.autoDownloadUpdates, this.state.newUpdates] as const,
      ([yes, newUpdates]) => {
        if (yes && newUpdates) {
          this._startUpdateProcess(newUpdates.downloadUrl, newUpdates.releaseVersion)
        }
      },
      { equals: comparer.shallow }
    )

    this._updateAnnouncement()
    this._checkAnnouncementTimerId = setInterval(() => {
      this._updateAnnouncement()
    }, SelfUpdateMain.ANNOUNCEMENT_CHECK_INTERVAL)
  }

  private async _updateAnnouncement() {
    this._log.info(`正在拉取最新公告: ${LEAGUE_AKARI_CHECK_ANNOUNCEMENT_URL}`)

    try {
      const { data } = await this._http.get<FileInfo>(LEAGUE_AKARI_CHECK_ANNOUNCEMENT_URL)

      const { data: announcement } = await this._http.get<string>(data.download_url, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      const lastReadSha = await this._setting._getFromStorage('lastReadAnnouncementSha', '')

      this.state.setCurrentAnnouncement({
        content: announcement,
        updateAt: new Date(),
        isRead: data.sha === lastReadSha,
        sha: data.sha
      })
    } catch (error) {
      this._log.warn(`尝试拉取公告失败`, error)
    }
  }

  private async _fetchLatestReleaseInfo(gitLikeUrl: string) {
    const { data } = await this._http.get<GithubApiLatestRelease>(gitLikeUrl)
    const currentVersion = app.getVersion()
    const versionString = data.tag_name

    if (lt(currentVersion, versionString)) {
      let archiveFile = data.assets.find((a) => {
        return a.content_type === 'application/x-compressed'
      })

      if (archiveFile) {
        return { ...data, archiveFile }
      }

      archiveFile = data.assets.find((a) => {
        // 你要知道 Gitee 现在没有 content_type 字段
        return (
          a.browser_download_url.endsWith('win.7z') || a.browser_download_url.endsWith('win.zip')
        )
      })

      if (archiveFile) {
        return { ...data, archiveFile }
      }

      return null
    }

    return null
  }

  /**
   * 尝试加载更新信息
   */
  private async _updateReleaseUpdatesInfo() {
    if (this.state.isCheckingUpdates) {
      return 'is-checking-updates'
    }

    this.state.setCheckingUpdates(true)

    const sourceUrl = SelfUpdateMain.UPDATE_SOURCE[this.settings.downloadSource]

    try {
      const release = await this._fetchLatestReleaseInfo(sourceUrl)

      this.state.setLastCheckAt(new Date())

      if (!release) {
        this._log.info(`没有检查到新版本, 当前版本 ${app.getVersion()}, 从 ${sourceUrl} 检查`)
        return 'no-updates'
      }

      this.state.setNewUpdates({
        source: this.settings.downloadSource,
        currentVersion: app.getVersion(),
        releaseNotes: release.body,
        downloadUrl: release.archiveFile.browser_download_url,
        releaseVersion: release.tag_name,
        releaseNotesUrl: release.html_url,
        filename: release.archiveFile.name
      })

      this._log.info(`检查到新版本 ${release.tag_name}`)

      if (this._checkUpdateTimerId) {
        clearInterval(this._checkUpdateTimerId)
        this._checkUpdateTimerId = setInterval(() => {
          this._updateReleaseUpdatesInfo()
        }, SelfUpdateMain.UPDATES_CHECK_INTERVAL)
      }
    } catch (error) {
      this._log.warn(`尝试检查时更新失败`, error)
      return 'failed'
    } finally {
      this.state.setCheckingUpdates(false)
    }

    return 'new-updates'
  }

  private async _downloadUpdate(downloadUrl: string, filename: string) {
    this.state.setUpdateProgressInfo({
      phase: 'downloading',
      downloadingProgress: 0,
      averageDownloadSpeed: 0,
      downloadTimeLeft: -1,
      fileSize: 0,
      unpackingProgress: 0
    })

    let resp: AxiosResponse<Readable>
    try {
      resp = await this._http.get<Readable>(downloadUrl, {
        responseType: 'stream'
      })
      this._log.info(`已连接，正在下载更新包 from: ${downloadUrl}`)
    } catch (error) {
      this.state.setUpdateProgressInfo(null)
      this._log.warn(`下载更新包失败`, error)
      this._ipc.sendEvent(SelfUpdateMain.id, 'error-download-update', formatError(error))
      throw error
    }

    const totalLength = Number(resp.headers['content-length']) || -1

    this.state.setUpdateProgressInfo({
      phase: 'downloading',
      downloadingProgress: 0,
      averageDownloadSpeed: 0,
      downloadTimeLeft: -1,
      fileSize: totalLength,
      unpackingProgress: 0
    })

    const appDir = app.getPath('userData')
    const downloadDir = join(appDir, SelfUpdateMain.DOWNLOAD_DIR_NAME)
    const downloadPath = join(downloadDir, filename)

    mkdirSync(downloadDir, { recursive: true })

    const now = Date.now()

    let totalDownloaded = 0
    let downloadStartTime = now
    let lastUpdateProgressTime = now

    const asyncTask = new Promise<string>((resolve, reject) => {
      const writer = createWriteStream(downloadPath)

      this._currentUpdateTaskCanceler = () => {
        const error = new Error('Download canceled')
        error.name = 'Canceled'
        resp.data.destroy(error)
        writer.close()
      }

      const _updateProgress = (nowTime: number) => {
        const averageSpeed = (totalDownloaded / (nowTime - downloadStartTime)) * 1e3
        const timeSecondsLeft = (totalLength - totalDownloaded) / averageSpeed

        this.state.setUpdateProgressInfo({
          phase: 'downloading',
          downloadingProgress: totalDownloaded / totalLength,
          averageDownloadSpeed: averageSpeed,
          downloadTimeLeft: timeSecondsLeft,
          fileSize: totalLength,
          unpackingProgress: 0
        })
      }

      resp.data.on('data', (chunk) => {
        totalDownloaded += chunk.length

        const now = Date.now()
        if (now - lastUpdateProgressTime >= SelfUpdateMain.UPDATE_PROGRESS_UPDATE_INTERVAL) {
          lastUpdateProgressTime = now
          _updateProgress(now)
        }
      })

      resp.data.on('end', () => {
        _updateProgress(Date.now())
      })

      pipeline(resp.data, writer, (error) => {
        if (error) {
          if (error.name === 'Canceled') {
            this.state.setUpdateProgressInfo(null)
            this._ipc.sendEvent(SelfUpdateMain.id, 'cancel-download-update')
            this._log.info(`取消下载更新包 ${downloadPath}`)
          } else {
            this.state.setUpdateProgressInfo({
              phase: 'download-failed',
              downloadingProgress: 0,
              averageDownloadSpeed: 0,
              downloadTimeLeft: -1,
              fileSize: totalLength,
              unpackingProgress: 0
            })
            this._ipc.sendEvent(SelfUpdateMain.id, 'error-download-update', formatError(error))
            this._log.warn(`下载或写入更新包文件失败 ${formatError(error)}`)
          }

          if (existsSync(downloadPath)) {
            rmSync(downloadPath, { force: true })
          }

          reject(error)
        } else {
          this._log.info(`完成下载并写入：${downloadPath}`)
          resolve(downloadPath)
        }

        this._currentUpdateTaskCanceler = null
      })
    })

    return asyncTask
  }

  private async _unpackDownloadedUpdate(filepath: string) {
    if (!existsSync(filepath)) {
      this.state.setUpdateProgressInfo({
        phase: 'unpack-failed',
        downloadingProgress: 1,
        averageDownloadSpeed: 0,
        downloadTimeLeft: 0,
        fileSize: 0,
        unpackingProgress: 0
      })
      this._log.error(`更新包不存在 ${filepath}`)
      throw new Error(`No such file ${filepath}`)
    }

    const dirPath = join(dirname(filepath), basename(filepath, extname(filepath)))

    this.state.setUpdateProgressInfo({
      phase: 'unpacking',
      downloadingProgress: 1,
      averageDownloadSpeed: 0,
      downloadTimeLeft: 0,
      fileSize: 0,
      unpackingProgress: 0
    })

    // 如果有就删除，全都删了！全都删了！全都删了！全都删了！全都删了！全都删了！全都删了！全都删了！全都删了！全都删了！全都删了！
    // 全都删了！全都删了！全都删了！全都删了！全都删了！全都删了！全都删了！全都删了！全都删了！全都删了！全都删了！
    // 全都删了！全都删了！全都删了！全都删了！全都删了！全都删了！全都删了！全都删了！全都删了！全都删了！全都删了！
    if (existsSync(dirPath)) {
      this._log.info(`存在旧的更新目录，删除旧的更新目录 ${dirPath}`)
      rmSync(dirPath, { recursive: true, force: true })
    }

    const asyncTask = new Promise<string>((resolve, reject) => {
      this._log.info(`开始解压更新包 ${filepath} 到 ${dirPath}, 使用 ${sevenBinPath}`)

      const seven = extractFull(join(filepath), dirPath, {
        $bin: sevenBinPath.replace('app.asar', 'app.asar.unpacked'),
        $progress: true
      })

      this._currentUpdateTaskCanceler = () => {
        const error = new Error('Unpacking canceled')
        error.name = 'Canceled'
        seven.destroy(error)
      }

      seven.on('progress', (progress) => {
        this.state.setUpdateProgressInfo({
          phase: 'unpacking',
          downloadingProgress: 1,
          averageDownloadSpeed: 0,
          downloadTimeLeft: 0,
          fileSize: 0,
          unpackingProgress: progress.percent / 100
        })
      })

      seven.on('end', () => {
        this._currentUpdateTaskCanceler = null

        this.state.setUpdateProgressInfo({
          phase: 'unpacking',
          downloadingProgress: 1,
          averageDownloadSpeed: 0,
          downloadTimeLeft: 0,
          fileSize: 0,
          unpackingProgress: 1
        })

        resolve(dirPath)
      })

      seven.on('error', (error) => {
        this._currentUpdateTaskCanceler = null

        if (error.name === 'Canceled') {
          this.state.setUpdateProgressInfo(null)
          this._ipc.sendEvent(SelfUpdateMain.id, 'cancel-unpack-update')
          this._log.info(`取消解压更新包 ${filepath}`)
        } else {
          this.state.setUpdateProgressInfo({
            phase: 'unpack-failed',
            downloadingProgress: 1,
            averageDownloadSpeed: 0,
            downloadTimeLeft: 0,
            fileSize: 0,
            unpackingProgress: 0
          })
          this._ipc.sendEvent(SelfUpdateMain.id, 'error-unpack-update', formatError(error))
          this._log.error(`解压更新包失败 ${formatError(error)}`)
        }

        if (existsSync(filepath)) {
          rmSync(filepath, { force: true })
        }

        reject(error)
      })
    })

    return asyncTask
  }

  private _applyUpdatesOnNextStartup(newUpdateDir: string, shouldStartNewApp: boolean = false) {
    if (!existsSync(newUpdateDir)) {
      this.state.setUpdateProgressInfo(null)
      this._log.error(`更新目录不存在 ${newUpdateDir}`)
      throw new Error(`No such directory ${newUpdateDir}`)
    }

    const appExePath = app.getPath('exe')

    const appDir = dirname(appExePath)
    const appDirParent = dirname(appDir)
    const newUpdateDirParent = dirname(newUpdateDir)
    const appOriginalBasename = basename(appDir)

    /**
     * 1. 等待退出 League Akari 主进程
     * 2. 复制解压后的新更新目录到 League Akari 所在的父目录，使用随机目录名
     * 3. 删除原来的 League Akari 目录
     * 4. 重命名新更新的目录为原来的 League Akari 目录
     * 5. 根据逻辑是否启动新的 League Akari
     * 6. 删除下载的更新包
     */
    const generatedPowershellScript = `
  $processName = "LeagueAkari"
  
  Write-Output "Waiting for quit: LeagueAkari.exe"
  Wait-Process -Name $processName -ErrorAction SilentlyContinue
  
  $sourceDir = "${newUpdateDir}"
  $targetDir = "${appDirParent}"
  $updateDir = "${newUpdateDirParent}"
  $originalDirName = "${appOriginalBasename}"
  $shouldStartProcess = $${shouldStartNewApp}
  
  function Get-RandomValidDirectoryName {
      param (
          [string]$targetDir
      )
      do {
          $randomDirName = "NEW_AKARI_" + -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 8 | % {[char]$_})
          $newDirPath = Join-Path -Path $targetDir -ChildPath $randomDirName
      } while (Test-Path -Path $newDirPath)
      return $randomDirName
  }
  
  $randomDirName = Get-RandomValidDirectoryName -targetDir $targetDir
  
  Write-Output "Copying files from $sourceDir to $targetDir\\$randomDirName..."
  Try {
      Copy-Item -Path $sourceDir -Destination "$targetDir\\$randomDirName" -Recurse -Force
  } Catch {
      Write-Output "Error copying files: $_"
      Exit
  }
  
  Write-Output "Removing original directory $targetDir\\$originalDirName..."
  Try {
      Remove-Item -Path "$targetDir\\$originalDirName" -Recurse -Force
  } Catch {
      Write-Output "Error removing original directory: $_"
      Exit
  }
  
  Write-Output "Renaming $targetDir\\$randomDirName to $originalDirName..."
  Try {
      Rename-Item -Path "$targetDir\\$randomDirName" -NewName $originalDirName
  } Catch {
      Write-Output "Error renaming directory: $_"
      Exit
  }
  
  
  Write-Output "Removing update directory $updateDir..."
  Try {
      Remove-Item -Path "$updateDir" -Recurse -Force
  } Catch {
      Write-Output "Error removing update directory: $_"
      Exit
  }
  
  
  if ($shouldStartProcess -eq $true) {
      Write-Output "Starting: LeagueAkari.exe - Akari~"
      Try {
          Start-Process -FilePath "$targetDir\\$originalDirName\\$processName"
      } Catch {
          Write-Output "Error starting process: $_"
          Exit
      }
  }
  
  Write-Output "Cleaning up script..."
  Try {
      Remove-Item -Path $MyInvocation.MyCommand.Path -Force
  } Catch {
      Write-Output "Error cleaning up script: $_"
      Exit
  }
  `

    this._log.info(
      `generatedPowershellScript=${generatedPowershellScript}, appDirName=${appOriginalBasename}, appDirParent=${appDirParent}, newUpdateDir=${newUpdateDir}, shouldStartNewApp=${shouldStartNewApp}, appExePath=${appExePath}, appDir=${appDir}, newUpdateDirParent=${newUpdateDirParent}`
    )

    const scriptPath = join(app.getPath('temp'), SelfUpdateMain.UPDATE_SCRIPT_NAME)

    const bom = Buffer.from([0xef, 0xbb, 0xbf])
    const scriptFileWithBom = Buffer.concat([bom, Buffer.from(generatedPowershellScript, 'utf-8')])

    writeFileSync(scriptPath, scriptFileWithBom)

    this._log.info(`写入更新脚本 ${scriptPath}`)

    if (this._lastQuitTask) {
      this._log.info(`存在上一个退出更新任务，移除上一个退出任务`)
    }

    this._log.info(`添加退出任务: 更新脚本 ${scriptPath}`)

    const _quitTask = () => {
      const c = spawn(`powershell.exe`, ['-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
        detached: true,
        stdio: 'ignore',
        shell: true,
        cwd: app.getPath('temp')
      })

      c.unref()
    }

    this._lastQuitTask = _quitTask

    this.state.setUpdateProgressInfo({
      phase: 'waiting-for-restart',
      downloadingProgress: 1,
      averageDownloadSpeed: 0,
      downloadTimeLeft: 0,
      fileSize: 0,
      unpackingProgress: 1
    })

    this._currentUpdateTaskCanceler = () => {
      if (existsSync(scriptPath)) {
        rmSync(scriptPath)
      }

      if (existsSync(newUpdateDirParent)) {
        rmSync(newUpdateDirParent, { recursive: true, force: true })
      }

      this._currentUpdateTaskCanceler = null
      this._lastQuitTask = null
      this.state.setUpdateProgressInfo(null)
    }
  }

  private async _startUpdateProcess(archiveFileUrl: string, filename: string) {
    if (
      this.state.updateProgressInfo &&
      (this.state.updateProgressInfo.phase === 'downloading' ||
        this.state.updateProgressInfo.phase === 'unpacking' ||
        this.state.updateProgressInfo.phase === 'waiting-for-restart')
    ) {
      return
    }

    let downloadPath: string
    try {
      downloadPath = await this._downloadUpdate(archiveFileUrl, filename)
    } catch {
      return
    }

    let unpackedPath: string
    try {
      unpackedPath = await this._unpackDownloadedUpdate(downloadPath)
    } catch {
      return
    }

    try {
      this._applyUpdatesOnNextStartup(unpackedPath, true)
    } catch {}
  }

  private _cancelUpdateProcess() {
    if (this._currentUpdateTaskCanceler) {
      this._currentUpdateTaskCanceler()
    }
  }

  private _handleIpcCall() {
    this._ipc.onCall(SelfUpdateMain.id, 'check-updates', async () => {
      const updateType = this._updateReleaseUpdatesInfo()
      if (this.state.newUpdates && this.settings.autoDownloadUpdates) {
        await this._startUpdateProcess(
          this.state.newUpdates.downloadUrl,
          this.state.newUpdates.filename
        )
      }
      return updateType
    })

    this._ipc.onCall(SelfUpdateMain.id, 'start-update', async () => {
      if (this.state.newUpdates) {
        await this._startUpdateProcess(
          this.state.newUpdates.downloadUrl,
          this.state.newUpdates.filename
        )
      }
    })

    this._ipc.onCall(SelfUpdateMain.id, 'set-read', async (sha: string) => {
      if (this.state.currentAnnouncement) {
        this.state.setAnnouncementRead(true)
        await this._setting._saveToStorage('lastReadAnnouncementSha', sha)
      }

      return
    })

    this._ipc.onCall(SelfUpdateMain.id, 'cancelUpdate', () => {
      this._cancelUpdateProcess()
    })

    this._ipc.onCall(SelfUpdateMain.id, 'openNewUpdatesDir', () => {
      const p = join(app.getPath('userData'), SelfUpdateMain.DOWNLOAD_DIR_NAME)
      return shell.openPath(p)
    })
  }

  async onDispose() {
    this._lastQuitTask?.()
  }
}
