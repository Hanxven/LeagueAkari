import { optimizer } from '@electron-toolkit/utils'
import { MobxBasedBasicModule } from '@main/akari-ipc/modules/mobx-based-basic-module'
import { MainWindowCloseStrategy } from '@shared/types/modules/app'
import { BrowserWindow, app, protocol, session, shell } from 'electron'
import { makeAutoObservable, runInAction } from 'mobx'
import { Readable } from 'node:stream'

import toolkit from '../../native/laToolkitWin32x64.node'
import { AutoGameflowModule } from '../auto-gameflow'
import { AutoReplyModule } from '../auto-reply'
import { AutoSelectModule } from '../auto-select'
import { CoreFunctionalityModule } from '../core-functionality'
import { RespawnTimerModule } from '../respawn-timer'
import { AutoUpdateModule } from './auto-update'
import { AuxWindowModule } from './auxiliary-window'
import { LcuConnectionModule } from './lcu-connection'
import { AppLogger, LogModule } from './log'
import { MainWindowModule } from './main-window'

class AppSettings {
  /**
   * 使用 WMIC 查询命令行，而不是默认的 NtQueryInformationProcess
   */
  useWmic: boolean = false

  /**
   * 输出前置声明
   */
  showFreeSoftwareDeclaration: boolean = true

  /**
   * 关闭应用的默认行为
   */
  closeStrategy: MainWindowCloseStrategy = 'unset'

  /**
   * 是否位于调试模式，更多不稳定功能将被启用
   */
  isInKyokoMode: boolean = false

  setUseWmic(enabled: boolean) {
    this.useWmic = enabled
  }

  setShowFreeSoftwareDeclaration(enabled: boolean) {
    this.showFreeSoftwareDeclaration = enabled
  }

  setCloseStrategy(s: MainWindowCloseStrategy) {
    this.closeStrategy = s
  }

