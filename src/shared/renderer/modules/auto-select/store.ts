import { defineStore } from 'pinia'
import { reactive, shallowRef } from 'vue'

export interface UpcomingActionInfo {
  championId: number
  isActionNow: boolean
  action: {
    id: number
    isInProgress: boolean
    completed: boolean
  }
}

export const useAutoSelectStore = defineStore('feature:auto-select', () => {
  const settings = reactive({
    normalModeEnabled: false,

    onlySimulMode: true,

    expectedChampions: [] as number[],

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

    bannedChampions: [] as number[],

    // ban 的时候是否考虑队友预选
    banTeammateIntendedChampion: false
  })

  const upcomingPick = shallowRef<UpcomingActionInfo | null>(null)

  const upcomingBan = shallowRef<UpcomingActionInfo | null>(null)

  return {
    settings,
    upcomingBan,
    upcomingPick
  }
})
