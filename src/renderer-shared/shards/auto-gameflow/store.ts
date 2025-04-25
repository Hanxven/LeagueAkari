import { defineStore } from 'pinia'
import { ref, shallowReactive, shallowRef } from 'vue'

// copied from main shard
export type AutoHonorStrategy =
  | 'prefer-lobby-member'
  | 'only-lobby-member'
  | 'all-member'
  | 'opt-out'
  | 'all-member-including-opponent'

// copied from main shard
export type AutoMatchmakingStrategy = 'never' | 'fixed-duration' | 'estimated-duration'

export const useAutoGameflowStore = defineStore('shard:auto-gameflow-renderer', () => {
  const settings = shallowReactive({
    autoHonorEnabled: false,
    autoHonorStrategy: 'prefer-lobby-member' as AutoHonorStrategy,
    playAgainEnabled: false,
    autoAcceptEnabled: false,
    autoAcceptDelaySeconds: 0,
    autoReconnectEnabled: false,
    autoMatchmakingEnabled: false,
    autoMatchmakingMaximumMatchDuration: 0,
    autoMatchmakingRematchStrategy: 'never' as AutoMatchmakingStrategy,
    autoMatchmakingRematchFixedDuration: 2,
    autoMatchmakingDelaySeconds: 5,
    autoMatchmakingMinimumMembers: 1,
    autoMatchmakingWaitForInvitees: true,
    autoHandleInvitationsEnabled: false,
    autoSkipLeaderEnabled: false,
    invitationHandlingStrategies: {} as Record<string, string>,
    dodgeAtLastSecondThreshold: 2,
    rejectInvitationWhenAway: false
  })

  const willAccept = ref(false)
  const willAcceptAt = ref(-1)
  const willSearchMatch = ref(false)
  const willSearchMatchAt = ref(-1)
  const willDodgeAt = ref(-1)
  const willDodgeAtLastSecond = ref(false)
  const activityStartStatus = ref('unavailable')

  return {
    settings,

    willAccept,
    willAcceptAt,
    willSearchMatch,
    willSearchMatchAt,
    willDodgeAt,
    willDodgeAtLastSecond,
    activityStartStatus
  }
})
