import { MobxBasedModule } from '@main/akari-ipc/mobx-based-module'
import { makeAutoObservable, observable } from 'mobx'

import toolkit from '../../native/laToolkitWin32x64.node'
import { queryLcuAuth, queryLcuAuthNative } from '../../utils/lcu-auth'
import { AppModule } from './app'
import { LcuConnectionModule } from './lcu-connection'
import { AppLogger, LogModule } from './log'
import { StorageModule } from './storage'

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

  setFixWindowMethodsAOptions(option: { baseWidth: number; baseHeight: number }) {
    this.fixWindowMethodAOptions = option
  }

  constructor() {
    makeAutoObservable(this, {
      fixWindowMethodAOptions: observable.ref
    })
  }
}

export class LcuClientModule extends MobxBasedModule {
  public settings = new LcuClientSettings()

  private _logger: AppLogger
  private _storageModule: StorageModule
  private _appModule: AppModule
  private _lcm: LcuConnectionModule

  static LEAGUE_CLIENT_UX_PROCESS_NAME = 'LeagueClientUx.exe'

  constructor() {
    super('lcu-client')
  }

  override async setup() {
    await super.setup()

    this._logger = this.manager.getModule<LogModule>('log').createLogger('lcu-client')
    this._storageModule = this.manager.getModule('storage')
    this._appModule = this.manager.getModule('app')
    this._lcm = this.manager.getModule('lcu-connection')

    await this._loadSettings()
    this._setupStateSync()
    this._setupMethodCall()

    this._logger.info('初始化完成')
  }

  private async _loadSettings() {
    this.settings.setFixWindowMethodsAOptions(
      await this._storageModule.getSetting(
        'league-client-ux/fix-window-method-a-options',
        this.settings.fixWindowMethodAOptions
      )
    )
  }

  private _setupStateSync() {
    this.simpleSync(
      'settings/fix-window-method-a-options',
      () => this.settings.fixWindowMethodAOptions
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

    this.onCall('set-setting/fix-window-method-a-options', async (option) => {
      this.settings.setFixWindowMethodsAOptions(option)
      await this._storageModule.setSetting('league-client-ux/fix-window-method-a-options', option)
    })

    this.onCall('query-lcu-auth', async () => {
      return this.getLaunchedClients()
    })
  }

  getLaunchedClients() {
    if (this._appModule.state.settings.useWmic) {
      if (!this._appModule.state.isAdministrator) {
        throw new Error('insufficient permissions')
      }

      return queryLcuAuth(LcuClientModule.LEAGUE_CLIENT_UX_PROCESS_NAME)
    }

    return queryLcuAuthNative(LcuClientModule.LEAGUE_CLIENT_UX_PROCESS_NAME)
  }
}

export const lcuClientModule = new LcuClientModule()
