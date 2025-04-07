import { Rectangle } from 'electron'
import { makeAutoObservable, observable } from 'mobx'

export class AuxWindowSettings {
  enabled: boolean = true
  autoShow: boolean = true
  opacity: number = 1
  pinned: boolean = true
  showSkinSelector: boolean = false

  setOpacity(opacity: number) {
    this.opacity = opacity
  }

  setPinned(pinned: boolean) {
    this.pinned = pinned
  }

  setShowSkinSelector(show: boolean) {
    this.showSkinSelector = show
  }

  setAutoShow(autoShow: boolean) {
    this.autoShow = autoShow
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class AuxWindowState {
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
