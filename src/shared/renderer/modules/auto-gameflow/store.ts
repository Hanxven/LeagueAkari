import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export const useAutoGameflowStore = defineStore('module:auto-gameflow', () => {
  const settings = reactive({
    autoHonorEnabled: false,
    autoHonorStrategy: 'prefer-lobby-member',
    playAgainEnabled: false,
    autoAcceptEnabled: false,
    autoAcceptDelaySeconds: 0,
    autoSearchMatchEnabled: false,
    autoSearchMatchDelaySeconds: 0,
    autoSearchMatchMinimumMembers: 0,
    autoSearchMatchWaitForInvitees: true
  })

  const willAccept = ref(false)

  // 即将自动接受对局的时间 (有误差)
  const willAcceptAt = ref(-1)

  const willSearchMatch = ref(false)

  const willSearchMatchAt = ref(-1)

  const activityStartStatus = ref('unavailable')

  return {
    settings,
    willAccept,
    willAcceptAt,
    willSearchMatch,
    willSearchMatchAt,
    activityStartStatus
  }
})
