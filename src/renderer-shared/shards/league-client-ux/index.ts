import { Dep, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useLeagueClientUxStore } from './store'

const MAIN_SHARD_NAMESPACE = 'league-client-ux-main'

@Shard(LeagueClientUxRenderer.id)
export class LeagueClientUxRenderer {
  static id = 'league-client-ux-renderer'

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer
  ) {}

  setUseWmic(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'useWmic', enabled)
  }

  rebuildWmi() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'rebuildWmi')
  }

  async onInit() {
    const store = useLeagueClientUxStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
  }
}
