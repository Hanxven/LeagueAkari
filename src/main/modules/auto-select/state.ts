import { Action } from '@shared/types/lcu/champ-select'
import { computed, makeAutoObservable, observable } from 'mobx'

import { appModule } from '../akari-core/app'
import { lcuSyncModule as lcu } from '../lcu-state-sync'

class AutoSelectSettings {
  normalModeEnabled: boolean = false
  onlySimulMode: boolean = false
  expectedChampions: number[] = []
  expectedChampions2: Record<string, number[]> = {
    top: [],
    jungle: [],
    middle: [],
    bottom: [],
    utility: [],
    default: []
  }
  selectTeammateIntendedChampion: boolean = false
  showIntent: boolean = false
  completed: boolean = false
  benchModeEnabled: boolean = false
  benchExpectedChampions: number[] = []
  grabDelaySeconds: number = 1
  banEnabled: boolean = false
  bannedChampions: number[] = []
  bannedChampions2: Record<string, number[]> = {
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

  setOnlySimulMode(value: boolean) {
    this.onlySimulMode = value
  }

  setExpectedChampions(value: number[]) {
    this.expectedChampions = value
  }

  setExpectedChampions2(value: Record<string, number[]>) {
    this.expectedChampions2 = value
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

  setBannedChampions2(value: Record<string, number[]>) {
    this.bannedChampions2 = value
  }

  setBanTeammateIntendedChampion(value: boolean) {
    this.banTeammateIntendedChampion = value
  }

  constructor() {
    makeAutoObservable(this, {
      expectedChampions: observable.struct,
      benchExpectedChampions: observable.struct,
      bannedChampions: observable.struct,
      expectedChampions2: observable.struct,
      bannedChampions2: observable.struct
    })
  }
}

export class AutoSelectState {
  settings = new AutoSelectSettings()

  get champSelectActionInfo() {
    if (!lcu.champSelect.session || !lcu.champSelect.selfSummoner) {
      return null
    }

    const memberMe = lcu.champSelect.session.myTeam.find((p) => p.puuid === lcu.summoner.me?.puuid)

    if (!memberMe) {
      return null
    }

    const result = lcu.champSelect.session.actions
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
      session: lcu.champSelect.session,
      memberMe,
      isActingNow: lcu.champSelect.selfSummoner.isActingNow,
      currentPickables: lcu.champSelect.currentPickableChampions,
      currentBannables: lcu.champSelect.currentBannableChampions
    }
  }

  get upcomingPick() {
    if (!this.settings.normalModeEnabled) {
      return null
    }

    const a = this.champSelectActionInfo

    if (!a || !a.pick.length) {
      return null
    }

    if (!a.session.hasSimultaneousPicks && this.settings.onlySimulMode) {
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
      if (t.championId && t.puuid !== lcu.summoner.me!.puuid) {
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
    if (!this.settings.selectTeammateIntendedChampion) {
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
      // 出于可用性考虑，若存在分路信息，若提供的分路信息不在当前应用的支持范围内，则使用默认列表
      expectedChampions =
        this.settings.expectedChampions2[a.memberMe.assignedPosition] ||
        this.settings.expectedChampions2.default
    } else {
      expectedChampions = this.settings.expectedChampions2.default
    }

    // 现在可选的英雄，排除不可选的和服务器当前允许选择的 (受制于热禁用等)
    // DEBUG PBE 模式整活，仅限 Kyoko 模式
    const pickables = expectedChampions.filter(
      (c) =>
        !unpickables.has(c) &&
        ((appModule.state.settings.isInKyokoMode && c >= 3000) || a.currentPickables.has(c))
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
    if (!this.settings.banEnabled) {
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
    if (!this.settings.banTeammateIntendedChampion) {
      a.session.myTeam.forEach((m) => {
        if (m.championPickIntent && m.puuid !== a.memberMe.puuid) {
          unbannables.add(m.championPickIntent)
        }
      })
    }

    let bannedChampions: number[]
    if (a.memberMe.assignedPosition) {
      bannedChampions =
        this.settings.bannedChampions2[a.memberMe.assignedPosition] ||
        this.settings.bannedChampions2.default
    } else {
      bannedChampions = this.settings.bannedChampions2.default
    }

    const bannables = bannedChampions.filter(
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
