import { makeAutoObservable } from 'mobx'

export type AutoHonorStrategy =
  | 'prefer-lobby-member' // 随机优先组队时房间内成员
  | 'only-lobby-member' // 随机仅限组队时房间内成员
  | 'all-member' // 随机所有可点赞玩家
  | 'opt-out' // 直接跳过

class AutoHonorSettings {
  enabled: boolean = false
  strategy: AutoHonorStrategy = 'prefer-lobby-member'

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  setStrategy(strategy: AutoHonorStrategy) {
    this.strategy = strategy
  }

  constructor() {
    makeAutoObservable(this)
  }
}

class AutoHonorState {
  settings = new AutoHonorSettings()

  constructor() {
    makeAutoObservable(this)
  }
}

export const autoHonorState = new AutoHonorState()
