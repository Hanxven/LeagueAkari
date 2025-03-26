import { AkariIpcRenderer } from '../ipc'
import { LoggerRenderer } from '../logger'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useLeagueClientUxStore } from './store'

const MAIN_SHARD_NAMESPACE = 'league-client-ux-main'

export class LeagueClientUxRenderer {
  static id = 'league-client-ux-renderer'
  static dependencies = [AkariIpcRenderer.id, PiniaMobxUtilsRenderer.id, SettingUtilsRenderer.id]

  private readonly _ipc: AkariIpcRenderer
  private readonly _pm: PiniaMobxUtilsRenderer
  private readonly _setting: SettingUtilsRenderer

  constructor(deps: any) {
    this._ipc = deps[AkariIpcRenderer.id]
    this._pm = deps[PiniaMobxUtilsRenderer.id]
    this._setting = deps[SettingUtilsRenderer.id]
  }

  setUseWmic(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'useWmic', enabled)
  }

  async onInit() {
    const store = useLeagueClientUxStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
  }
}
