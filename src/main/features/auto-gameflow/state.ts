import { makeAutoObservable } from 'mobx'

export type AutoHonorStrategy =
  | 'prefer-lobby-member' // 随机优先组队时房间内成员
  | 'only-lobby-member' // 随机仅限组队时房间内成员
  | 'all-member' // 随机所有可点赞玩家
  | 'opt-out' // 直接跳过

class AutoGameflowSettings {
  autoHonorEnabled: boolean = false
  autoHonorStrategy: AutoHonorStrategy = 'prefer-lobby-member'

  playAgainEnabled: boolean = false

  autoAcceptEnabled: boolean = false
  autoAcceptDelaySeconds: number = 0

  autoSearchMatchEnabled: boolean

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

  constructor() {
    makeAutoObservable(this)
  }
}

class AutoGameflowState {
  settings = new AutoGameflowSettings()

  /**
   * 即将进行自动接受操作
   */
  willAutoAccept = false

  /**
   * 即将进行的自动接受操作将在指定时间戳完成
   */
  willAutoAcceptAt = -1

  /**
   * 即将进行的匹配开始的时间
   */
  willSearchMatchAt = -1

  setAutoAcceptAt(at: number) {
    this.willAutoAccept = true
    this.willAutoAcceptAt = at
  }

  clearAutoAccept() {
    this.willAutoAccept = false
    this.willAutoAcceptAt = -1
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export const autoGameflowState = new AutoGameflowState()
