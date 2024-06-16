import { optimizer } from '@electron-toolkit/utils'
import { MobxBasedModule } from '@shared/akari/mobx-based-module'
import { LEAGUE_AKARI_GITHUB_CHECK_UPDATES_URL } from '@shared/constants/common'
import { GithubApiLatestRelease } from '@shared/types/github'
import { MainWindowCloseStrategy } from '@shared/types/modules/app'
import { formatError } from '@shared/utils/errors'
import axios from 'axios'
import { BrowserWindow, app, dialog, shell } from 'electron'
import { makeAutoObservable, observable, runInAction } from 'mobx'
import { gt, lt } from 'semver'

import toolkit from '../../native/laToolkitWin32x64.node'
import { AutoGameflowModule } from '../auto-gameflow-new'
import { AutoReplyModule } from '../auto-reply-new'
import { AutoSelectModule } from '../auto-select-new'
import { CoreFunctionalityModule } from '../core-functionality-new'
import { RespawnTimerModule } from '../respawn-timer-new'
import { AppLogger, LogModule } from './log-new'
import { MainWindowModule } from './main-window-new'
import { StorageModule } from './storage-new'

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
  isQuitting = false

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

  setQuitting(b: boolean) {
    this.isQuitting = b
  }
}

export class AppModule extends MobxBasedModule {
  public state = new AppState()

  private _logModule: LogModule
  private _storageModule: StorageModule
  private _logger: AppLogger
  private _mwm: MainWindowModule
  private _afgm: AutoGameflowModule
  private _arm: AutoReplyModule
  private _cfm: CoreFunctionalityModule
  private _asm: AutoSelectModule
  private _rtm: RespawnTimerModule

  private _quitTasks: (() => Promise<void> | void)[] = []

  constructor() {
    super('app')
  }

