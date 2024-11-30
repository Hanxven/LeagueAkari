import {
  ChampSelectSession,
  ChampSelectSummoner,
  OngoingTrade
} from '@shared/types/league-client/champ-select'
import { makeAutoObservable, observable } from 'mobx'

export class ChampSelectState {
  session: ChampSelectSession | null = null

  currentChampion: number | null = 0

  currentPickableChampionIdArray: number[] = []

  currentBannableChampionIdArray: number[] = []

  disabledChampionIdArray: number[] = []

  selfSummoner: ChampSelectSummoner | null = null

  ongoingTrade: OngoingTrade | null = null

  constructor() {
    makeAutoObservable(this, {
      session: observable.struct,
      currentPickableChampionIdArray: observable.struct,
      currentBannableChampionIdArray: observable.struct,
      disabledChampionIdArray: observable.struct,
      selfSummoner: observable.struct,
      ongoingTrade: observable.struct
    })
  }

  get currentPickableChampionIds() {
    const set = new Set<number>()
    this.currentPickableChampionIdArray.forEach((c) => set.add(c))
    return set
  }

  get currentBannableChampionIds() {
    const set = new Set<number>()
    this.currentBannableChampionIdArray.forEach((c) => set.add(c))
    return set
  }

  get disabledChampionIds() {
    const set = new Set<number>()
    this.disabledChampionIdArray.forEach((c) => set.add(c))
    return set
  }

  setSession(s: ChampSelectSession | null) {
    this.session = s
  }

  setCurrentPickableChampionArray(array: number[]) {
    this.currentPickableChampionIdArray = array
  }

  setCurrentBannableChampionArray(array: number[]) {
    this.currentBannableChampionIdArray = array
  }

  setSelfSummoner(s: ChampSelectSummoner | null) {
    this.selfSummoner = s
  }

  setCurrentChampion(c: number | null) {
    this.currentChampion = c
  }

  setDisabledChampionIds(ids: number[]) {
    this.disabledChampionIdArray = ids
  }

  setOngoingTrade(trade: OngoingTrade | null) {
    this.ongoingTrade = trade
  }
}
