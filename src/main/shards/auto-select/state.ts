import { Action } from '@shared/types/league-client/champ-select'
import { computed, makeAutoObservable, observable } from 'mobx'

import { LeagueClientData } from '../league-client/lc-state'

export type AutoPickStrategy = 'show' | 'lock-in' | 'show-and-delay-lock-in'

export const ARENA_RANDOM_CHAMPION_ID = -3

export class AutoSelectSettings {
  normalModeEnabled: boolean = false
  expectedChampions: Record<string, number[]> = {
    top: [],
    jungle: [],
    middle: [],
    bottom: [],
    utility: [],
    default: []
  }
  selectTeammateIntendedChampion: boolean = false
  showIntent: boolean = false
  pickStrategy: AutoPickStrategy = 'lock-in'
  lockInDelaySeconds: number = 0
  benchModeEnabled: boolean = false
  benchSelectFirstAvailableChampion: boolean = false
  benchHandleTradeEnabled: boolean = false
  benchHandleTradeIgnoreChampionOwner: boolean = true
  benchExpectedChampions: number[] = []
  grabDelaySeconds: number = 2.9
  banEnabled: boolean = false
  banDelaySeconds: number = 0
  bannedChampions: Record<string, number[]> = {
    top: [],
    jungle: [],
    middle: [],
    bottom: [],
    utility: [],
    default: []
  }
  banTeammateIntendedChampion: boolean = false

  setNormalModeEnabled(value: boolean) {
    this.normalModeEnabled = value
  }

  setExpectedChampions(value: Record<string, number[]>) {
    this.expectedChampions = value
  }

  setSelectTeammateIntendedChampion(value: boolean) {
    this.selectTeammateIntendedChampion = value
  }

  setShowIntent(value: boolean) {
    this.showIntent = value
  }

  setLockInDelaySeconds(value: number) {
    this.lockInDelaySeconds = value
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

  setBenchSelectFirstAvailableChampion(value: boolean) {
    this.benchSelectFirstAvailableChampion = value
  }

  setBanEnabled(value: boolean) {
    this.banEnabled = value
  }

  setBanDelaySeconds(value: number) {
    this.banDelaySeconds = value
  }

  setBannedChampions(value: Record<string, number[]>) {
    this.bannedChampions = value
  }

  setBanTeammateIntendedChampion(value: boolean) {
    this.banTeammateIntendedChampion = value
  }

  setBenchHandleTradeEnabled(value: boolean) {
    this.benchHandleTradeEnabled = value
  }

  setPickStrategy(value: AutoPickStrategy) {
    this.pickStrategy = value
  }

  constructor() {
    makeAutoObservable(this, {
      benchExpectedChampions: observable.struct,
      expectedChampions: observable.struct,
      bannedChampions: observable.struct
    })
  }
}

export class AutoSelectState {
  get champSelectActionInfo() {
    if (!this._lcData.champSelect.session || !this._lcData.champSelect.selfSummoner) {
      return null
    }

    const memberMe = this._lcData.champSelect.session.myTeam.find(
      (p) => p.cellId === this._lcData.champSelect.session?.localPlayerCellId
    )

    if (!memberMe) {
      return null
    }

    const result = this._lcData.champSelect.session.actions
      .map((arr) => {
        return arr.filter((a) => a.actorCellId === memberMe.cellId)
      })
      .filter((arr) => arr.length)

    const pickArr: Action[] = []
    for (const x of result) {
      for (const xx of x) {
        if (xx.type === 'pick') {
          pickArr.push(xx)
        }
      }
    }

    const banArr: Action[] = []
    for (const x of result) {
      for (const xx of x) {
        if (xx.type === 'ban') {
          banArr.push(xx)
        }
      }
    }

    return {
      pick: pickArr,
      ban: banArr,
      session: this._lcData.champSelect.session,
      memberMe,
      isActingNow: this._lcData.champSelect.selfSummoner.isActingNow,
      currentPickables: this._lcData.champSelect.currentPickableChampionIds,
      currentBannables: this._lcData.champSelect.currentBannableChampionIds,
      disabledChampions: this._lcData.champSelect.disabledChampionIds
    }
  }

  get memberMe() {
    if (!this.champSelectActionInfo) {
      return null
    }

    return this.champSelectActionInfo.memberMe
  }

