import { ChampSelectTeam } from '@shared/types/league-client/champ-select'
import { defineStore } from 'pinia'
import { shallowReactive, shallowRef } from 'vue'

// copied from main shard
interface UpcomingBanPick {
  championId: number
  isActingNow: boolean
  action: {
    id: number
    isInProgress: boolean
    completed: boolean
  }
}

export type PlaceInfo =
  | {
      place: 'bench'
    }
  | {
      place: 'player'
      puuid: string
      cellId: number
    }

export type AdditionalPlaceInfo =
  | { place: 'unknown' } // 凭空出现
  | { place: 'reroll' } // reroll
  | { place: 'initial' } // 初始分配

export interface TrackEvent {
  championId: number
  from: PlaceInfo | AdditionalPlaceInfo
  to: PlaceInfo
  timestamp: number
}

export const useAutoSelectStore = defineStore('shard:auto-select-renderer', () => {
  const settings = shallowReactive({
    normalModeEnabled: false,
    expectedChampions: {
      top: [],
      jungle: [],
      middle: [],
      bottom: [],
      utility: [],
      default: []
    },
    selectTeammateIntendedChampion: false,
    showIntent: false,
    pickStrategy: 'lock-in',
    lockInDelaySeconds: 0,
    benchModeEnabled: false,
    benchSelectFirstAvailableChampion: false,
    benchHandleTradeEnabled: false,
    benchHandleTradeIgnoreChampionOwner: false,
    benchExpectedChampions: [],
    grabDelaySeconds: 1,
    banEnabled: false,
    banDelaySeconds: 0,
    bannedChampions: {
      top: [],
      jungle: [],
      middle: [],
      bottom: [],
      utility: [],
      default: []
    },
    banTeammateIntendedChampion: false
  })

  const targetPick = shallowRef<UpcomingBanPick | null>(null)
  const targetBan = shallowRef<UpcomingBanPick | null>(null)
  const memberMe = shallowRef<ChampSelectTeam | null>(null)
  const upcomingGrab = shallowRef<{ championId: number; willGrabAt: number } | null>(null)
  const upcomingPick = shallowRef<{ championId: number; willPickAt: number } | null>(null)
  const upcomingBan = shallowRef<{ championId: number; willBanAt: number } | null>(null)

  const aramTracker = shallowReactive({
    recordedEvents: [] as TrackEvent[],
    isJoinAfterSession: false
  })

  return {
    settings,

    targetPick,
    targetBan,
    upcomingGrab,
    memberMe,
    upcomingPick,
    upcomingBan,

    aramTracker
  }
})
