import { AkariIpcRenderer } from '../ipc'
import { LoggerRenderer } from '../logger'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useLeagueClientUxStore } from './store'

const MAIN_SHARD_NAMESPACE = 'league-client-ux-main'

export class LeagueClientUxRenderer {
  static id = 'league-client-ux-renderer'
  static dependencies = [
    'akari-ipc-renderer',
    'pinia-mobx-utils-renderer',
    'setting-utils-renderer'
  ]

  private readonly _ipc: AkariIpcRenderer
  private readonly _pm: PiniaMobxUtilsRenderer
  private readonly _setting: SettingUtilsRenderer

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-renderer']
    this._pm = deps['pinia-mobx-utils-renderer']
    this._setting = deps['setting-utils-renderer']
  }

  setUseWmic(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'useWmic', enabled)
  }

  async onInit() {
    const store = useLeagueClientUxStore()

    this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
  }
}
