import { MobxBasedBasicModule } from '@main/akari-ipc/modules/mobx-based-basic-module'
import {
  LEAGUE_AKARI_GITEE_CHECK_UPDATES_URL,
  LEAGUE_AKARI_GITHUB_CHECK_UPDATES_URL
} from '@shared/constants/common'
import { GithubApiLatestRelease } from '@shared/types/github'
import { formatError } from '@shared/utils/errors'
import axios, { Axios, AxiosResponse } from 'axios'
import { app } from 'electron'
import { makeAutoObservable, observable } from 'mobx'
import { extractFull } from 'node-7z'
import cp from 'node:child_process'
import fs from 'node:original-fs'
import path from 'node:path'
import { Readable, pipeline } from 'node:stream'
import { gt, lt } from 'semver'

import sevenBinPath from '../../../../resources/7za.exe?asset'
import { AppModule } from './app'
import { AppLogger, LogModule } from './log'
import { MainWindowModule } from './main-window'

interface NewUpdates {
  currentVersion: string
  version: string
  pageUrl: string
  downloadUrl: string
  description: string
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
  phase: 'downloading' | 'unpacking' | 'waiting-for-restart'

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
  newUpdates: NewUpdates | null = null

  updateProgressInfo: UpdateProgressInfo | null = null

  constructor() {
    makeAutoObservable(this, {
      newUpdates: observable.ref,
      updateProgressInfo: observable.ref
    })
  }

  setCheckingUpdates(isCheckingUpdates: boolean) {
    this.isCheckingUpdate = isCheckingUpdates
  }

  setLastCheckAt(date: Date) {
    this.lastCheckAt = date
  }

  setNewUpdates(updates: NewUpdates | null) {
    this.newUpdates = updates
  }

  setUpdateProgressInfo(info: UpdateProgressInfo | null) {
    this.updateProgressInfo = info
  }
}

export class AutoUpdateModule extends MobxBasedBasicModule {
  public state = new AutoUpdateState()

  private _mwm: MainWindowModule
  private _am: AppModule
  private _logger: AppLogger

  private _lastQuitTask: (() => void) | null = null
  private _currentUpdateTaskDisposer: (() => void) | null = null

  static DOWNLOAD_DIR_NAME = 'NewUpdates'
  static UPDATE_SCRIPT_NAME = 'LeagueAkariUpdate.ps1'
  static UPDATE_PROGRESS_UPDATE_INTERVAL = 200
  static FAKE_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0'

