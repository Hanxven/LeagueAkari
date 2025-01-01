import {
  Augment,
  ChampionSimple,
  Item,
  Perk,
  Perkstyles,
  Queue,
  SummonerSpell
} from '@shared/types/league-client/game-data'
import { makeAutoObservable, observable } from 'mobx'

export class GameDataState {
  summonerSpells: Record<number, SummonerSpell> = {}
  items: Record<number, Item> = {}
  queues: Record<number, Queue> = {}
  perks: Record<number, Perk> = {}
  perkstyles: {
    schemaVersion: number
    styles: Record<number, Perkstyles['styles'][number]>
  } = {
    schemaVersion: 0,
    styles: {}
  }
  augments: Record<number, Augment> = {}
  champions: Record<number, ChampionSimple> = {}

  championName(id: number) {
    return this.champions[id]?.name || id.toString()
  }

  constructor() {
    makeAutoObservable(this, {
      summonerSpells: observable.ref,
      augments: observable.ref,
      champions: observable.ref,
      items: observable.ref,
      perks: observable.ref,
      perkstyles: observable.ref,
      queues: observable.ref
    })
  }

  setSummonerSpells(value: Record<number, SummonerSpell>) {
    this.summonerSpells = value
  }

  setItems(value: Record<number, Item>) {
    this.items = value
  }

  setQueues(value: Record<number, Queue>) {
    this.queues = value
  }

  setPerks(value: Record<number, Perk>) {
    this.perks = value
  }

  setPerkStyles(value: {
    schemaVersion: number
    styles: Record<number, Perkstyles['styles'][number]>
  }) {
    this.perkstyles = value
  }

  setAugments(value: Record<number, Augment>) {
    this.augments = value
  }

  setChampions(value: Record<number, ChampionSimple>) {
    this.champions = value
  }
}
