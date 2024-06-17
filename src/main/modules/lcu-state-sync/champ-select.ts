import { ChampSelectSession, ChampSelectSummoner } from '@shared/types/lcu/champ-select'
import { makeAutoObservable, observable } from 'mobx'

export class ChampSelectState {
  session: ChampSelectSession | null = null

  currentChampion: number | null = 0

  currentPickableChampionArray: number[] = []

  currentBannableChampionArray: number[] = []

  selfSummoner: ChampSelectSummoner | null = null

  constructor() {
    makeAutoObservable(this, {
      session: observable.struct,
      currentPickableChampionArray: observable.struct,
      currentBannableChampionArray: observable.struct,
      selfSummoner: observable.struct
    })
  }

  get currentPickableChampions() {
    const set = new Set<number>()
    this.currentPickableChampionArray.forEach((c) => set.add(c))
    return set
  }

  get currentBannableChampions() {
    const set = new Set<number>()
    this.currentBannableChampionArray.forEach((c) => set.add(c))
    return set
  }

  setSession(s: ChampSelectSession | null) {
    this.session = s
  }

  setCurrentPickableChampionArray(array: number[]) {
    this.currentPickableChampionArray = array
  }

  setCurrentBannableChampionArray(array: number[]) {
    this.currentBannableChampionArray = array
  }

  setSelfSummoner(s: ChampSelectSummoner | null) {
    this.selfSummoner = s
  }

  setCurrentChampion(c: number | null) {
    this.currentChampion = c
  }
}
