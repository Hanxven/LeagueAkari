import { MobxBasedBasicModule } from '@main/akari-ipc/modules/mobx-based-basic-module'
import { makeAutoObservable, observable } from 'mobx'

import toolkit from '../../native/laToolkitWin32x64.node'
import { queryLcuAuth, queryLcuAuthNative } from '../../utils/lcu-auth'
import { AppModule } from './app'
import { LcuConnectionModule } from './lcu-connection'
import { AppLogger, LogModule } from './log'
import { PlatformModule } from './platform'

class LcuClientSettings {
  /**
   * 基于 Win32 API 的窗口调整方法
   */
  fixWindowMethodAOptions: {
    baseWidth: number
    baseHeight: number
  } = {
    baseWidth: 1600,
    baseHeight: 900
  }

  terminateGameClientOnAltF4 = false

  setFixWindowMethodsAOptions(option: { baseWidth: number; baseHeight: number }) {
    this.fixWindowMethodAOptions = option
  }

  setTerminateGameClientOnAltF4(value: boolean) {
    this.terminateGameClientOnAltF4 = value
  }

  constructor() {
    makeAutoObservable(this, {
      fixWindowMethodAOptions: observable.ref
    })
  }
}

export class LeagueClientModule extends MobxBasedBasicModule {
  public settings = new LcuClientSettings()

  private _logger: AppLogger
  private _appModule: AppModule
  private _lcm: LcuConnectionModule
  private _pm: PlatformModule

  static LEAGUE_CLIENT_UX_PROCESS_NAME = 'LeagueClientUx.exe'
  static LEAGUE_GAME_CLIENT_PROCESS_NAME = 'League of Legends.exe'

  static TERMINATE_DELAY = 200

  constructor() {
    super('league-client')
  }

  override async setup() {
    await super.setup()

    this._logger = this.manager.getModule<LogModule>('log').createLogger('league-client')
    this._appModule = this.manager.getModule('app')
    this._lcm = this.manager.getModule('lcu-connection')
    this._pm = this.manager.getModule('win-platform')

    await this._setupSettingsSync()
    this._setupMethodCall()
    this._handleTerminateGameClientOnAltF4()

    this._logger.info('初始化完成')
  }

  private async _setupSettingsSync() {
    this.simpleSettingSync(
      'fix-window-method-a-options',
      () => this.settings.fixWindowMethodAOptions,
      (s) => this.settings.setFixWindowMethodsAOptions(s)
    )

    this.simpleSettingSync(
      'terminate-game-client-on-alt-f4',
      () => this.settings.terminateGameClientOnAltF4,
      (s) => this.settings.setTerminateGameClientOnAltF4(s)
    )
  }

  private _setupMethodCall() {
    this.onCall('fix-window-method-a', async () => {
      if (!this._appModule.state.isAdministrator) {
        throw new Error('insufficient permissions')
      }

      const instance = this._lcm.lcuHttp
      if (!instance) {
        throw new Error('LCU not connected')
      }

      try {
        const scale = await instance.request({
          url: '/riotclient/zoom-scale',
          method: 'GET'
        })

        toolkit.fixWindowMethodA(scale.data, this.settings.fixWindowMethodAOptions)
      } catch (error) {
        throw error
      }
    })

    this.onCall('get-launched-clients', async () => {
      return this.getLaunchedClients()
    })

    this.onCall('terminate-game-client', () => {
      this._terminateGameClient()
    })
  }

  private _handleTerminateGameClientOnAltF4() {
    let leftAltPressed = false
    let rightAltPressed = false

    this._pm.gkl?.addListener((event) => {
      if (event.name === 'LEFT ALT') {
        leftAltPressed = event.state === 'DOWN'
      } else if (event.name === 'RIGHT ALT') {
        rightAltPressed = event.state === 'DOWN'
      } else if (
        event.name === 'F4' &&
        (leftAltPressed || rightAltPressed) &&
        event.state === 'DOWN'
      ) {
        if (this.settings.terminateGameClientOnAltF4) {
          this._terminateGameClient()
        }
      }
    })
  }

  private _terminateGameClient() {
    toolkit.getPidsByName(LeagueClientModule.LEAGUE_GAME_CLIENT_PROCESS_NAME).forEach((pid) => {
      if (!toolkit.isProcessForeground(pid)) {
        return
      }

      this._logger.info(`终止游戏客户端进程 ${pid}`)

      // 这里设置 200 ms，用于使客户端消耗 Alt+F4 事件，避免穿透
      setTimeout(() => {
        toolkit.terminateProcess(pid)
      }, LeagueClientModule.TERMINATE_DELAY)
    })
  }

  getLaunchedClients() {
    if (this._appModule.state.settings.useWmic) {
      if (!this._appModule.state.isAdministrator) {
        throw new Error('insufficient permissions')
      }

      return queryLcuAuth(LeagueClientModule.LEAGUE_CLIENT_UX_PROCESS_NAME)
    }

    return queryLcuAuthNative(LeagueClientModule.LEAGUE_CLIENT_UX_PROCESS_NAME)
  }

  isGameClientForeground() {
    const pids = toolkit.getPidsByName(LeagueClientModule.LEAGUE_GAME_CLIENT_PROCESS_NAME)
    if (pids.length === 0) {
      return false
    }

    return toolkit.isProcessForeground(pids[0])
  }
}

export const leagueClientModule = new LeagueClientModule()
