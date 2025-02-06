import { Rectangle } from 'electron'
import { makeAutoObservable, observable } from 'mobx'

export class AuxWindowSettings {
  enabled: boolean = true
  autoShow: boolean = true
  opacity: number = 0.9
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

  functionalityBounds: Record<string, Partial<Rectangle>> = {}

  functionality: 'indicator' | 'opgg' = 'indicator'

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

  setFunctionality(f: 'indicator' | 'opgg') {
    this.functionality = f
  }

  setFunctionalityBounds(fb: Record<string, Partial<Rectangle>>) {
    this.functionalityBounds = fb
  }

  constructor() {
    makeAutoObservable(this, {
      bounds: observable.ref,
      functionalityBounds: observable.ref
    })
  }
}