  override async setup() {
    await super.setup()

    this._logModule = this.manager.getModule<LogModule>('log')
    this._logger = this._logModule.createLogger('app')
    this._storageModule = this.manager.getModule<StorageModule>('storage')
    this._mwm = this.manager.getModule<MainWindowModule>('main-window')
    this._afgm = this.manager.getModule<AutoGameflowModule>('auto-gameflow')
    this._arm = this.manager.getModule<AutoReplyModule>('auto-reply')
    this._cfm = this.manager.getModule<CoreFunctionalityModule>('core-functionality')
    this._asm = this.manager.getModule<AutoSelectModule>('auto-select')
    this._rtm = this.manager.getModule<RespawnTimerModule>('respawn-timer')

    await this._loadSettings()
    this._setupMethodCall()
    this._setupStateSync()
    await this._initializeApp()

    this._logger.info('初始化完成')
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

        this.state.setQuitting(true)

        while (this._quitTasks.length) {
          const fn = this._quitTasks.shift()
          try {
            await fn!()
          } catch {}
        }

        app.quit()
      }
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        const mw = this.manager.getModule<MainWindowModule>('main-window')
        mw.createWindow()
      }
    })

    app.on('second-instance', (_event, commandLine, workingDirectory) => {
      this._logger.info(`用户尝试启动第二个实例, cmd=${commandLine}, pwd=${workingDirectory}`)

      const mw = this.manager.getModule<MainWindowModule>('main-window')
      mw.restoreAndFocus()

      this.sendEvent('second-instance', commandLine, workingDirectory)
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
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
          this._mwm.notify.success('app', '检查更新', `该版本高于发布版本 (${currentVersion})`)
          this._logger.info(`该版本高于发布版本, 当前 ${currentVersion}, Github ${versionString}`)
        } else {
          this._mwm.notify.success('app', '检查更新', `目前是最新版本 (${currentVersion})`)
          this._logger.info(`目前是最新版本, 当前 ${currentVersion}, Github ${versionString}`)
        }
      }
    } catch (error) {
      this._mwm.notify.warn('app', '检查更新', `当前检查更新失败 ${(error as Error).message}`)
      this._logger.warn(`尝试检查更新失败 ${formatError(error)}`)
    } finally {
      runInAction(() => {
        this.state.updates.isCheckingUpdates = false
      })
    }
  }

  private _setupStateSync() {
    this.simpleSync('settings/auto-connect', () => this.state.settings.autoConnect)
    this.simpleSync('settings/auto-check-updates', () => this.state.settings.autoCheckUpdates)
    this.simpleSync(
      'settings/show-free-software-declaration',
      () => this.state.settings.showFreeSoftwareDeclaration
    )
    this.simpleSync('settings/close-strategy', () => this.state.settings.closeStrategy)
    this.simpleSync('settings/use-wmic', () => this.state.settings.useWmic)

    this.simpleSync('updates/is-checking-updates', () => this.state.updates.isCheckingUpdates)
    this.simpleSync('updates/new-updates', () => this.state.updates.newUpdates)
    this.simpleSync('updates/last-check-at', () => this.state.updates.lastCheckAt)
    this.simpleSync('is-administrator', () => this.state.isAdministrator)
  }

  private _setupMethodCall() {
    this.onCall('get-app-version', () => app.getVersion())

    this.onCall('set-setting/auto-connect', async (enabled) => {
      this.state.settings.setAutoConnect(enabled)
      await this._storageModule.setSetting('app/auto-connect', enabled)
    })

    this.onCall('set-setting/auto-check-updates', async (enabled) => {
      this.state.settings.setAutoCheckUpdates(enabled)
      await this._storageModule.setSetting('app/auto-check-updates', enabled)
    })

    this.onCall('set-setting/show-free-software-declaration', async (enabled) => {
      this.state.settings.setShowFreeSoftwareDeclaration(enabled)
      await this._storageModule.setSetting('app/show-free-software-declaration', enabled)
    })

    this.onCall('set-setting/close-strategy', async (s) => {
      this.state.settings.setCloseStrategy(s)
      await this._storageModule.setSetting('app/close-strategy', s)
    })

    this.onCall('set-setting/use-wmic', async (s) => {
      this.state.settings.setUseWmic(s)
      await this._storageModule.setSetting('app/use-wmic', s)
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

    this.onCall('open-in-explorer/logs', () => {
      return this._logModule.openLogDir()
    })
  }

  private async _loadSettings() {
    this.state.settings.setAutoConnect(
      await this._storageModule.getSetting('app/auto-connect', this.state.settings.autoConnect)
    )

    this.state.settings.setAutoCheckUpdates(
      await this._storageModule.getSetting(
        'app/auto-check-updates',
        this.state.settings.autoCheckUpdates
      )
    )

    this.state.settings.setShowFreeSoftwareDeclaration(
      await this._storageModule.getSetting(
        'app/show-free-software-declaration',
        this.state.settings.showFreeSoftwareDeclaration
      )
    )

    this.state.settings.setCloseStrategy(
      await this._storageModule.getSetting('app/close-strategy', this.state.settings.closeStrategy)
    )

    this.state.settings.setUseWmic(
      await this._storageModule.getSetting('app/use-wmic', this.state.settings.useWmic)
    )
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
          await this._storageModule.setSetting(resName, jsonValue)
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
      (s) => (this._afgm.state.settings.autoAcceptEnabled = s)
    )
    await _toNewSettings(
      'autoAccept.delaySeconds',
      'auto-gameflow/auto-accept-delay-seconds',
      (s) => (this._afgm.state.settings.autoAcceptDelaySeconds = s)
    )
    await _toNewSettings(
      'autoHonor.enabled',
      'auto-gameflow/auto-honor-enabled',
      (s) => (this._afgm.state.settings.autoHonorEnabled = s)
    )
    await _toNewSettings(
      'autoHonor.strategy',
      'auto-gameflow/auto-honor-strategy',
      (s) => (this._afgm.state.settings.autoHonorStrategy = s)
    )
    await _toNewSettings(
      'autoReply.enabled',
      'auto-reply/enabled',
      (s) => (this._arm.state.settings.enabled = s)
    )
    await _toNewSettings(
      'autoReply.enableOnAway',
      'auto-reply/enable-on-away',
      (s) => (this._arm.state.settings.enableOnAway = s)
    )
    await _toNewSettings(
      'autoReply.text',
      'auto-reply/text',
      (s) => (this._arm.state.settings.text = s)
    )
    await _toNewSettings(
      'autoSelect.normalModeEnabled',
      'auto-select/normal-mode-enabled',
      (s) => (this._asm.state.settings.normalModeEnabled = s)
    )
    await _toNewSettings(
      'autoSelect.benchModeEnabled',
      'auto-select/bench-mode-enabled',
      (s) => (this._asm.state.settings.benchModeEnabled = s)
    )
    await _toNewSettings(
      'autoSelect.benchExpectedChampions',
      'auto-select/bench-expected-champions',
      (s) => (this._asm.state.settings.benchExpectedChampions = s)
    )
    await _toNewSettings(
      'autoSelect.expectedChampions',
      'auto-select/expected-champions',
      (s) => (this._asm.state.settings.expectedChampions = s)
    )
    await _toNewSettings(
      'autoSelect.bannedChampions',
      'auto-select/banned-champions',
      (s) => (this._asm.state.settings.bannedChampions = s)
    )
    await _toNewSettings(
      'autoSelect.banEnabled',
      'auto-select/ban-enabled',
      (s) => (this._asm.state.settings.banEnabled = s)
    )
    await _toNewSettings(
      'autoSelect.completed',
      'auto-select/completed',
      (s) => (this._asm.state.settings.completed = s)
    )
    await _toNewSettings(
      'autoSelect.onlySimulMode',
      'auto-select/only-simul-mode',
      (s) => (this._asm.state.settings.onlySimulMode = s)
    )
    await _toNewSettings(
      'autoSelect.grabDelay',
      'auto-select/grab-delay-seconds',
      (s) => (this._asm.state.settings.grabDelaySeconds = s)
    )
    await _toNewSettings(
      'autoSelect.banTeammateIntendedChampion',
      'auto-select/ban-teammate-intended-champion',
      (s) => (this._asm.state.settings.banTeammateIntendedChampion = s)
    )
    await _toNewSettings(
      'autoSelect.selectTeammateIntendedChampion',
      'auto-select/select-teammate-intended-champion',
      (s) => (this._asm.state.settings.selectTeammateIntendedChampion = s)
    )
    await _toNewSettings(
      'autoSelect.showIntent',
      'auto-select/show-intent',
      (s) => (this._asm.state.settings.showIntent = s)
    )
    await _toNewSettings(
      'matchHistory.fetchAfterGame',
      'core-functionality/fetch-after-game',
      (s) => (this._cfm.state.settings.fetchAfterGame = s)
    )
    await _toNewSettings(
      'matchHistory.autoRouteOnGameStart',
      'core-functionality/auto-route-on-game-start',
      (s) => (this._cfm.state.settings.autoRouteOnGameStart = s)
    )
    await _toNewSettings(
      'matchHistory.preMadeTeamThreshold',
      'core-functionality/pre-made-team-threshold',
      (s) => (this._cfm.state.settings.preMadeTeamThreshold = s)
    )
    await _toNewSettings(
      'matchHistory.teamAnalysisPreloadCount',
      'core-functionality/team-analysis-preload-count',
      (s) => (this._cfm.state.settings.teamAnalysisPreloadCount = s)
    )
    await _toNewSettings(
      'matchHistory.matchHistoryLoadCount',
      'core-functionality/match-history-load-count',
      (s) => (this._cfm.state.settings.matchHistoryLoadCount = s)
    )
    await _toNewSettings(
      'matchHistory.fetchDetailedGame',
      'core-functionality/fetch-detailed-game',
      (s) => (this._cfm.state.settings.fetchDetailedGame = s)
    )
    await _toNewSettings(
      'matchHistory.sendKdaInGame',
      'core-functionality/send-kda-in-game',
      (s) => (this._cfm.state.settings.sendKdaInGame = s)
    )
    await _toNewSettings(
      'matchHistory.sendKdaThreshold',
      'core-functionality/send-kda-threshold',
      (s) => (this._cfm.state.settings.sendKdaThreshold = s)
    )
    await _toNewSettings(
      'matchHistory.sendKdaInGameWithPreMadeTeams',
      'core-functionality/send-kda-in-game-with-pre-made-teams',
      (s) => (this._cfm.state.settings.sendKdaInGameWithPreMadeTeams = s)
    )
    await _toNewSettings(
      'respawnTimer.enabled',
      'respawn-timer/enabled',
      (s) => (this._rtm.state.settings.enabled = s)
    )

    if (migrated) {
      this._logger.info('旧设置项已经成功迁移')
      return true
    }

    return false
  }
}

export const appModule = new AppModule()
