import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useAutoSelectStore = defineStore('feature:auto-select', () => {
  const settings = reactive({
    normalModeEnabled: false,

    onlySimulMode: true,

    expectedChampions: [] as number[],

    // 自动选择的时候是否避开队友预选
    selectTeammateIntendedChampion: false,

    selectRandomly: false,

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

    banRandomly: false,

    // ban 的时候是否考虑队友预选
    banTeammateIntendedChampion: false
  })

  return {
    settings
  }
})
