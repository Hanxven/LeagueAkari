import { makeAutoObservable } from 'mobx'

import { lcuSyncModule as lcu } from '../lcu-state-sync'

export type AutoHonorStrategy =
  | 'prefer-lobby-member' // 随机优先组队时房间内成员
  | 'only-lobby-member' // 随机仅限组队时房间内成员
  | 'all-member' // 随机所有可点赞玩家
  | 'opt-out' // 直接跳过
  | 'all-member-including-opponent' // 随机所有可点赞玩家，包括对手

export type AutoSearchRematchStrategy = 'never' | 'fixed-duration' | 'estimated-duration'

class AutoGameflowSettings {
  autoHonorEnabled: boolean = false
  autoHonorStrategy: AutoHonorStrategy = 'prefer-lobby-member'

  playAgainEnabled: boolean = false

  autoAcceptEnabled: boolean = false
  autoAcceptDelaySeconds: number = 0

  autoMatchmakingEnabled: boolean = false
  autoMatchmakingMaximumMatchDuration: number = 0
  autoMatchmakingRematchStrategy: AutoSearchRematchStrategy = 'never'
  autoMatchmakingRematchFixedDuration: number = 2
  autoMatchmakingDelaySeconds: number = 5
  autoMatchmakingMinimumMembers = 1 // 最低满足人数
  autoMatchmakingWaitForInvitees: boolean = true // 等待邀请中的用户

  dodgeAtLastSecondThreshold: number = 2

  setAutoHonorEnabled(enabled: boolean) {
    this.autoHonorEnabled = enabled
  }

  setAutoHonorStrategy(strategy: AutoHonorStrategy) {
    this.autoHonorStrategy = strategy
  }

  setPlayAgainEnabled(enabled: boolean) {
    this.playAgainEnabled = enabled
  }

  setAutoAcceptEnabled(enabled: boolean) {
    this.autoAcceptEnabled = enabled
  }

  setAutoAcceptDelaySeconds(seconds: number) {
    this.autoAcceptDelaySeconds = seconds
  }

  setAutoMatchmakingEnabled(enabled: boolean) {
    this.autoMatchmakingEnabled = enabled
  }

  setAutoMatchmakingDelaySeconds(seconds: number) {
    this.autoMatchmakingDelaySeconds = seconds
  }

  setAutoMatchmakingMinimumMembers(count: number) {
    this.autoMatchmakingMinimumMembers = count
  }

  setAutoMatchmakingWaitForInvitees(yes: boolean) {
    this.autoMatchmakingWaitForInvitees = yes
  }

  setAutoMatchmakingRematchStrategy(s: AutoSearchRematchStrategy) {
    this.autoMatchmakingRematchStrategy = s
  }

  setAutoMatchmakingRematchFixedDuration(seconds: number) {
    this.autoMatchmakingRematchFixedDuration = seconds
  }

  setDodgeAtLastSecondThreshold(threshold: number) {
    this.dodgeAtLastSecondThreshold = threshold
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class AutoGameflowState {
  settings = new AutoGameflowSettings()

  /**
   * 即将进行自动接受操作
   */
  willAccept: boolean = false

  /**
   * 即将进行的自动接受操作将在指定时间戳完成
   */
  willAcceptAt: number = -1

  willSearchMatch: boolean = false

  /**
   * 即将进行的匹配开始的时间
   */
  willSearchMatchAt: number = -1

  /**
   * 即将进行的秒退操作将在指定时间执行
   */
  willDodgeAt: number = -1

  /**
   * 是否在最后一秒秒退
   */
  willDodgeAtLastSecond: boolean = false

  get activityStartStatus() {
    if (!lcu.lobby.lobby) {
      return 'unavailable'
    }

    if (lcu.gameflow.session?.gameData.isCustomGame) {
      return 'unavailable'
    }

    const self = lcu.lobby.lobby.members.find((m) => m.puuid === lcu.summoner.me?.puuid)

    if (self) {
      if (!self.isLeader) {
        return 'not-the-leader'
      }
    } else {
      return 'unavailable'
    }

    if (lcu.matchmaking.search) {
      const errors = lcu.matchmaking.search.errors
      const maxPenaltyTime = errors.reduce(
        (prev, cur) => Math.max(cur.penaltyTimeRemaining, prev),
        -Infinity
      )

      if (maxPenaltyTime > 0) {
        return 'waiting-for-penalty-time'
      }
    }

    if (this.settings.autoMatchmakingWaitForInvitees) {
      const hasPendingInvitation = lcu.lobby.lobby.invitations.some((i) => i.state === 'Pending')
      if (hasPendingInvitation) {
        return 'waiting-for-invitees'
      }
    }

    if (lcu.lobby.lobby.members.length < this.settings.autoMatchmakingMinimumMembers) {
      return 'insufficient-members'
    }

    if (lcu.lobby.lobby.canStartActivity) {
      return 'can-start-activity'
    } else {
      return 'cannot-start-activity'
    }
  }

  setAcceptAt(at: number) {
    this.willAccept = true
    this.willAcceptAt = at
  }

  setSearchMatchAt(at: number) {
    this.willSearchMatch = true
    this.willSearchMatchAt = at
  }

  setWillDodgeAtLastSecond(yes: boolean) {
    this.willDodgeAtLastSecond = yes
  }

  setDodgeAt(at: number) {
    this.willDodgeAt = at
  }

  clearAutoAccept() {
    this.willAccept = false
    this.willAcceptAt = -1
  }

  clearAutoSearchMatch() {
    this.willSearchMatch = false
    this.willSearchMatchAt = -1
  }

  constructor() {
    makeAutoObservable(this)
  }
}
