import { autoGameflowState } from '@main/modules/auto-gameflow/state'
import { autoReplyState } from '@main/modules/auto-reply/state'
import { autoSelectState } from '@main/modules/auto-select/state'
import { coreFunctionalityState } from '@main/modules/core-functionality/state'
import { respawnTimerState } from '@main/modules/respawn-timer/state'
import { getSetting, setSetting } from '@main/storage/settings'
import { LeagueAkariModuleManager } from '@shared/akari/main-module-manager'
import { MobxBasedModule } from '@shared/akari/mobx-based-module'
import { LEAGUE_AKARI_GITHUB_CHECK_UPDATES_URL } from '@shared/constants/common'
import { GithubApiLatestRelease } from '@shared/types/github'
import { MainWindowCloseStrategy } from '@shared/types/modules/app'
import { formatError } from '@shared/utils/errors'
import axios from 'axios'
import dayjs from 'dayjs'
import { app, shell } from 'electron'
import { makeAutoObservable, observable, runInAction } from 'mobx'
import { mkdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gt, lt } from 'semver'
import { Logger, createLogger, format, transports } from 'winston'

import toolkit from '../native/laToolkitWin32x64.node'
import { mwNotification } from './main-window'

class AppSettings {
  /**
   * 在客户端启动时且只有唯一的客户端，尝试自动连接
   */
  autoConnect: boolean = true

  /**
   * 使用 WMIC 查询命令行，而不是默认的 NtQueryInformationProcess
   */
  useWmic: boolean = false

  /**
   * 从 Github 拉取更新信息
   */
  autoCheckUpdates: boolean = true

  /**
   * 输出前置声明
   */
  showFreeSoftwareDeclaration: boolean = true

  /**
   * 关闭应用的默认行为
   */
  closeStrategy: MainWindowCloseStrategy = 'unset'

  setAutoConnect(enabled: boolean) {
    this.autoConnect = enabled
  }

  setUseWmic(enabled: boolean) {
    this.useWmic = enabled
  }

  setAutoCheckUpdates(enabled: boolean) {
    this.autoCheckUpdates = enabled
  }

  setShowFreeSoftwareDeclaration(enabled: boolean) {
    this.showFreeSoftwareDeclaration = enabled
  }

  setCloseStrategy(s: MainWindowCloseStrategy) {
    this.closeStrategy = s
  }

  constructor() {
    makeAutoObservable(this)
  }
}

interface NewUpdates {
  currentVersion: string
  version: string
  pageUrl: string
  downloadUrl: string
  description: string
}

export class AppState {
  isAdministrator: boolean = false

  ready: boolean = false

  updates = observable(
    {
      isCheckingUpdates: false,
      lastCheckAt: null as Date | null,
      newUpdates: null as NewUpdates | null
    },
    {
      newUpdates: observable.ref
    }
  )

  settings = new AppSettings()

  constructor() {
    makeAutoObservable(this)
  }

  setElevated(b: boolean) {
    this.isAdministrator = b
  }

  setReady(b: boolean) {
    this.ready = b
  }
}

export class AppModule extends MobxBasedModule {
  public state = new AppState()

  private _logger = this.createLogger('app')

  private _quitTasks: (() => Promise<void> | void)[] = []

  private _winstonLogger: Logger | null = null

  constructor() {
    super('app')

    this._initializeLogger()
    this._initializeApp()
  }

  /**
   * 创建一个日志工具
   */
  createLogger(domain: string) {
    const getLogger = () => {
      if (!this._winstonLogger) {
        throw new Error('logger is not initialized')
      }
      return this._winstonLogger
    }

    return {
      info: (message: any) => getLogger().info({ module: domain, message }),
      warn: (message: any) => getLogger().warn({ module: domain, message }),
      error: (message: any) => getLogger().error({ module: domain, message }),
      debug: (message: any) => getLogger().debug({ module: domain, message })
    }
  }

  private _initializeLogger() {
    const appDir = join(app.getPath('exe'), '..')
    const logsDir = join(appDir, 'logs')

    try {
      const stats = statSync(logsDir)

      if (!stats.isDirectory()) {
        rmSync(logsDir, { recursive: true, force: true })
        mkdirSync(logsDir)
      }
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        mkdirSync(logsDir)
      } else {
        throw error
      }
    }

