import { makeAutoObservable, observable } from 'mobx'

interface ChampionRunePreset {
  [key: number]: Record<string, number[] | null>
}

export class AutoRuneSettings {
  enabled = false

  /**
   * 对应 LCU 数据 schemaVersion: 2
   */
  presetsV2: ChampionRunePreset = {}

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  replacePresets(championPresets: ChampionRunePreset) {
    this.presetsV2 = championPresets
  }

  updatePresetChampion(championId: number, position: string, runes: number[] | null) {
    const newObj = { ...this.presetsV2[championId], [position]: runes }
    this.presetsV2 = { ...this.presetsV2, [championId]: newObj }
  }

  constructor() {
    makeAutoObservable(this, {
      presetsV2: observable.ref
    })
  }
}
