import { makeAutoObservable, observable } from 'mobx'

interface ChampionRuneConfig {
  primaryStyleId: number
  subStyleId: number
  selectedPerkIds: number[]
}

interface SummonerSpellConfig {
  spell1Id: number
  spell2Id: number
}

interface ChampionRuneV2Preset {
  [key: number]: Record<string, ChampionRuneConfig | null>
}

interface SummonerSpellPreset {
  [key: number]: Record<string, SummonerSpellConfig | null>
}

export class AutoChampConfigSettings {
  enabled = false

  /**
   * 对应 LCU 数据 schemaVersion: 2
   */
  runeV2Presets: ChampionRuneV2Preset = {}

  summonerSpellPresets: SummonerSpellPreset = {}

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  replaceRunePresets(championPresets: ChampionRuneV2Preset) {
    this.runeV2Presets = championPresets
  }

  updateRulePresetChampion(
    championId: number,
    position: string,
    runeConfig: ChampionRuneConfig | null
  ) {
    const newObj = { ...this.runeV2Presets[championId], [position]: runeConfig }
    this.runeV2Presets = { ...this.runeV2Presets, [championId]: newObj }
  }

  replaceSummonerSpellPresets(summonerSpellPresets: SummonerSpellPreset) {
    this.summonerSpellPresets = summonerSpellPresets
  }

  updateSummonerSpellPreset(
    championId: number,
    position: string,
    spellConfig: SummonerSpellConfig | null
  ) {
    const newObj = { ...this.summonerSpellPresets[championId], [position]: spellConfig }
    this.summonerSpellPresets = { ...this.summonerSpellPresets, [championId]: newObj }
  }

  constructor() {
    makeAutoObservable(this, {
      runeV2Presets: observable.ref,
      summonerSpellPresets: observable.ref
    })
  }
}
