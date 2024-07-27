import { Action, ChampSelectSession, ChampSelectTeam } from '@shared/types/lcu/champ-select'
import { defineStore } from 'pinia'
import { markRaw, reactive, shallowRef } from 'vue'

export interface UpcomingActionInfo {
  championId: number
  isActionNow: boolean
  action: {
    id: number
    isInProgress: boolean
    completed: boolean
  }
}

export interface UpcomingGrabInfo {
  willGrabAt: number
  championId: number
}

export interface ChampSelectActionInfo {
  pick: Action[]
  ban: Action[]
  session: ChampSelectSession
  memberMe: ChampSelectTeam
  isActingNow: boolean
  currentPickables: Set<number>
  currentBannables: Set<number>
}

export const useAutoSelectStore = defineStore('module:auto-select', () => {
  const settings = reactive({
    normalModeEnabled: false,

    onlySimulMode: true,

    expectedChampions: markRaw({
      top: [],
      middle: [],
      bottom: [],
      jungle: [],
      utility: [],
      default: []
    } as Record<string, number[]>),

    // 自动选择的时候是否避开队友预选
    selectTeammateIntendedChampion: false,

    showIntent: false,

    // 是否立即秒选
    completed: false,

    // 如大乱斗
    benchModeEnabled: false,

    benchExpectedChampions: [] as number[],

    // 选择的延迟，单位秒
    grabDelaySeconds: 1,

    // 自动 ban
    banEnabled: false,

    bannedChampions: markRaw({
      top: [],
      middle: [],
      bottom: [],
      jungle: [],
      utility: [],
      default: []
    } as Record<string, number[]>),

    // ban 的时候是否考虑队友预选
    banTeammateIntendedChampion: false
  })

  const upcomingPick = shallowRef<UpcomingActionInfo | null>(null)

  const upcomingBan = shallowRef<UpcomingActionInfo | null>(null)

  const upcomingGrab = shallowRef<UpcomingGrabInfo | null>(null)

  const memberMe = shallowRef<ChampSelectTeam | null>(null)

  return {
    settings,
    upcomingBan,
    upcomingPick,
    upcomingGrab,
    memberMe
  }
})
