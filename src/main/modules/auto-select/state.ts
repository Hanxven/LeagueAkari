import { Action } from '@shared/types/lcu/champ-select'
import { computed, makeAutoObservable, observable } from 'mobx'

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

  get champSelectActionInfo() {
    if (!cs.session || !cs.selfSummoner) {
      return null
    }

    const memberMe = cs.session.myTeam.find((p) => p.puuid === summoner.me?.puuid)

    if (!memberMe) {
      return null
    }

    const result = cs.session.actions
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
      session: cs.session,
      memberMe,
      isActingNow: cs.selfSummoner.isActingNow,
      currentPickables: cs.currentPickableChampions,
      currentBannables: cs.currentBannableChampions
    }
  }

  get upcomingPick() {
    if (
      !autoSelectState.settings.expectedChampions ||
      !autoSelectState.settings.normalModeEnabled
    ) {
      return null
    }

    const a = this.champSelectActionInfo

    if (!a || !a.pick.length) {
      return null
    }

    if (!a.session.hasSimultaneousPicks && autoSelectState.settings.onlySimulMode) {
      return null
    }

    if (a.memberMe.championId) {
      return null
    }

    // 第一个能用的 action
    const first = a.pick.find((e) => !e.completed)

    if (!first) {
      return null
    }

    const unpickables = new Set<number>()

    // 不能选择队友 (包括自己) 已经选择或亮出的英雄
    ;[...a.session.myTeam, ...a.session.theirTeam].forEach((t) => {
      if (t.championId && t.puuid !== summoner.me!.puuid) {
        unpickables.add(t.championId)
      }
    })

    // 队友已经选择的英雄不可用
    a.session.myTeam.forEach((m) => {
      unpickables.add(m.championId)
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
    if (!autoSelectState.settings.selectTeammateIntendedChampion) {
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

    // 现在可选的英雄，排除不可选的和服务器当前允许选择的 (受制于热禁用等)
    const pickables = autoSelectState.settings.expectedChampions.filter(
      (c) => !unpickables.has(c) && a.currentPickables.has(c)
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

  get upcomingBan() {
    if (!autoSelectState.settings.banEnabled) {
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
    if (!autoSelectState.settings.banTeammateIntendedChampion) {
      a.session.myTeam.forEach((m) => {
        if (m.championPickIntent && m.puuid !== a.memberMe.puuid) {
          unbannables.add(m.championPickIntent)
        }
      })
    }

    const bannables = autoSelectState.settings.bannedChampions.filter(
      (c) =>
        (c == -1 && !a.session.isCustomGame) || (!unbannables.has(c) && a.currentBannables.has(c))
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

  constructor() {
    makeAutoObservable(this, {
      champSelectActionInfo: computed.struct,
      upcomingBan: computed.struct,
      upcomingPick: computed.struct,
      upcomingGrab: observable.struct
    })
  }
}

export const autoSelectState = new AutoSelectState()
