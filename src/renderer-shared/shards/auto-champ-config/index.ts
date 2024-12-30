import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import i18next from 'i18next'
import { useTranslation } from 'i18next-vue'
import { watch } from 'vue'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { ChampionRunesConfig, SummonerSpellsConfig, useAutoChampConfigStore } from './store'

const MAIN_SHARD_NAMESPACE = 'auto-champ-config-main'

export class AutoChampConfigRenderer implements IAkariShardInitDispose {
  static id = 'auto-champ-config-renderer'
  static dependencies = [
    'akari-ipc-renderer',
    'setting-utils-renderer',
    'pinia-mobx-utils-renderer'
  ]

  private readonly _ipc: AkariIpcRenderer
  private readonly _pm: PiniaMobxUtilsRenderer
  private readonly _setting: SettingUtilsRenderer

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-renderer']
    this._pm = deps['pinia-mobx-utils-renderer']
    this._setting = deps['setting-utils-renderer']
  }

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

  async onDispose() {}
}
