import { Rectangle } from "electron"
import { makeAutoObservable, observable } from "mobx"

class AuxiliaryWindowSettings {
  opacity: number = 0.9

  enabled: boolean = true

  showSkinSelector: boolean = false

  zoomFactor: number = 1.0

  isPinned = true

  autoShow: boolean = true

  setOpacity(opacity: number) {
    this.opacity = opacity
  }

  setEnabled(b: boolean) {
    this.enabled = b
  }

  setShowSkinSelector(b: boolean) {
    this.showSkinSelector = b
  }

  setZoomFactor(f: number) {
    this.zoomFactor = f
  }

  constructor() {
    makeAutoObservable(this)
  }

  setPinned(pinned: boolean) {
    this.isPinned = pinned
  }

  setAutoShow(autoShow: boolean) {
    this.autoShow = autoShow
  }
}

export class AuxiliaryWindowState {
  windowState: 'normal' | 'minimized' = 'normal'

  focusState: 'focused' | 'blurred' = 'focused'

  isShow: boolean = true

  isReady: boolean = false

  /**
   * 同步大小状态以持久化
   */
  bounds: Rectangle | null = null

  /**
   * 根据小窗充当的功能，记录功能窗口的位置
   */
  functionalityBounds: Record<string, Partial<Rectangle>> = {}

  /**
   * 小窗口当前充当的功能
   */
  currentFunctionality: 'indicator' | 'opgg' = 'indicator'

  settings = new AuxiliaryWindowSettings()

  constructor() {
    makeAutoObservable(this, {
      bounds: observable.ref,
      functionalityBounds: observable.ref
    })
  }

  setWindowState(s: 'normal' | 'minimized') {
    this.windowState = s
  }

  setFocusState(f: 'focused' | 'blurred' = 'focused') {
    this.focusState = f
  }

  setShow(show: boolean) {
    this.isShow = show
  }

  setReady(ready: boolean) {
    this.isReady = ready
  }

  setBounds(bounds: Rectangle | null) {
    this.bounds = bounds
  }

  setFunctionality(f: 'indicator' | 'opgg') {
    this.currentFunctionality = f
  }

  setFunctionalityBounds(fb: Record<string, Partial<Rectangle>>) {
    this.functionalityBounds = fb
  }
}
