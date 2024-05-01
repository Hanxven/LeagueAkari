import { makeAutoObservable, observable } from 'mobx'

import { champSelect as cs } from '../lcu-state-sync/champ-select'
import { summoner } from '../lcu-state-sync/summoner'

class AutoSelectSettings {
  normalModeEnabled: boolean = false
  onlySimulMode: boolean = true
  expectedChampions: number[] = []
  selectTeammateIntendedChampion: boolean = false
  showIntent: boolean = false
  completed: boolean = false
  benchModeEnabled: boolean = false
  benchExpectedChampions: number[] = []
  grabDelaySeconds: number = 1
  banEnabled: boolean = false
  bannedChampions: number[] = []
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

  // get sessionInfo() {
  //   if (!cs.session) {
  //     return null
  //   }

  //   const memberMe = cs.session.myTeam.find((p) => p.puuid === summoner.me?.puuid)

  //   if (!memberMe) {
  //     return null
  //   }

  //   const myActions = cs.session.actions
  //     .map((arr) => {
  //       return arr.filter((a) => a.actorCellId === memberMe.cellId)
  //     })
  //     .filter((arr) => arr.length)

  //   return {
  //     myActions,
  //     hasSimultaneousPicks: cs.session.hasSimultaneousBans
  //   }
  // }

  constructor() {
    makeAutoObservable(this)
  }
}

export const autoSelectState = new AutoSelectState()
