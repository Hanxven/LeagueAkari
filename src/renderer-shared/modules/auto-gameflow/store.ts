import { defineStore } from 'pinia'
import { markRaw, reactive, ref } from 'vue'

export const useAutoGameflowStore = defineStore('module:auto-gameflow', () => {
  const settings = reactive({
    autoHonorEnabled: false,
    autoHonorStrategy: 'prefer-lobby-member',
    playAgainEnabled: false,
    autoAcceptEnabled: false,
    autoAcceptDelaySeconds: 0,
    autoReconnectEnabled: false,
    autoMatchmakingEnabled: false,
    autoMatchmakingDelaySeconds: 0,
    autoMatchmakingMinimumMembers: 0,
    autoMatchmakingWaitForInvitees: true,
    autoMatchmakingRematchStrategy: 'never',
    autoMatchmakingRematchFixedDuration: 2,
    dodgeAtLastSecondThreshold: 2,
    autoHandleInvitationsEnabled: false,
    invitationHandlingStrategies: markRaw({}) as Record<string, string>
  })

  const willAccept = ref(false)

  // 即将自动接受对局的时间 (有误差)
  const willAcceptAt = ref(-1)

  const willRematchAt = ref(-1)

  const willSearchMatch = ref(false)

  const willSearchMatchAt = ref(-1)

  const activityStartStatus = ref('unavailable')

  const willDodgeAt = ref(-1)
  const willDodgeAtLastSecond = ref(false)

  return {
    settings,
    willAccept,
    willAcceptAt,
    willSearchMatch,
    willRematchAt,
    willSearchMatchAt,
    activityStartStatus,
    willDodgeAt,
    willDodgeAtLastSecond
  }
})
