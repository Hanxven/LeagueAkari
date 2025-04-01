import { Rectangle } from 'electron'
import { makeAutoObservable, observable } from 'mobx'

export class CdTimerWindowSettings {
  enabled: boolean = false

  pinned: boolean = true

  opacity: number = 1

  showShortcut: string | null = null

  /**
   * 默认计时器的类型
   * - countdown: 倒计时模式, 使用默认的技能冷却时间
   * - countup: 正计时模式, 从 0 开始计时
   * 对于自定义的计时器, 永远为 countup
   */
  timerType: 'countdown' | 'countup' = 'countdown'

  setPinned(pinned: boolean) {
    this.pinned = pinned
  }

  setOpacity(opacity: number) {
    this.opacity = opacity
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  setShowShortcut(showShortcut: string | null) {
    this.showShortcut = showShortcut
  }

  setTimerType(timerType: 'countdown' | 'countup') {
    this.timerType = timerType
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class CdTimerWindowState {
  status: 'normal' | 'maximized' | 'minimized' = 'normal'

  focus: 'focused' | 'blurred' = 'focused'

  ready: boolean = false

  show: boolean = true

  bounds: Rectangle | null

  /**
   * 支持的游戏模式, 基准时间被硬编码
   */
  supportedGameModes: {
    gameMode: string
    abilityHaste: number
  }[] = [
    { gameMode: 'CLASSIC', abilityHaste: 0 },
    { gameMode: 'ARAM', abilityHaste: 70 },
    { gameMode: 'URF', abilityHaste: 300 },
    { gameMode: 'ONEFORALL', abilityHaste: 0 },
    { gameMode: 'NEXUSBLITZ', abilityHaste: 0 },
    { gameMode: 'ULTBOOK', abilityHaste: 0 },
    { gameMode: 'ONEFORALL', abilityHaste: 0 }
  ]

  gameTime: number | null = null

  setStatus(status: 'normal' | 'maximized' | 'minimized') {
    this.status = status
  }

  setReady(ready: boolean) {
    this.ready = ready
  }

  setShow(show: boolean) {
    this.show = show
  }

  setBounds(bounds: Rectangle | null) {
    this.bounds = bounds
  }

  setSupportedGameModes(
    supportedGameModes: {
      gameMode: string
      abilityHaste: number
    }[]
  ) {
    this.supportedGameModes = supportedGameModes
  }

  setGameTime(gameTime: number | null) {
    this.gameTime = gameTime
  }

  constructor() {
    makeAutoObservable(this, {
      bounds: observable.ref,
      supportedGameModes: observable.ref
    })
  }
}
