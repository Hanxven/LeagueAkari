import { Rectangle } from 'electron'
import { makeAutoObservable, observable } from 'mobx'

export class OpggWindowSettings {
  enabled: boolean = true
  autoShow: boolean = true
  opacity: number = 1
  pinned: boolean = true
  showShortcut: string | null = null

  setOpacity(opacity: number) {
    this.opacity = opacity
  }

  setPinned(pinned: boolean) {
    this.pinned = pinned
  }

  setAutoShow(autoShow: boolean) {
    this.autoShow = autoShow
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  setShowShortcut(showShortcut: string | null) {
    this.showShortcut = showShortcut
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class OpggWindowState {
  status: 'normal' | 'maximized' | 'minimized' = 'normal'

  focus: 'focused' | 'blurred' = 'focused'

  /**
   * 对应 Electron 的 ready 事件
   */
  ready: boolean = false

  show: boolean = true

  bounds: Rectangle | null = null

  setStatus(status: 'normal' | 'maximized' | 'minimized') {
    this.status = status
  }

  setFocus(focus: 'focused' | 'blurred') {
    this.focus = focus
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
