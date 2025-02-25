import { makeAutoObservable } from 'mobx'

export class WindowManagerSettings {
  backgroundMaterial: 'mica' | 'none' = 'none'

  overlayType: 'window-band' | 'topmost' = 'window-band'

  setBackgroundMaterial(material: 'mica' | 'none') {
    this.backgroundMaterial = material
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class WindowManagerState {
  supportsMica: boolean = false

  isManagerFinishedInit: boolean = false

  setSupportsMica(supports: boolean) {
    this.supportsMica = supports
  }

  setManagerFinishedInit(ready: boolean) {
    this.isManagerFinishedInit = ready
  }

  constructor() {
    makeAutoObservable(this)
  }
}
