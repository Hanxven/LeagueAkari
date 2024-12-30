import { makeAutoObservable, observable } from 'mobx'

export interface ChampionRunesConfig {
  primaryStyleId: number
  subStyleId: number
  selectedPerkIds: number[]
}

export interface SummonerSpellsConfig {
  spell1Id: number
  spell2Id: number
}

interface ChampionRunesV2Preset {
  [key: number]: Record<string, ChampionRunesConfig | null>
}

interface SummonerSpellsPreset {
  // 英雄 - 唯一 ID
  [key: number]: Record<string, SummonerSpellsConfig | null>
}

export class AutoChampConfigSettings {
  enabled = false

  /**
   * 对应 LCU 数据 schemaVersion: 2
   */
  runesV2: ChampionRunesV2Preset = {}

  summonerSpells: SummonerSpellsPreset = {}

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  replaceRunes(championPresets: ChampionRunesV2Preset) {
    this.runesV2 = championPresets
  }

  updateRunes(championId: number, key: string, runeConfig: ChampionRunesConfig | null) {
    const newObj = { ...this.runesV2[championId], [key]: runeConfig }
    this.runesV2 = { ...this.runesV2, [championId]: newObj }
  }

  replaceSummonerSpells(SummonerSpellsPresets: SummonerSpellsPreset) {
    this.summonerSpells = SummonerSpellsPresets
  }

  updateSummonerSpells(championId: number, key: string, spellConfig: SummonerSpellsConfig | null) {
    console.log('updateSummonerSpells', championId, key, spellConfig)
    const newObj = { ...this.summonerSpells[championId], [key]: spellConfig }
    this.summonerSpells = { ...this.summonerSpells, [championId]: newObj }
  }

  constructor() {
    makeAutoObservable(this, {
      runesV2: observable.ref,
      summonerSpells: observable.ref
    })
  }
}
