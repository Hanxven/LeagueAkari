import { makeAutoObservable } from 'mobx'

export class WindowManagerSettings {
  backgroundMaterial: 'mica' | 'none' = 'none'

  setBackgroundMaterial(material: 'mica' | 'none') {
    this.backgroundMaterial = material
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class WindowManagerState {
  supportsMica: boolean = false

  isShardsReady: boolean = false

  setSupportsMica(supports: boolean) {
    this.supportsMica = supports
  }

  setShardsReady(ready: boolean) {
    this.isShardsReady = ready
  }

  constructor() {
    makeAutoObservable(this)
  }
}
