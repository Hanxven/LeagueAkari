import {
  Augment,
  ChampionSimple,
  Item,
  Perk,
  Perkstyles,
  Queue,
  SummonerSpell
} from '@shared/types/lcu/game-data'
import { makeAutoObservable, observable } from 'mobx'

export class GameDataState {
  summonerSpells: Record<number | string, SummonerSpell> = {}
  items: Record<number | string, Item> = {}
  queues: Record<number | string, Queue> = {}
  perks: Record<number | string, Perk> = {}
  perkstyles: Record<number | string, Perkstyles['styles'][number]> = {}
  augments: Record<number | string, Augment> = {}
  champions: Record<number | string, ChampionSimple> = {}

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

  setSummonerSpells(value: Record<number | string, SummonerSpell>) {
    this.summonerSpells = value
  }

  setItems(value: Record<number | string, Item>) {
    this.items = value
  }

  setQueues(value: Record<number | string, Queue>) {
    this.queues = value
  }

  setPerks(value: Record<number | string, Perk>) {
    this.perks = value
  }

  setPerkStyles(value: Record<number | string, Perkstyles['styles'][number]>) {
    this.perkstyles = value
  }

  setAugments(value: Record<number | string, Augment>) {
    this.augments = value
  }

  setChampions(value: Record<number | string, ChampionSimple>) {
    this.champions = value
  }
}
