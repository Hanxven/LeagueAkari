import { makeAutoObservable, observable } from 'mobx'

class AutoSelectSettings {
  normalModeEnabled: boolean = false
  onlySimulMode: boolean = true
  expectedChampions: number[] = []
  selectTeammateIntendedChampion: boolean = false
  selectRandomly: boolean = false
  showIntent: boolean = false
  completed: boolean = false
  benchModeEnabled: boolean = false
  benchExpectedChampions: number[] = []
  grabDelaySeconds: number = 1
  banEnabled: boolean = false
  bannedChampions: number[] = []
  banRandomly: boolean = false
  banTeammateIntendedChampion: boolean = false

  setNormalModeEnabled(value: boolean) {
    this.normalModeEnabled = value
  }

  setOnlySimulMode(value: boolean) {
    this.onlySimulMode = value
  }

  setExpectedChampions(value: number[]) {
    this.expectedChampions = value
  }

  setSelectTeammateIntendedChampion(value: boolean) {
    this.selectTeammateIntendedChampion = value
  }

  setSelectRandomly(value: boolean) {
    this.selectRandomly = value
  }

  setShowIntent(value: boolean) {
    this.showIntent = value
  }

  setCompleted(value: boolean) {
    this.completed = value
  }

  setBenchModeEnabled(value: boolean) {
    this.benchModeEnabled = value
  }

  setBenchExpectedChampions(value: number[]) {
    this.benchExpectedChampions = value
  }

  setGrabDelaySeconds(value: number) {
    this.grabDelaySeconds = value
  }

  setBanEnabled(value: boolean) {
    this.banEnabled = value
  }

  setBannedChampions(value: number[]) {
    this.bannedChampions = value
  }

  setBanRandomly(value: boolean) {
    this.banRandomly = value
  }

  setBanTeammateIntendedChampion(value: boolean) {
    this.banTeammateIntendedChampion = value
  }

  constructor() {
    makeAutoObservable(this, {
      expectedChampions: observable.struct,
      benchExpectedChampions: observable.struct,
      bannedChampions: observable.struct
    })
  }
}

class AutoSelectState {
  settings = new AutoSelectSettings()

  constructor() {
    makeAutoObservable(this)
  }
}

export const autoSelectState = new AutoSelectState()