    this._winstonLogger = createLogger({
      format: format.combine(
        format.timestamp(),
        format.printf(({ level, message, module, timestamp }) => {
          return `[${dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss:SSS')}] [${module}] [${level}] ${message}`
        })
      ),
      transports: [
        new transports.File({
          filename: `LeagueAkari_${dayjs().format('YYYYMMDD_HHmmssSSS')}.log`,
          dirname: logsDir,
          level: 'info'
        }),
        new transports.Console({
          level: 'warn'
        })
      ]
    })

    this.addQuitTask(
      () =>
        new Promise((resolve) => {
          if (this._winstonLogger) {
            this._winstonLogger.end(() => {
              resolve()
            })
          } else {
            resolve()
          }
        })
    )

    this.onCall('open-in-explorer/logs', () => {
      return shell.openPath(logsDir)
    })
  }

  override async onRegister(manager: LeagueAkariModuleManager) {
    await super.onRegister(manager)

    this._setupMethodCall()
    this._setupStateSync()
    await this._loadSettings()
    await this._initializeApp()
  }

  override async onUnregister() {
    throw new Error('App module cannot be unregistered')
  }

  /**
   * 应用退出时，执行的后续步骤列表
   * @param fn 方法
   */
  addQuitTask(fn: () => Promise<void> | void) {
    this._quitTasks.push(fn)
  }

  private async _initializeApp() {
    this.state.setElevated(toolkit.isElevated())

    if (this.state.settings.autoCheckUpdates) {
      try {
        await this._checkUpdates()
      } catch (error) {
        this._logger.warn(`检查更新失败 ${formatError(error)}`)
      }
    }

    app.on('before-quit', async (e) => {
      if (this._quitTasks.length) {
        e.preventDefault()

        while (this._quitTasks.length) {
          const fn = this._quitTasks.shift()
          try {
            await fn!()
          } catch {}
        }

        app.quit()
      }
    })
  }

  private async _checkUpdates() {
    if (this.state.updates.isCheckingUpdates) {
      return
    }

    runInAction(() => {
      this.state.updates.isCheckingUpdates = true
      this.state.updates.lastCheckAt = new Date()
    })

    try {
      const { data } = await axios.get<GithubApiLatestRelease>(
        LEAGUE_AKARI_GITHUB_CHECK_UPDATES_URL
      )
      const currentVersion = app.getVersion()
      const versionString = data.tag_name

      // new version found
      if (lt(currentVersion, versionString)) {
        const archiveFile = data.assets.find((a) => {
          return a.content_type === 'application/x-compressed'
        })

        runInAction(() => {
          this.state.updates.newUpdates = {
            currentVersion,
            description: data.body,
            downloadUrl: archiveFile ? archiveFile.browser_download_url : '',
            version: versionString,
            pageUrl: data.html_url
          }
        })

        this._logger.info(
          `检查到更新版本, 当前 ${currentVersion}, Github ${versionString}, 归档包 ${JSON.stringify(archiveFile)}`
        )
      } else {
        runInAction(() => {
          this.state.updates.newUpdates = null
        })
        if (gt(currentVersion, versionString)) {
          mwNotification.success('app', '检查更新', `该版本高于发布版本 (${currentVersion})`)
          this._logger.info(`该版本高于发布版本, 当前 ${currentVersion}, Github ${versionString}`)
        } else {
          mwNotification.success('app', '检查更新', `目前是最新版本 (${currentVersion})`)
          this._logger.info(`目前是最新版本, 当前 ${currentVersion}, Github ${versionString}`)
        }
      }
    } catch (error) {
      mwNotification.warn('app', '检查更新', `当前检查更新失败 ${(error as Error).message}`)
      this._logger.warn(`尝试检查更新失败 ${formatError(error)}`)
    } finally {
      runInAction(() => {
        this.state.updates.isCheckingUpdates = false
      })
    }
  }

  private _setupStateSync() {
    this.simpleSync('set-settings/auto-connect', () => this.state.settings.autoConnect)
    this.simpleSync('set-settings/auto-check-updates', () => this.state.settings.autoCheckUpdates)
    this.simpleSync(
      'set-settings/show-free-software-declaration',
      () => this.state.settings.showFreeSoftwareDeclaration
    )
    this.simpleSync('set-settings/close-strategy', () => this.state.settings.closeStrategy)
    this.simpleSync('set-settings/use-wmic', () => this.state.settings.useWmic)

    this.simpleSync('updates/is-checking-updates', () => this.state.updates.isCheckingUpdates)
    this.simpleSync('updates/new-updates', () => this.state.updates.newUpdates)
    this.simpleSync('updates/last-check-at', () => this.state.updates.lastCheckAt)
    this.simpleSync('is-administrator', () => this.state.isAdministrator)
  }

  private _setupMethodCall() {
    this.onCall('get-app-version', () => app.getVersion())

    this.onCall('set-setting/auto-connect', async (enabled) => {
      this.state.settings.setAutoConnect(enabled)
      await setSetting('app/auto-connect', enabled)
    })

    this.onCall('set-setting/auto-check-updates', async (enabled) => {
      this.state.settings.setAutoCheckUpdates(enabled)
      await setSetting('app/auto-check-updates', enabled)
    })

    this.onCall('set-setting/show-free-software-declaration', async (enabled) => {
      this.state.settings.setShowFreeSoftwareDeclaration(enabled)
      await setSetting('app/show-free-software-declaration', enabled)
    })

    this.onCall('set-setting/close-strategy', async (s) => {
      this.state.settings.setCloseStrategy(s)
      await setSetting('app/close-strategy', s)
    })

    this.onCall('set-setting/use-wmic', async (s) => {
      this.state.settings.setUseWmic(s)
      await setSetting('app/use-wmic', s)
    })

    this.onCall('migrate-from-local-storage', (settings) => {
      if (Object.keys(settings).length === 0) {
        return
      }
    })

    this.onCall('check-update', async () => {
      await this._checkUpdates()
    })

    this.onCall('migrate-settings-from-legacy-version', async (all: Record<string, string>) => {
      return await this._migrateSettingsFromLegacyVersion(all)
    })

    this.onCall('open-in-explorer/user-data', () => {
      return shell.openPath(app.getPath('userData'))
    })
  }

  private async _loadSettings() {
    this.state.settings.setAutoConnect(
      await getSetting('app/auto-connect', this.state.settings.autoConnect)
    )

    this.state.settings.setAutoCheckUpdates(
      await getSetting('app/auto-check-updates', this.state.settings.autoCheckUpdates)
    )

    this.state.settings.setShowFreeSoftwareDeclaration(
      await getSetting(
        'app/show-free-software-declaration',
        this.state.settings.showFreeSoftwareDeclaration
      )
    )

    this.state.settings.setCloseStrategy(
      await getSetting('app/close-strategy', this.state.settings.closeStrategy)
    )

    this.state.settings.setUseWmic(await getSetting('app/use-wmic', this.state.settings.useWmic))
  }

  private async _migrateSettingsFromLegacyVersion(all: Record<string, string>) {
    let migrated = false
    const _toNewSettings = async (
      originKey: string,
      resName: string,
      setter: (state: any) => any
    ) => {
      const originValue = all[originKey]
      if (originValue !== undefined) {
        try {
          const jsonValue = JSON.parse(originValue)
          await setSetting(resName, jsonValue)
          runInAction(() => setter(jsonValue))
          migrated = true
        } catch {}
      }
    }

    await _toNewSettings(
      'app.autoConnect',
      'app/auto-connect',
      (s) => (this.state.settings.autoConnect = s)
    )
    await _toNewSettings(
      'app.autoCheckUpdates',
      'app/auto-check-updates',
      (s) => (this.state.settings.autoCheckUpdates = s)
    )
    await _toNewSettings(
      'app.showFreeSoftwareDeclaration',
      'app/show-free-software-declaration',
      (s) => (this.state.settings.showFreeSoftwareDeclaration = s)
    )
    await _toNewSettings(
      'autoAccept.enabled',
      'auto-gameflow/auto-accept-enabled',
      (s) => (autoGameflowState.settings.autoAcceptEnabled = s)
    )
    await _toNewSettings(
      'autoAccept.delaySeconds',
      'auto-gameflow/auto-accept-delay-seconds',
      (s) => (autoGameflowState.settings.autoAcceptDelaySeconds = s)
    )
    await _toNewSettings(
      'autoHonor.enabled',
      'auto-gameflow/auto-honor-enabled',
      (s) => (autoGameflowState.settings.autoHonorEnabled = s)
    )
    await _toNewSettings(
      'autoHonor.strategy',
      'auto-gameflow/auto-honor-strategy',
      (s) => (autoGameflowState.settings.autoHonorStrategy = s)
    )
    await _toNewSettings(
      'autoReply.enabled',
      'auto-reply/enabled',
      (s) => (autoReplyState.settings.enabled = s)
    )
    await _toNewSettings(
      'autoReply.enableOnAway',
      'auto-reply/enable-on-away',
      (s) => (autoReplyState.settings.enableOnAway = s)
    )
    await _toNewSettings(
      'autoReply.text',
      'auto-reply/text',
      (s) => (autoReplyState.settings.text = s)
    )
    await _toNewSettings(
      'autoSelect.normalModeEnabled',
      'auto-select/normal-mode-enabled',
      (s) => (autoSelectState.settings.normalModeEnabled = s)
    )
    await _toNewSettings(
      'autoSelect.benchModeEnabled',
      'auto-select/bench-mode-enabled',
      (s) => (autoSelectState.settings.benchModeEnabled = s)
    )
    await _toNewSettings(
      'autoSelect.benchExpectedChampions',
      'auto-select/bench-expected-champions',
      (s) => (autoSelectState.settings.benchExpectedChampions = s)
    )
    await _toNewSettings(
      'autoSelect.expectedChampions',
      'auto-select/expected-champions',
      (s) => (autoSelectState.settings.expectedChampions = s)
    )
    await _toNewSettings(
      'autoSelect.bannedChampions',
      'auto-select/banned-champions',
      (s) => (autoSelectState.settings.bannedChampions = s)
    )
    await _toNewSettings(
      'autoSelect.banEnabled',
      'auto-select/ban-enabled',
      (s) => (autoSelectState.settings.banEnabled = s)
    )
    await _toNewSettings(
      'autoSelect.completed',
      'auto-select/completed',
      (s) => (autoSelectState.settings.completed = s)
    )
    await _toNewSettings(
      'autoSelect.onlySimulMode',
      'auto-select/only-simul-mode',
      (s) => (autoSelectState.settings.onlySimulMode = s)
    )
    await _toNewSettings(
      'autoSelect.grabDelay',
      'auto-select/grab-delay-seconds',
      (s) => (autoSelectState.settings.grabDelaySeconds = s)
    )
    await _toNewSettings(
      'autoSelect.banTeammateIntendedChampion',
      'auto-select/ban-teammate-intended-champion',
      (s) => (autoSelectState.settings.banTeammateIntendedChampion = s)
    )
    await _toNewSettings(
      'autoSelect.selectTeammateIntendedChampion',
      'auto-select/select-teammate-intended-champion',
      (s) => (autoSelectState.settings.selectTeammateIntendedChampion = s)
    )
    await _toNewSettings(
      'autoSelect.showIntent',
      'auto-select/show-intent',
      (s) => (autoSelectState.settings.showIntent = s)
    )
    await _toNewSettings(
      'matchHistory.fetchAfterGame',
      'core-functionality/fetch-after-game',
      (s) => (coreFunctionalityState.settings.fetchAfterGame = s)
    )
    await _toNewSettings(
      'matchHistory.autoRouteOnGameStart',
      'core-functionality/auto-route-on-game-start',
      (s) => (coreFunctionalityState.settings.autoRouteOnGameStart = s)
    )
    await _toNewSettings(
      'matchHistory.preMadeTeamThreshold',
      'core-functionality/pre-made-team-threshold',
      (s) => (coreFunctionalityState.settings.preMadeTeamThreshold = s)
    )
    await _toNewSettings(
      'matchHistory.teamAnalysisPreloadCount',
      'core-functionality/team-analysis-preload-count',
      (s) => (coreFunctionalityState.settings.teamAnalysisPreloadCount = s)
    )
    await _toNewSettings(
      'matchHistory.matchHistoryLoadCount',
      'core-functionality/match-history-load-count',
      (s) => (coreFunctionalityState.settings.matchHistoryLoadCount = s)
    )
    await _toNewSettings(
      'matchHistory.fetchDetailedGame',
      'core-functionality/fetch-detailed-game',
      (s) => (coreFunctionalityState.settings.fetchDetailedGame = s)
    )
    await _toNewSettings(
      'matchHistory.sendKdaInGame',
      'core-functionality/send-kda-in-game',
      (s) => (coreFunctionalityState.settings.sendKdaInGame = s)
    )
    await _toNewSettings(
      'matchHistory.sendKdaThreshold',
      'core-functionality/send-kda-threshold',
      (s) => (coreFunctionalityState.settings.sendKdaThreshold = s)
    )
    await _toNewSettings(
      'matchHistory.sendKdaInGameWithPreMadeTeams',
      'core-functionality/send-kda-in-game-with-pre-made-teams',
      (s) => (coreFunctionalityState.settings.sendKdaInGameWithPreMadeTeams = s)
    )
    await _toNewSettings(
      'respawnTimer.enabled',
      'respawn-timer/enabled',
      (s) => (respawnTimerState.settings.enabled = s)
    )

    if (migrated) {
      this._logger.info('旧设置项已经成功迁移')
      return true
    }

    return false
  }
}

export const appModule = new AppModule()
