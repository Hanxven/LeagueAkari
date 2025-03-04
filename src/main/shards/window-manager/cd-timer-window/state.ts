import { Rectangle } from 'electron'
import { makeAutoObservable, observable } from 'mobx'

export class CdTimerWindowSettings {
  enabled: boolean = true

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

  constructor() {
    makeAutoObservable(this, {
      bounds: observable.ref
    })
  }
}
