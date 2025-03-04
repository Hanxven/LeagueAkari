import { Rectangle } from 'electron'
import { makeAutoObservable, observable } from 'mobx'

export class OngoingGameWindowSettings {
  enabled: boolean = false

  pinned: boolean = true

  opacity: number = 1

  showShortcut: string | null = null

  setPinned(pinned: boolean) {
    this.pinned = pinned
  }

  setOpacity(opacity: number) {
    this.opacity = opacity
  }

  setShowShortcut(shortcut: string | null) {
    this.showShortcut = shortcut
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class OngoingGameWindowState {
  status: 'normal' | 'maximized' | 'minimized' = 'normal'

  focus: 'focused' | 'blurred' = 'focused'

  ready: boolean = false

  show: boolean = true

  bounds: Rectangle | null

  /**
   * 用于指示渲染层面的显示状态，不会影响窗口的实际显示状态
   */
  fakeShow: boolean = false

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

  setFakeShow(show: boolean) {
    this.fakeShow = show
  }

  constructor() {
    makeAutoObservable(this, {
      bounds: observable.ref
    })
  }
}
