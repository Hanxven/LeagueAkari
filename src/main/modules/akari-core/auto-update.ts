import { MobxBasedBasicModule } from '@main/akari-ipc/mobx-based-basic-module'
import {
  LEAGUE_AKARI_CHECK_ANNOUNCEMENT_URL,
  LEAGUE_AKARI_GITEE_CHECK_UPDATES_URL,
  LEAGUE_AKARI_GITHUB_CHECK_UPDATES_URL
} from '@shared/constants/common'
import { FileInfo, GithubApiLatestRelease } from '@shared/types/github'
import { formatError } from '@shared/utils/errors'
import axios, { AxiosResponse } from 'axios'
import { app, shell } from 'electron'
import { comparer, makeAutoObservable, observable, toJS } from 'mobx'
import { extractFull } from 'node-7z'
import cp from 'node:child_process'
import fs from 'node:original-fs'
import path from 'node:path'
import { Readable, pipeline } from 'node:stream'
import { lt } from 'semver'

import sevenBinPath from '../../../../resources/7za.exe?asset'
import { AppModule } from './app'
import { AppLogger, LogModule } from './log'
import { MainWindowModule } from './main-window'

interface NewUpdates {
  source: 'gitee' | 'github'
  currentVersion: string
  releaseVersion: string
  releaseNotesUrl: string
  downloadUrl: string
  filename: string
  releaseNotes: string
}

interface CurrentAnnouncement {
  content: string
  updateAt: Date
  isRead: boolean
  sha: string
}

export class AutoUpdateSettings {
  /**
   * 是否自动检查更新，检查到更新才会下载更新
   */
  autoCheckUpdates: boolean = true

  /**
   * 是否自动下载更新
   */
  autoDownloadUpdates: boolean = true

  /**
   * 下载源
   */
  downloadSource: 'gitee' | 'github' = 'gitee'

  constructor() {
    makeAutoObservable(this)
  }

  setAutoCheckUpdates(autoCheckUpdates: boolean) {
    this.autoCheckUpdates = autoCheckUpdates
  }

  setAutoDownloadUpdates(autoDownloadUpdates: boolean) {
    this.autoDownloadUpdates = autoDownloadUpdates
  }

  setDownloadSource(downloadSource: 'gitee' | 'github') {
    this.downloadSource = downloadSource
  }
}

interface UpdateProgressInfo {
  /**
   * 当前更新阶段
   */
  phase: 'downloading' | 'unpacking' | 'waiting-for-restart' | 'download-failed' | 'unpack-failed'

  /**
   * 当前下载进度，0 到 1
   */
  downloadingProgress: number

  /**
   * 平均下载速度，单位 B/s
   */
  averageDownloadSpeed: number

  /**
   * 剩余下载时间，单位秒
   */
  downloadTimeLeft: number

  /**
   * 更新包大小
   */
  fileSize: number

  /**
   * 解压进度，0 到 1
   */
  unpackingProgress: number
}

export class AutoUpdateState {
  settings = new AutoUpdateSettings()

  isCheckingUpdate: boolean = false
  lastCheckAt: Date | null = null
  newUpdates = observable.box<NewUpdates | null>(null, {
    equals: (a, b) => {
      if (a === null && b === null) {
        return true
      }

      if (a === null || b === null) {
        return false
      }

      return a.currentVersion === b.currentVersion && a.releaseVersion === b.releaseVersion
    }
  })

  updateProgressInfo: UpdateProgressInfo | null = null

  currentAnnouncement: CurrentAnnouncement | null

  constructor() {
    makeAutoObservable(this, {
      updateProgressInfo: observable.ref,
      currentAnnouncement: observable.ref
    })
  }

  setCheckingUpdates(isCheckingUpdates: boolean) {
    this.isCheckingUpdate = isCheckingUpdates
  }

  setNewUpdates(updates: NewUpdates | null) {
    this.newUpdates.set(updates)
  }

  setCurrentAnnouncement(announcement: CurrentAnnouncement | null) {
    this.currentAnnouncement = announcement
  }

  setAnnouncementRead(isRead: boolean) {
    if (this.currentAnnouncement) {
      this.currentAnnouncement = {
        ...this.currentAnnouncement,
        isRead
      }
    }
  }

  setUpdateProgressInfo(info: UpdateProgressInfo | null) {
    this.updateProgressInfo = info
  }

  setLastCheckAt(date: Date) {
    this.lastCheckAt = date
  }
}

export class AutoUpdateModule extends MobxBasedBasicModule {
  public state = new AutoUpdateState()

