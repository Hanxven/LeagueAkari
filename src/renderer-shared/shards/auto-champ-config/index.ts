import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { ChampionRunesConfig, SummonerSpellsConfig, useAutoChampConfigStore } from './store'

const MAIN_SHARD_NAMESPACE = 'auto-champ-config-main'

@Shard(AutoChampConfigRenderer.id)
export class AutoChampConfigRenderer implements IAkariShardInitDispose {
  static id = 'auto-champ-config-renderer'

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer
  ) {}

  async onInit() {
    const store = useAutoChampConfigStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
  }

  updateRunes(championId: number, mode: string, runes: ChampionRunesConfig | null) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'updateRunes', championId, mode, runes)
  }

  updatePositionRunes(
    championId: number,
    mode: string,
    position: string,
    runes: ChampionRunesConfig | null
  ) {
    return this._ipc.call(
      MAIN_SHARD_NAMESPACE,
      'updateRunes',
      championId,
      `${mode}-${position}`,
      runes
    )
  }

  updateSummonerSpells(championId: number, mode: string, spells: SummonerSpellsConfig | null) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'updateSummonerSpells', championId, mode, spells)
  }

  updatePositionSummonerSpells(
    championId: number,
    mode: string,
    position: string,
    spells: SummonerSpellsConfig | null
  ) {
    return this._ipc.call(
      MAIN_SHARD_NAMESPACE,
      'updateSummonerSpells',
      championId,
      `${mode}-${position}`,
      spells
    )
  }

  setEnabled(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'enabled', enabled)
  }

  async onDispose() {}
}