  setInKyokoMode(b: boolean) {
    this.isInKyokoMode = b
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class AppState {
  settings = new AppSettings()

  isAdministrator: boolean = false
  ready: boolean = false
  isQuitting = false

  constructor() {
    makeAutoObservable(this, {})
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

export class AppModule extends MobxBasedBasicModule {
  public state = new AppState()

  private _logModule: LogModule
  private _logger: AppLogger
  private _mwm: MainWindowModule
  private _afgm: AutoGameflowModule
  private _arm: AutoReplyModule
  private _cfm: CoreFunctionalityModule
  private _asm: AutoSelectModule
  private _rtm: RespawnTimerModule
  private _lcm: LcuConnectionModule
  private _aum: AutoUpdateModule

  private _quitTasks: (() => Promise<void> | void)[] = []

  static AKARI_PROTOCOL = 'akari'

  constructor() {
    super('app')
  }

  override async setup() {
    await super.setup()

    this._logModule = this.manager.getModule<LogModule>('log')
    this._logger = this._logModule.createLogger('app')
    this._mwm = this.manager.getModule<MainWindowModule>('main-window')
    this._afgm = this.manager.getModule<AutoGameflowModule>('auto-gameflow')
    this._arm = this.manager.getModule<AutoReplyModule>('auto-reply')
    this._cfm = this.manager.getModule<CoreFunctionalityModule>('core-functionality')
    this._asm = this.manager.getModule<AutoSelectModule>('auto-select')
    this._rtm = this.manager.getModule<RespawnTimerModule>('respawn-timer')
    this._lcm = this.manager.getModule<LcuConnectionModule>('lcu-connection')
    this._aum = this.manager.getModule<AutoUpdateModule>('auto-update')

    await this._loadSettings()
    this._setupAkariProtocol()
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

  removeQuitTask(fn: () => Promise<void> | void) {
    const index = this._quitTasks.indexOf(fn)
    if (index !== -1) {
      this._quitTasks.splice(index, 1)
    }
  }

  private async _initializeApp() {
    this.state.setElevated(toolkit.isElevated())

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

  private _setupStateSync() {
    this.simpleSync(
      'settings/show-free-software-declaration',
      () => this.state.settings.showFreeSoftwareDeclaration
    )
    this.simpleSync('settings/close-strategy', () => this.state.settings.closeStrategy)
    this.simpleSync('settings/use-wmic', () => this.state.settings.useWmic)
    this.simpleSync('settings/is-in-kyoko-mode', () => this.state.settings.isInKyokoMode)
    this.simpleSync('is-administrator', () => this.state.isAdministrator)
  }

  private _setupMethodCall() {
    this.onCall('get-app-version', () => app.getVersion())

    this.onCall('set-setting/show-free-software-declaration', async (enabled) => {
      this.state.settings.setShowFreeSoftwareDeclaration(enabled)
      await this._sm.settings.set('app/show-free-software-declaration', enabled)
    })

    this.onCall('set-setting/close-strategy', async (s) => {
      this.state.settings.setCloseStrategy(s)
      await this._sm.settings.set('app/close-strategy', s)
    })

    this.onCall('set-setting/use-wmic', async (s) => {
      this.state.settings.setUseWmic(s)
      await this._sm.settings.set('app/use-wmic', s)
    })

    this.onCall('set-setting/is-in-kyoko-mode', async (b) => {
      this.state.settings.setInKyokoMode(b)
      await this._sm.settings.set('app/is-in-kyoko-mode', b)
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
    this.state.settings.setShowFreeSoftwareDeclaration(
      await this._sm.settings.get(
        'app/show-free-software-declaration',
        this.state.settings.showFreeSoftwareDeclaration
      )
    )

    this.state.settings.setCloseStrategy(
      await this._sm.settings.get('app/close-strategy', this.state.settings.closeStrategy)
    )

    this.state.settings.setUseWmic(
      await this._sm.settings.get('app/use-wmic', this.state.settings.useWmic)
    )

    this.state.settings.setInKyokoMode(
      await this._sm.settings.get('app/is-in-kyoko-mode', this.state.settings.isInKyokoMode)
    )
  }

  private _setupAkariProtocol() {
    this._handlePartitionAkariProtocol(MainWindowModule.PARTITION)
    this._handlePartitionAkariProtocol(AuxWindowModule.PARTITION)
  }

  private _handlePartitionAkariProtocol(partition: string) {
    session.fromPartition(partition).protocol.handle(AppModule.AKARI_PROTOCOL, async (req) => {
      const path = req.url.slice(`${AppModule.AKARI_PROTOCOL}://`.length)
      const index = path.indexOf('/')
      const domain = path.slice(0, index)
      const uri = path.slice(index + 1)

      const reqHeaders: Record<string, string> = {}
      req.headers.forEach((value, key) => {
        reqHeaders[key] = value
      })

      switch (domain) {
        case 'lcu':
          try {
            const res = await this._lcm.request({
              method: req.method,
              url: uri,
              data: req.body ? this._convertWebStreamToNodeStream(req.body) : undefined,
              validateStatus: () => true,
              responseType: 'stream',
              headers: reqHeaders
            })

            const resHeaders = Object.fromEntries(
              Object.entries(res.headers).filter(([_, value]) => typeof value === 'string')
            )

            return new Response(res.status === 204 || res.status === 304 ? null : res.data, {
              statusText: res.statusText,
              headers: resHeaders,
              status: res.status
            })
          } catch (error) {
            console.error(error)
            return new Response((error as Error).message, {
              headers: { 'Content-Type': 'text/plain' },
              status: 500
            })
          }
        default:
          return new Response(`Unknown akari zone: ${domain}`, {
            statusText: 'Not Found',
            headers: {
              'Content-Type': 'text/plain'
            },
            status: 404
          })
      }
    })
  }

  private _convertWebStreamToNodeStream(readableStream: ReadableStream) {
    const reader = readableStream.getReader()

    const nodeStream = Readable.from({
      async *[Symbol.asyncIterator]() {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          yield value
        }
      }
    })

    return nodeStream
  }

  registerAkariProtocolAsPrivileged() {
    protocol.registerSchemesAsPrivileged([
      {
        scheme: AppModule.AKARI_PROTOCOL,
        privileges: {
          standard: true,
          secure: true,
          supportFetchAPI: true,
          corsEnabled: true,
          stream: true,
          bypassCSP: true
        }
      }
    ])
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
          await this._sm.settings.set(resName, jsonValue)
          runInAction(() => setter(jsonValue))
          migrated = true
        } catch {}
      }
    }

    await _toNewSettings(
      'app.autoConnect',
      'lcu-connection/auto-connect',
      (s) => (this._lcm.state.settings.autoConnect = s)
    )
    await _toNewSettings(
      'app.autoCheckUpdates',
      'auto-update/auto-check-updates',
      (s) => (this._aum.state.settings.autoCheckUpdates = s)
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