  private _mwm: MainWindowModule
  private _am: AppModule
  private _logger: AppLogger

  private _checkUpdateTimerId: NodeJS.Timeout | null = null
  private _checkAnnouncementTimerId: NodeJS.Timeout | null = null

  private _lastQuitTask: (() => void) | null = null
  private _currentUpdateTaskCanceler: (() => void) | null = null

  static UPDATES_CHECK_INTERVAL = 7.2e6 // 2 hours
  static ANNOUNCEMENT_CHECK_INTERVAL = 7.2e6 // 2 hours
  static DOWNLOAD_DIR_NAME = 'NewUpdates'
  static UPDATE_SCRIPT_NAME = 'LeagueAkariUpdate.ps1'
  static UPDATE_PROGRESS_UPDATE_INTERVAL = 200
  static USER_AGENT = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0 LeagueAkari/${app.getVersion()} `

  private _http = axios.create({
    headers: {
      'User-Agent': AutoUpdateModule.USER_AGENT
    }
  })

  static UPDATE_SOURCE = {
    gitee: LEAGUE_AKARI_GITEE_CHECK_UPDATES_URL,
    github: LEAGUE_AKARI_GITHUB_CHECK_UPDATES_URL
  }

  constructor() {
    super('auto-update')
  }

  override async setup() {
    await super.setup()

    this._mwm = this.manager.getModule('main-window')
    this._am = this.manager.getModule('app')
    this._logger = this.manager.getModule<LogModule>('log').createLogger('auto-update')

    await this._migrateSettings()
    await this._setupSettingsSync()
    this._setupMethodCall()
    this._setupStateSync()
    this._handlePeriodicCheck()
  }

  private _handlePeriodicCheck() {
    this.autoDisposeReaction(
      () => this.state.settings.autoCheckUpdates,
      (sure) => {
        if (sure) {
          this._updateReleaseUpdatesInfo()
          this._checkUpdateTimerId = setInterval(() => {
            this._updateReleaseUpdatesInfo()
          }, AutoUpdateModule.UPDATES_CHECK_INTERVAL)
        } else {
          if (this._checkUpdateTimerId) {
            clearInterval(this._checkUpdateTimerId)
            this._checkUpdateTimerId = null
          }
        }
      },
      { fireImmediately: true, delay: 3500 }
    )

    this.autoDisposeReaction(
      () => [this.state.settings.autoDownloadUpdates, this.state.newUpdates.get()] as const,
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
    }, AutoUpdateModule.ANNOUNCEMENT_CHECK_INTERVAL)
  }

  private async _updateAnnouncement() {
    this._logger.info(`正在拉取最新公告: ${LEAGUE_AKARI_CHECK_ANNOUNCEMENT_URL}`)

    try {
      const { data } = await this._http.get<FileInfo>(LEAGUE_AKARI_CHECK_ANNOUNCEMENT_URL)

      const { data: announcement } = await this._http.get<string>(data.download_url, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      const lastReadSha = await this._ss.get('last-read-announcement-sha', '')

      this.state.setCurrentAnnouncement({
        content: announcement,
        updateAt: new Date(),
        isRead: data.sha === lastReadSha,
        sha: data.sha
      })
    } catch (error) {
      this._logger.warn(`更新公告时发生错误 ${formatError(error)}`)
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
    if (this.state.isCheckingUpdate) {
      return 'is-checking-updates'
    }

    this.state.setCheckingUpdates(true)

    const sourceUrl = AutoUpdateModule.UPDATE_SOURCE[this.state.settings.downloadSource]

    try {
      const release = await this._fetchLatestReleaseInfo(sourceUrl)

      this.state.setLastCheckAt(new Date())

      if (!release) {
        this._logger.info(`没有检查到新版本, 当前版本 ${app.getVersion()}, 从 ${sourceUrl} 检查`)
        return 'no-updates'
      }

      this.state.setNewUpdates({
        source: this.state.settings.downloadSource,
        currentVersion: app.getVersion(),
        releaseNotes: release.body,
        downloadUrl: release.archiveFile.browser_download_url,
        releaseVersion: release.tag_name,
        releaseNotesUrl: release.html_url,
        filename: release.archiveFile.name
      })

      this._logger.info(`检查到新版本 ${release.tag_name}`)

      if (this._checkUpdateTimerId) {
        clearInterval(this._checkUpdateTimerId)
        this._checkUpdateTimerId = setInterval(() => {
          this._updateReleaseUpdatesInfo()
        }, AutoUpdateModule.UPDATES_CHECK_INTERVAL)
      }
    } catch (error) {
      this._logger.warn(`尝试检查时更新失败 ${formatError(error)}`)
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
      this._logger.info(`已连接，正在下载更新包 from: ${downloadUrl}`)
    } catch (error) {
      this.state.setUpdateProgressInfo(null)
      this._logger.warn(`下载更新包失败 ${formatError(error)}`)
      this._mwm.notify.warn('app', '自动更新', '拉取更新包信息时发生错误')
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
    const downloadDir = path.join(appDir, AutoUpdateModule.DOWNLOAD_DIR_NAME)
    const downloadPath = path.join(downloadDir, filename)

    fs.mkdirSync(downloadDir, { recursive: true })

    const now = Date.now()

    let totalDownloaded = 0
    let downloadStartTime = now
    let lastUpdateProgressTime = now

    const asyncTask = new Promise<string>((resolve, reject) => {
      const writer = fs.createWriteStream(downloadPath)

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
        if (now - lastUpdateProgressTime >= AutoUpdateModule.UPDATE_PROGRESS_UPDATE_INTERVAL) {
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
            this._mwm.notify.info('app', '更新', '取消下载更新包')
            this._logger.info(`取消下载更新包 ${downloadPath}`)
          } else {
            this.state.setUpdateProgressInfo({
              phase: 'download-failed',
              downloadingProgress: 0,
              averageDownloadSpeed: 0,
              downloadTimeLeft: -1,
              fileSize: totalLength,
              unpackingProgress: 0
            })
            this._mwm.notify.warn('app', '更新', '下载或写入更新包文件失败')
            this._logger.warn(`下载或写入更新包文件失败 ${formatError(error)}`)
          }

          if (fs.existsSync(downloadPath)) {
            fs.rmSync(downloadPath, { force: true })
          }

          reject(error)
        } else {
          this._logger.info(`完成下载并写入：${downloadPath}`)
          resolve(downloadPath)
        }

        this._currentUpdateTaskCanceler = null
      })
    })

    return asyncTask
  }

  private async _unpackDownloadedUpdate(filepath: string) {
    if (!fs.existsSync(filepath)) {
      this.state.setUpdateProgressInfo({
        phase: 'unpack-failed',
        downloadingProgress: 1,
        averageDownloadSpeed: 0,
        downloadTimeLeft: 0,
        fileSize: 0,
        unpackingProgress: 0
      })
      this._logger.error(`更新包不存在 ${filepath}`)
      throw new Error(`No such file ${filepath}`)
    }

    const dirPath = path.join(
      path.dirname(filepath),
      path.basename(filepath, path.extname(filepath))
    )

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
    if (fs.existsSync(dirPath)) {
      this._logger.info(`存在旧的更新目录，删除旧的更新目录 ${dirPath}`)
      fs.rmSync(dirPath, { recursive: true, force: true })
    }

    const asyncTask = new Promise<string>((resolve, reject) => {
      this._logger.info(`开始解压更新包 ${filepath} 到 ${dirPath}, 使用 ${sevenBinPath}`)

      const seven = extractFull(path.join(filepath), dirPath, {
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
          this._mwm.notify.info('app', '更新', '取消解压更新包')
          this._logger.info(`取消解压更新包 ${filepath}`)
        } else {
          this.state.setUpdateProgressInfo({
            phase: 'unpack-failed',
            downloadingProgress: 1,
            averageDownloadSpeed: 0,
            downloadTimeLeft: 0,
            fileSize: 0,
            unpackingProgress: 0
          })
          this._mwm.notify.error('app', '更新', '解压更新包失败')
          this._logger.error(`解压更新包失败 ${formatError(error)}`)
        }

        if (fs.existsSync(filepath)) {
          fs.rmSync(filepath, { force: true })
        }

        reject(error)
      })
    })

    return asyncTask
  }

  private _applyUpdatesOnNextStartup(newUpdateDir: string, shouldStartNewApp: boolean = false) {
    if (!fs.existsSync(newUpdateDir)) {
      this.state.setUpdateProgressInfo(null)
      this._logger.error(`更新目录不存在 ${newUpdateDir}`)
      throw new Error(`No such directory ${newUpdateDir}`)
    }

    const appExePath = app.getPath('exe')

    const appDir = path.dirname(appExePath)
    const appDirParent = path.dirname(appDir)
    const newUpdateDirParent = path.dirname(newUpdateDir)
    const appOriginalBasename = path.basename(appDir)

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

    this._logger.info(
      `generatedPowershellScript=${generatedPowershellScript}, appDirName=${appOriginalBasename}, appDirParent=${appDirParent}, newUpdateDir=${newUpdateDir}, shouldStartNewApp=${shouldStartNewApp}, appExePath=${appExePath}, appDir=${appDir}, newUpdateDirParent=${newUpdateDirParent}`
    )

    const scriptPath = path.join(app.getPath('temp'), AutoUpdateModule.UPDATE_SCRIPT_NAME)

    const bom = Buffer.from([0xef, 0xbb, 0xbf])
    const scriptFileWithBom = Buffer.concat([bom, Buffer.from(generatedPowershellScript, 'utf-8')])

    fs.writeFileSync(scriptPath, scriptFileWithBom)

    this._logger.info(`写入更新脚本 ${scriptPath}`)

    if (this._lastQuitTask) {
      this._logger.info(`存在上一个退出更新任务，移除上一个退出任务`)
      this._am.removeQuitTask(this._lastQuitTask)
    }

    this._logger.info(`添加退出任务: 更新脚本 ${scriptPath}`)

    const _quitTask = () => {
      const c = cp.spawn(`powershell.exe`, ['-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
        detached: true,
        stdio: 'ignore',
        shell: true,
        cwd: app.getPath('temp')
      })

      c.unref()
    }

    this._lastQuitTask = _quitTask

    this._am.addQuitTask(_quitTask)

    this.state.setUpdateProgressInfo({
      phase: 'waiting-for-restart',
      downloadingProgress: 1,
      averageDownloadSpeed: 0,
      downloadTimeLeft: 0,
      fileSize: 0,
      unpackingProgress: 1
    })

    this._currentUpdateTaskCanceler = () => {
      if (fs.existsSync(scriptPath)) {
        fs.rmSync(scriptPath)
      }

      if (fs.existsSync(newUpdateDirParent)) {
        fs.rmSync(newUpdateDirParent, { recursive: true, force: true })
      }

      this._am.removeQuitTask(_quitTask)
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

  private async _migrateSettings() {
    // 迁移 app/auto-check-updates 到 auto-update/auto-check-updates
    if (await this._sm.settings.has('app/auto-check-updates')) {
      await this._sm.settings.set(
        'auto-update/auto-check-updates',
        await this._sm.settings.get('app/auto-check-updates', true)
      )
      this._sm.settings.remove('app/auto-check-updates')
    }
  }

  private async _setupSettingsSync() {
    this.simpleSettingSync(
      'auto-check-updates',
      () => this.state.settings.autoCheckUpdates,
      (s) => this.state.settings.setAutoCheckUpdates(s)
    )

    this.simpleSettingSync(
      'auto-download-updates',
      () => this.state.settings.autoDownloadUpdates,
      (s) => this.state.settings.setAutoDownloadUpdates(s)
    )

    this.simpleSettingSync(
      'download-source',
      () => this.state.settings.downloadSource,
      (s) => this.state.settings.setDownloadSource(s)
    )

    await this.loadSettings()
  }

  private _setupMethodCall() {
    this.onCall('check-updates', async () => {
      const updateType = this._updateReleaseUpdatesInfo()
      if (this.state.newUpdates.get() && this.state.settings.autoDownloadUpdates) {
        await this._startUpdateProcess(
          this.state.newUpdates.get()!.downloadUrl,
          this.state.newUpdates.get()!.filename
        )
      }
      return updateType
    })

    this.onCall('start-update', async () => {
      if (this.state.newUpdates.get()) {
        await this._startUpdateProcess(
          this.state.newUpdates.get()!.downloadUrl,
          this.state.newUpdates.get()!.filename
        )
      }
    })

    this.onCall('set-read', async (sha: string) => {
      if (this.state.currentAnnouncement) {
        this.state.setAnnouncementRead(true)
        await this._ss.set('last-read-announcement-sha', sha)
      }

      return
    })

    this.onCall('cancel-update', () => {
      this._cancelUpdateProcess()
    })

    this.onCall('open-in-explorer/new-updates', () => {
      const p = path.join(app.getPath('userData'), AutoUpdateModule.DOWNLOAD_DIR_NAME)
      return shell.openPath(p)
    })
  }

  private _setupStateSync() {
    this.simpleSync('is-checking-updates', () => this.state.isCheckingUpdate)
    this.simpleSync('new-updates', () => toJS(this.state.newUpdates.get()))
    this.simpleSync('update-progress-info', () => this.state.updateProgressInfo)
    this.simpleSync('last-check-at', () => this.state.lastCheckAt)
    this.simpleSync('current-announcement', () => this.state.currentAnnouncement)
  }
}

export const autoUpdateModule = new AutoUpdateModule()