  get targetPick() {
    if (!this._settings.normalModeEnabled) {
      return null
    }

    const a = this.champSelectActionInfo

    if (!a || !a.pick.length) {
      return null
    }

    // 第一个能用的 action
    const first = a.pick.find((e) => !e.completed)

    if (!first) {
      return null
    }

    const unpickables = new Set<number>()

    // 不能选择队友亮出的英雄, 以及自己已选定的英雄
    ;[...a.session.myTeam, ...a.session.theirTeam].forEach((t) => {
      if (!t.championId) {
        return
      }

      if (t.puuid === a.memberMe.puuid) {
        if (first.championId === t.championId && first.completed) {
          unpickables.add(t.championId)
        }
      } else {
        unpickables.add(t.championId)
      }
    })

    // 不允许重复选择时，场上已经选择的英雄不能选择
    if (!a.session.allowDuplicatePicks) {
      a.session.actions.forEach((arr) => {
        arr.forEach((ac) => {
          if (ac.completed) {
            unpickables.add(ac.championId)
          }
        })
      })
    }

    // 不能选择当前已经禁用完毕的英雄
    a.session.actions.forEach((arr) =>
      arr.forEach((a) => {
        if (a.type === 'ban' && a.completed) {
          unpickables.add(a.championId)
        }
      })
    )

    // 不能选用队友已经预选的英雄，不考虑自己的预选
    if (!this._settings.selectTeammateIntendedChampion) {
      a.session.myTeam.forEach((m) => {
        if (m.championPickIntent && m.puuid !== a.memberMe.puuid) {
          unpickables.add(m.championPickIntent)
        }
      })
    }

    // 不能选用已经被禁用的英雄 (兼容性)
    ;[...a.session.bans.myTeamBans, ...a.session.bans.theirTeamBans].forEach((c) =>
      unpickables.add(c)
    )

    let expectedChampions: number[]
    if (a.memberMe.assignedPosition) {
      const preset = this._settings.expectedChampions[a.memberMe.assignedPosition] || []
      expectedChampions = [...preset, ...this._settings.expectedChampions.default]
    } else {
      expectedChampions = this._settings.expectedChampions.default
    }

    const pickables = expectedChampions.filter(
      (c) => !unpickables.has(c) && a.currentPickables.has(c) && !a.disabledChampions.has(c)
    )

    if (!pickables.length) {
      return null
    }

    return {
      championId: pickables[0],
      isActingNow: a.isActingNow,
      action: {
        id: first.id,
        isInProgress: first.isInProgress,
        completed: first.completed
      }
    }
  }

  get targetBan() {
    if (!this._settings.banEnabled) {
      return null
    }

    const a = this.champSelectActionInfo

    if (!a || !a.ban.length) {
      return null
    }

    const first = a.ban.find((e) => !e.completed)

    if (!first) {
      return null
    }

    const unbannables = new Set<number>()

    // 已经禁用过的无需再 ban，空 ban 除外
    a.session.actions.forEach((arr) =>
      arr.forEach((a) => {
        if (a.type === 'ban' && a.completed && a.id !== -1) {
          unbannables.add(a.championId)
        }
      })
    )

    // 已经 ban 过的不用再 ban (兼容性)
    ;[...a.session.bans.myTeamBans, ...a.session.bans.theirTeamBans].forEach((t) => {
      unbannables.add(t)
    })

    // 不 ban 队友预选
    if (!this._settings.banTeammateIntendedChampion) {
      a.session.myTeam.forEach((m) => {
        if (m.championPickIntent && m.puuid !== a.memberMe.puuid) {
          unbannables.add(m.championPickIntent)
        }
      })
    }

    let bannedChampions: number[]
    if (a.memberMe.assignedPosition) {
      const preset = this._settings.bannedChampions[a.memberMe.assignedPosition] || []
      bannedChampions = [...preset, ...this._settings.bannedChampions.default]
    } else {
      bannedChampions = this._settings.bannedChampions.default
    }

    const bannables = bannedChampions.filter(
      (c) =>
        (c == -1 && !a.session.isCustomGame) ||
        (!unbannables.has(c) && a.currentBannables.has(c) && !a.disabledChampions.has(c))
    )

    if (!bannables.length) {
      return null
    }

    return {
      championId: bannables[0],
      isActingNow: a.isActingNow,
      action: {
        id: first.id,
        isInProgress: first.isInProgress,
        completed: first.completed
      }
    }
  }

  upcomingGrab: {
    championId: number
    willGrabAt: number
  } | null = null

  setUpcomingGrab(championId: number, at: number): void
  setUpcomingGrab(clear: null): void
  setUpcomingGrab(arg1: number | null, arg2?: number): void {
    if (arg1 === null) {
      this.upcomingGrab = null
      return
    }

    this.upcomingGrab = {
      championId: arg1,
      willGrabAt: arg2!
    }
  }

  upcomingPick: {
    championId: number
    willPickAt: number
  } | null = null

  setUpcomingPick(championId: number, at: number): void
  setUpcomingPick(clear: null): void
  setUpcomingPick(arg1: number | null, arg2?: number): void {
    if (arg1 === null) {
      this.upcomingPick = null
      return
    }

    this.upcomingPick = {
      championId: arg1,
      willPickAt: arg2!
    }
  }

  upcomingBan: {
    championId: number
    willBanAt: number
  } | null = null

  setUpcomingBan(championId: number, at: number): void
  setUpcomingBan(clear: null): void
  setUpcomingBan(arg1: number | null, arg2?: number): void {
    if (arg1 === null) {
      this.upcomingBan = null
      return
    }

    this.upcomingBan = {
      championId: arg1,
      willBanAt: arg2!
    }
  }

  get currentPhaseTimerInfo() {
    const timer = this._lcData.champSelect.session?.timer

    if (!timer) {
      return null
    }

    return {
      ...timer,
      adjustedTimeElapsedInPhase: Math.max(
        0,
        timer.totalTimeInPhase - timer.adjustedTimeLeftInPhase
      )
    }
  }

  constructor(
    private readonly _lcData: LeagueClientData,
    private readonly _settings: AutoSelectSettings
  ) {
    makeAutoObservable(this, {
      champSelectActionInfo: computed.struct,
      targetBan: computed.struct,
      targetPick: computed.struct,
      memberMe: computed.struct,
      currentPhaseTimerInfo: computed.struct,
      upcomingGrab: observable.struct,
      upcomingPick: observable.struct,
      upcomingBan: observable.struct
    })
  }
}