  private _http = axios.create({
    headers: {
      'User-Agent': AutoUpdateModule.FAKE_USER_AGENT
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
    this._setupSettingsSync()
    this._setupMethodCall()
    this._setupStateSync()
  }

  /**
   * 检查更新并返回
   * @param silent 静默检查更新，不会弹出通知
   * @returns
   */
  private async _checkForUpdatesGiteeOrGithub(silent = false, debug = false) {
    if (this.state.isCheckingUpdate) {
      return
    }

    this.state.setCheckingUpdates(true)

    try {
      const { data } = await this._http.get<GithubApiLatestRelease>(
        AutoUpdateModule.UPDATE_SOURCE[this.state.settings.downloadSource]
      )
      const currentVersion = app.getVersion()
      const versionString = data.tag_name

      if (debug || lt(currentVersion, versionString)) {
        let archiveFile = data.assets.find((a) => {
          return a.content_type === 'application/x-compressed'
        })

        if (!archiveFile) {
          archiveFile = data.assets.find((a) => {
            // 你要知道 Gitee 现在没有 content_type 字段
            return a.browser_download_url.endsWith('win.7z')
          })
        }

        this.state.setNewUpdates({
          currentVersion,
          description: data.body,
          downloadUrl: archiveFile ? archiveFile.browser_download_url : '',
          version: versionString,
          pageUrl: data.html_url
        })

        this._logger.info(
          `检查到更新版本, 当前 ${currentVersion}, ${this.state.settings.downloadSource} ${versionString}, 归档包 ${JSON.stringify(archiveFile)}`
        )

        return archiveFile
      } else {
        this.state.setNewUpdates(null)

        if (gt(currentVersion, versionString)) {
          if (!silent) {
            this._mwm.notify.success('app', '检查更新', `该版本高于发布版本 (${currentVersion})`)
          }
          this._logger.info(
            `该版本高于发布版本, 当前 ${currentVersion}, ${this.state.settings.downloadSource} ${versionString}`
          )
        } else {
          if (!silent) {
            this._mwm.notify.success('app', '检查更新', `目前是最新版本 (${currentVersion})`)
          }
          this._logger.info(
            `目前是最新版本, 当前 ${currentVersion}, ${this.state.settings.downloadSource} ${versionString}`
          )
        }
      }
    } catch (error) {
      if (!silent) {
        this._mwm.notify.warn('app', '检查更新', `当前检查更新失败 ${(error as Error).message}`)
      }
      this._logger.warn(`尝试检查更新失败 ${formatError(error)}`)
    } finally {
      this.state.setCheckingUpdates(false)
    }

    return null
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

      this._currentUpdateTaskDisposer = () => {
        const error = new Error('Download canceled')
        error.name = 'Canceled'
        resp.data.destroy(error)
        writer.close()

        if (fs.existsSync(downloadPath)) {
          fs.rmSync(downloadPath)
        }
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
          this.state.setUpdateProgressInfo(null)

          if (error.name === 'Canceled') {
            this._mwm.notify.info('app', '更新', '取消下载更新包')
            this._logger.info(`取消下载更新包 ${downloadPath}`)
          } else {
            this._mwm.notify.warn('app', '更新', '下载或写入更新包文件失败')
            this._logger.warn(`下载或写入更新包文件失败 ${formatError(error)}`)
          }

          reject(error)
        } else {
          this._logger.info(`完成下载并写入：${downloadPath}`)
          resolve(downloadPath)
        }

        this._currentUpdateTaskDisposer = null
      })
    })

    return asyncTask
  }

  private async _unpackDownloadedUpdate(filepath: string) {
    if (!fs.existsSync(filepath)) {
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

    this._logger.info(`开始解压更新包 ${filepath} 到 ${dirPath}, 使用 ${sevenBinPath}`)

    const asyncTask = new Promise<string>((resolve, reject) => {
      const seven = extractFull(path.join(filepath), dirPath, {
        $bin: sevenBinPath.replace('app.asar', 'app.asar.unpacked'),
        $progress: true
      })

      this._currentUpdateTaskDisposer = () => {
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
        this._currentUpdateTaskDisposer = null

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
        this.state.setUpdateProgressInfo(null)
        this._currentUpdateTaskDisposer = null

        if (error.name === 'Canceled') {
          this._mwm.notify.info('app', '更新', '取消解压更新包')
          this._logger.info(`取消解压更新包 ${filepath}`)
        } else {
          this._mwm.notify.error('app', '更新', '解压更新包失败')
          this._logger.error(`解压更新包失败 ${formatError(error)}`)
        }

        reject(error)
      })
    })

    return asyncTask
  }

  private _applyUpdatesOnNextStartup(newUpdateDir: string, shouldStartNewApp: boolean = false) {
    if (!fs.existsSync(newUpdateDir)) {
      this._logger.error(`更新目录不存在 ${newUpdateDir}`)
      throw new Error(`No such directory ${newUpdateDir}`)
    }

    const appExePath = app.getPath('exe')
    const appDir = path.dirname(appExePath)
    const appDirParent = path.join(appDir, '..')
    const newUpdateDirParent = path.join(newUpdateDir, '..')
    const appDirName = path.basename(appDir)

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
$originalDirName = "${appDirName}"
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

Write-Output "Copying..."
Copy-Item -Path $sourceDir -Destination "$targetDir\\$randomDirName" -Recurse -Force

Remove-Item -Path "$targetDir\\$originalDirName" -Recurse -Force
Rename-Item -Path "$targetDir\\$randomDirName" -NewName $originalDirName
Remove-Item -Path "$updateDir" -Recurse -Force

if ($shouldStartProcess -eq $true) {
  Write-Output "Starting: LeagueAkari.exe - Akari~"
  Start-Process -FilePath "$targetDir\\$originalDirName\\$processName"
}

Remove-Item -Path $MyInvocation.MyCommand.Path -Force
`

    this._logger.info(
      `generatedPowershellScript=${generatedPowershellScript}, appDirName=${appDirName}, appDirParent=${appDirParent}, newUpdateDir=${newUpdateDir}, shouldStartNewApp=${shouldStartNewApp}, appExePath=${appExePath}, appDir=${appDir}, newUpdateDirParent=${newUpdateDirParent}`
    )

    const scriptPath = path.join(app.getPath('temp'), AutoUpdateModule.UPDATE_SCRIPT_NAME)
    fs.writeFileSync(scriptPath, generatedPowershellScript)

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

    this._currentUpdateTaskDisposer = () => {
      if (fs.existsSync(scriptPath)) {
        fs.rmSync(scriptPath)
      }

      this._am.removeQuitTask(_quitTask)
      this._currentUpdateTaskDisposer = null
      this._lastQuitTask = null
      this.state.setUpdateProgressInfo(null)
    }
  }

  private async _startUpdateProcess(archiveFileUrl: string, filename: string) {
    if (this.state.updateProgressInfo) {
      return
    }

    let downloadPath: string
    try {
      downloadPath = await this._downloadUpdate(archiveFileUrl, filename)
    } catch (error) {
      console.log('error1', error)
      return
    }

    let unpackedPath: string
    try {
      unpackedPath = await this._unpackDownloadedUpdate(downloadPath)
    } catch (error) {
      console.log('error2', error)
      return
    }

    try {
      this._applyUpdatesOnNextStartup(unpackedPath, true)
    } catch (error) {
      this._logger.error(`尝试添加退出任务失败 ${formatError(error)}`)
    }
  }

  private _cancelUpdateProcess() {
    if (this._currentUpdateTaskDisposer) {
      this._currentUpdateTaskDisposer()
    }
  }

  private async _migrateSettings() {
    // 迁移 app/auto-check-updates 到 auto-update/auto-check-updates
    if (await this._sm.settings.has('app/auto-check-updates')) {
      this._sm.settings.set(
        'auto-update/auto-check-updates',
        await this._sm.settings.get('app/auto-check-updates', true)
      )
      this._sm.settings.remove('app/auto-check-updates')
    }
  }

  private _setupSettingsSync() {
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
  }

  private _setupMethodCall() {
    this.onCall('check-updates', async () => {
      await this._checkForUpdatesGiteeOrGithub()
    })

    this.onCall('start-update', async () => {})

    this.onCall('cancel-update', () => {
      this._cancelUpdateProcess()
    })

    this.onCall('test-update', async () => {
      const newVer = await this._checkForUpdatesGiteeOrGithub(false, true)
      if (newVer) {
        await this._startUpdateProcess(newVer.browser_download_url, newVer.name)
      }
    })
  }

  private _setupStateSync() {
    this.simpleSync('is-checking-updates', () => this.state.isCheckingUpdate)
    this.simpleSync('new-updates', () => this.state.newUpdates)
    this.simpleSync('last-check-at', () => this.state.lastCheckAt)
    this.simpleSync('update-progress-info', () => this.state.updateProgressInfo)
  }
}

export const autoUpdateModule = new AutoUpdateModule()
