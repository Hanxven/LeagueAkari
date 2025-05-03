import { i18next } from '@main/i18n'
import { IntervalTask } from '@main/utils/timer'
import sevenBinPath from '@resources/7za.exe?asset'
import icon from '@resources/LA_ICON.ico?asset'
import updateExecutablePath from '@resources/akari-updater.exe?asset'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { LEAGUE_AKARI_CHECK_ANNOUNCEMENT_URL } from '@shared/constants/common'
import { FileInfo, GithubApiLatestRelease } from '@shared/types/github'
import { formatError } from '@shared/utils/errors'
import axios, { AxiosResponse } from 'axios'
import { Notification, app, shell } from 'electron'
import { comparer } from 'mobx'
import { extractFull } from 'node-7z'
import cp from 'node:child_process'
import crypto from 'node:crypto'
import ofs from 'node:original-fs'
import path from 'node:path'
import { Readable, pipeline } from 'node:stream'
import { gte, lt, valid } from 'semver'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { SelfUpdateSettings, SelfUpdateState } from './state'

/**
 * GitHub / Gitee 内容
 */
@Shard(SelfUpdateMain.id)
export class SelfUpdateMain implements IAkariShardInitDispose {
  static id = 'self-update-main'

  static UPDATES_CHECK_INTERVAL = 7.2e6 // 2 hours
  static ANNOUNCEMENT_CHECK_INTERVAL = 7.2e6 // 2 hours
  static DOWNLOAD_DIR_NAME = 'NewUpdates'
  static UPDATE_EXECUTABLE_NAME = 'akari-updater.exe'
  static NEW_VERSION_FLAG = 'NEW_VERSION_FLAG'
  static EXECUTABLE_NAME = 'LeagueAkari.exe'
  static UPDATE_PROGRESS_UPDATE_INTERVAL = 200
  static USER_AGENT = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0 LeagueAkari/${app.getVersion()} `

  static UPDATE_SOURCE = {
    gitee: 'https://gitee.com/api/v5/repos/Hanxven/LeagueAkari/releases/latest',
    github: 'https://api.github.com/repos/Hanxven/LeagueAkari/releases/latest'
  }

  static RELEASE_PAGE_SOURCE = {
    github: 'https://github.com/Hanxven/LeagueAkari/releases/latest',
    gitee: 'https://gitee.com/Hanxven/LeagueAkari/releases'
  }

  static ANNOUNCEMENT_SOURCE = {
    'zh-CN':
      'https://api.github.com/repos/Hanxven/LeagueAkari-Config/contents/announcements/zh-CN.md?ref=main',
    en: 'https://api.github.com/repos/Hanxven/LeagueAkari-Config/contents/announcements/en.md?ref=main'
  }

  public readonly settings = new SelfUpdateSettings()
  public readonly state = new SelfUpdateState()

  private readonly _log: AkariLogger
  private readonly _setting: SetterSettingService

  private readonly _checkUpdateTask = new IntervalTask(
    () => this._updateReleaseUpdatesInfo(),
    7.2e6
  )

  private _http = axios.create({
    headers: { 'User-Agent': SelfUpdateMain.USER_AGENT }
  })

  private _checkAnnouncementTimerId: NodeJS.Timeout | null = null

  private _updateOnQuitFn: (() => void) | null = null
  private _currentUpdateTaskCanceler: (() => void) | null = null

  constructor(
    private readonly _app: AppCommonMain,
    private readonly _ipc: AkariIpcMain,
    private readonly _mobx: MobxUtilsMain,
    _loggerFactory: LoggerFactoryMain,
    _settingFactory: SettingFactoryMain
  ) {
    this._log = _loggerFactory.create(SelfUpdateMain.id)
    this._setting = _settingFactory.register(
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
      'currentRelease',
      'updateProgressInfo',
      'lastCheckAt',
      'currentAnnouncement',
      'lastUpdateResult'
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
          this._checkUpdateTask.start(true)
        } else {
          this._checkUpdateTask.cancel()
        }
      },
      { fireImmediately: true, delay: 3500 }
    )

    this._mobx.reaction(
      () => [this.settings.autoDownloadUpdates, this.state.currentRelease] as const,
      ([yes, currentRelease]) => {
        if (yes && currentRelease && currentRelease.isNew) {
          this._startUpdateProcess(currentRelease.downloadUrl, currentRelease.filename)
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
        headers: { 'Cache-Control': 'no-cache' }
      })

      const md5 = crypto.createHash('md5').update(announcement).digest('hex')

      const lastReadSha = await this._setting._getFromStorage('lastReadAnnouncementMd5', '')

      this.state.setCurrentAnnouncement({
        content: announcement,
        updateAt: new Date(),
        isRead: md5 === lastReadSha,
        md5
      })
    } catch (error) {
      this._log.warn(`尝试拉取公告失败`, error)
    }
  }

  private async _fetchLatestReleaseInfo(gitLikeUrl: string, debug = false) {
    const { data } = await this._http.get<GithubApiLatestRelease>(gitLikeUrl)
    const currentVersion = app.getVersion()
    const versionString = data.tag_name

    const isNewVersion = lt(currentVersion, versionString) || debug

    let archiveFile = data.assets.find((a) => {
      return a.content_type === 'application/x-compressed'
    })

    if (archiveFile) {
      return { ...data, archiveFile, isNew: isNewVersion }
    }

    archiveFile = data.assets.find((a) => {
      // 你要知道 Gitee 现在没有 content_type 字段
      return a.browser_download_url.endsWith('win.7z') || a.browser_download_url.endsWith('win.zip')
    })

    if (archiveFile) {
      this._log.info(
        `当前版本 ${app.getVersion()}, 远程版本 ${versionString}, 从 ${gitLikeUrl} 检查`
      )
      return { ...data, archiveFile, isNew: isNewVersion }
    }

    this._log.warn(
      `版本不附带可下载文件, 当前版本 ${app.getVersion()}, 远程版本 ${versionString}, 从 ${gitLikeUrl} 检查`
    )

    return null
  }

  /**
   * 尝试加载更新信息
   */
  private async _updateReleaseUpdatesInfo(debug = false) {
    if (this.state.isCheckingUpdates) {
      return {
        result: 'is-checking-updates'
      }
    }

    this.state.setCheckingUpdates(true)

    const sourceUrl = SelfUpdateMain.UPDATE_SOURCE[this.settings.downloadSource]

    try {
      const release = await this._fetchLatestReleaseInfo(sourceUrl, debug)

      this.state.setLastCheckAt(new Date())

      if (!release) {
        return {
          result: 'no-updates'
        }
      }

      this.state.setCurrentRelease({
        isNew: debug || release.isNew,
        source: this.settings.downloadSource,
        currentVersion: app.getVersion(),
        releaseNotes: release.body,
        downloadUrl: release.archiveFile.browser_download_url,
        releaseVersion: release.tag_name,
        releaseNotesUrl: release.html_url,
        filename: release.archiveFile.name
      })

      this._checkUpdateTask.start()

      if (debug || release.isNew) {
        return { result: 'new-updates' }
      } else {
        return { result: 'no-updates' }
      }
    } catch (error: any) {
      this._log.warn(`尝试检查时更新失败`, error)
      return {
        result: 'failed',
        reason: error.message
      }
    } finally {
      this.state.setCheckingUpdates(false)
    }
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
      this._log.info(`已连接，正在下载更新包 from: ${downloadUrl}, 文件名${filename}`)
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
    const downloadDir = path.join(appDir, SelfUpdateMain.DOWNLOAD_DIR_NAME)
    const downloadPath = path.join(downloadDir, filename)

    ofs.mkdirSync(downloadDir, { recursive: true })

    const now = Date.now()

    let totalDownloaded = 0
    let downloadStartTime = now
    let lastUpdateProgressTime = now

    const asyncTask = new Promise<string>((resolve, reject) => {
      const writer = ofs.createWriteStream(downloadPath)

      this._currentUpdateTaskCanceler = () => {
        const error = new Error('Download canceled')
        error.name = 'Canceled'
        resp.data.destroy(error)
        writer.close()
        this._log.info(`取消下载更新包 ${downloadPath}`)
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

          if (ofs.existsSync(downloadPath)) {
            ofs.rmSync(downloadPath, { force: true })
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
    if (!ofs.existsSync(filepath)) {
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

    const extractedTo = path.join(filepath, '..', 'extracted')

    this.state.setUpdateProgressInfo({
      phase: 'unpacking',
      downloadingProgress: 1,
      averageDownloadSpeed: 0,
      downloadTimeLeft: 0,
      fileSize: 0,
      unpackingProgress: 0
    })

    if (ofs.existsSync(extractedTo)) {
      this._log.info(`存在旧的更新目录，删除旧的更新目录 ${extractedTo}`)
      ofs.rmSync(extractedTo, { recursive: true, force: true })
    }

    const asyncTask = new Promise<string>((resolve, reject) => {
      this._log.info(`开始解压更新包 ${filepath} 到 ${extractedTo}, 使用 ${sevenBinPath}`)

      const seven = extractFull(filepath, extractedTo, {
        $bin: sevenBinPath.replace('app.asar', 'app.asar.unpacked'),
        $progress: true
      })

      this._currentUpdateTaskCanceler = () => {
        const error = new Error('Unpacking canceled')
        error.name = 'Canceled'
        seven.destroy(error)
        this._log.info(`取消解压更新包 ${filepath}`)
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

      let hasError = false
      seven.on('end', () => {
        if (hasError) {
          return
        }

        this._currentUpdateTaskCanceler = null

        this.state.setUpdateProgressInfo({
          phase: 'unpacking',
          downloadingProgress: 1,
          averageDownloadSpeed: 0,
          downloadTimeLeft: 0,
          fileSize: 0,
          unpackingProgress: 1
        })

        ofs.rmSync(filepath, { force: true })
        resolve(extractedTo)
      })

      seven.on('rejected', (error) => {
        hasError = true
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
          this._log.error(`解压更新包失败`, error)
        }

        if (ofs.existsSync(filepath)) {
          ofs.rmSync(filepath, { recursive: true, force: true })
        }

        reject(error)
      })
    })

    return asyncTask
  }

  private async _applyUpdatesOnNextStartup(
    newUpdateDir: string,
    _shouldStartNewApp: boolean = true
  ) {
    if (!ofs.existsSync(newUpdateDir)) {
      this.state.setUpdateProgressInfo(null)
      this._log.error(`更新目录不存在 ${newUpdateDir}`)
      throw new Error(`No such directory ${newUpdateDir}`)
    }

    const copiedExecutablePath = path.join(
      app.getPath('temp'),
      SelfUpdateMain.UPDATE_EXECUTABLE_NAME
    )

    this._log.info(
      '写入更新可执行文件',
      updateExecutablePath.replace('app.asar', 'app.asar.unpacked'),
      copiedExecutablePath
    )

    await ofs.promises.copyFile(
      updateExecutablePath.replace('app.asar', 'app.asar.unpacked'),
      copiedExecutablePath
    )

    const appExePath = app.getPath('exe')
    const appDir = path.dirname(appExePath)

    if (this._updateOnQuitFn) {
      this._log.info(`存在上一个退出更新任务，移除上一个退出任务`)
    }

    this._log.info(
      `添加退出任务: 更新流程 ${copiedExecutablePath}: ${newUpdateDir} ${appDir} ${SelfUpdateMain.EXECUTABLE_NAME}`
    )

    this._createNotification(
      i18next.t('common.appName'),
      i18next.t('self-update-main.updateOnNextStartup')
    )

    const _updateOnQuitFn = () => {
      const c = cp.spawn(
        copiedExecutablePath,
        [`"${newUpdateDir}"`, `"${appDir}"`, `"${SelfUpdateMain.EXECUTABLE_NAME}"`],
        {
          detached: true,
          stdio: 'ignore',
          shell: true,
          cwd: app.getPath('temp')
        }
      )

      c.unref()

      ofs.writeFileSync(
        path.join(app.getPath('userData'), SelfUpdateMain.NEW_VERSION_FLAG),
        JSON.stringify(this.state.currentRelease?.releaseVersion || '')
      )
    }

    this._updateOnQuitFn = _updateOnQuitFn

    this.state.setUpdateProgressInfo({
      phase: 'waiting-for-restart',
      downloadingProgress: 1,
      averageDownloadSpeed: 0,
      downloadTimeLeft: 0,
      fileSize: 0,
      unpackingProgress: 1
    })

    this._currentUpdateTaskCanceler = () => {
      if (ofs.existsSync(copiedExecutablePath)) {
        ofs.rmSync(copiedExecutablePath, {
          force: true,
          recursive: true
        })
      }

      if (ofs.existsSync(newUpdateDir)) {
        ofs.rmSync(newUpdateDir, { recursive: true, force: true })
      }

      this._currentUpdateTaskCanceler = null
      this._updateOnQuitFn = null
      this.state.setUpdateProgressInfo(null)

      this._log.info(
        `取消退出更新任务`,
        `删除更新脚本 ${copiedExecutablePath}`,
        `删除更新目录 ${newUpdateDir}`
      )
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

    this._ipc.sendEvent(SelfUpdateMain.id, 'start-update')

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
      await this._applyUpdatesOnNextStartup(unpackedPath, true)
    } catch {}
  }

  private _cancelUpdateProcess() {
    if (this._currentUpdateTaskCanceler) {
      try {
        this._currentUpdateTaskCanceler()
      } catch (error) {
        this._ipc.sendEvent(SelfUpdateMain.id, 'error-cancel-update', formatError(error))
        this._log.warn(`尝试取消更新任务时发生错误`, error)
      }
    }

    this.state.setUpdateProgressInfo(null)
    this.state.setCurrentRelease(null)
  }

  private _handleIpcCall() {
    this._ipc.onCall(SelfUpdateMain.id, 'checkUpdates', async () => {
      return await this._updateReleaseUpdatesInfo()
    })

    this._ipc.onCall(SelfUpdateMain.id, 'checkUpdatesDebug', async () => {
      return await this._updateReleaseUpdatesInfo(true)
    })

    this._ipc.onCall(SelfUpdateMain.id, 'startUpdate', async () => {
      if (this.state.currentRelease && this.state.currentRelease.isNew) {
        await this._startUpdateProcess(
          this.state.currentRelease.downloadUrl,
          this.state.currentRelease.filename
        )
      }
    })

    this._ipc.onCall(SelfUpdateMain.id, 'setAnnouncementRead', async (_, md5: string) => {
      if (this.state.currentAnnouncement) {
        this.state.setAnnouncementRead(true)
        await this._setting._saveToStorage('lastReadAnnouncementMd5', md5)
      }

      return
    })

    this._ipc.onCall(SelfUpdateMain.id, 'cancelUpdate', () => {
      this._cancelUpdateProcess()
    })

    this._ipc.onCall(SelfUpdateMain.id, 'openNewUpdatesDir', () => {
      const p = path.join(app.getPath('userData'), SelfUpdateMain.DOWNLOAD_DIR_NAME)
      return shell.openPath(p)
    })
  }

  async onInit() {
    await this._handleState()
    await this._checkLastFailedUpdate()
    this._handleUpdateHttpProxy()
    this._handlePeriodicCheck()
    this._handleIpcCall()
  }

  async onDispose() {
    this._updateOnQuitFn?.()

    if (this.state.updateProgressInfo?.phase !== 'waiting-for-restart') {
      this._cancelUpdateProcess()
    }

    this._checkUpdateTask.cancel()
    this._checkAnnouncementTimerId && clearInterval(this._checkAnnouncementTimerId)
  }

  private _createNotification(title = 'League Akari', text: string) {
    const notification = new Notification({
      title,
      body: text,
      icon: icon
    })

    notification.show()
  }

  private async _checkLastFailedUpdate() {
    const newVersionFlagPath = path.join(app.getPath('userData'), SelfUpdateMain.NEW_VERSION_FLAG)

    this._log.info(`检查自动更新结果`, newVersionFlagPath)

    try {
      await ofs.promises.access(newVersionFlagPath)
    } catch (error) {
      return
    }

    try {
      const targetVersion = JSON.parse(
        await ofs.promises.readFile(newVersionFlagPath, {
          encoding: 'utf-8'
        })
      )

      if (valid(targetVersion)) {
        const pageUrl =
          SelfUpdateMain.RELEASE_PAGE_SOURCE[this.settings.downloadSource] ||
          SelfUpdateMain.RELEASE_PAGE_SOURCE.github

        if (gte(app.getVersion(), targetVersion)) {
          this._log.info(`看来已经成功更新`, targetVersion, newVersionFlagPath)
          this.state.setLastUpdateResult({
            success: true,
            reason: 'Successfully updated',
            newVersionPageUrl: pageUrl
          })
        } else {
          this._log.info(`上次的自动更新似乎失败了`, targetVersion, newVersionFlagPath)
          this.state.setLastUpdateResult({
            success: false,
            reason: 'Something wrong...',
            newVersionPageUrl: pageUrl
          })
        }
      } else {
        this._log.warn('更新标志非正常版本号', targetVersion)
      }

      await ofs.promises.unlink(newVersionFlagPath)
    } catch (error) {
      this._log.warn('检查更新标志时出现错误', error)
    }
  }

  private _handleUpdateHttpProxy() {
    this._mobx.reaction(
      () => this._app.settings.httpProxy,
      (httpProxy) => {
        if (httpProxy.strategy === 'force') {
          this._http.defaults.proxy = {
            host: httpProxy.host,
            port: httpProxy.port
          }
        } else if (httpProxy.strategy === 'auto') {
          this._http.defaults.proxy = undefined
        } else if (httpProxy.strategy === 'disable') {
          this._http.defaults.proxy = false
        }
      },
      { fireImmediately: true }
    )
  }
}
