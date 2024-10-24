import { makeAutoObservable } from 'mobx'

export class AppCommonState {
  isAdministrator: boolean = false

  /**
   * 仅用于展示, 是否禁用硬件加速
   */
  disableHardwareAcceleration: boolean = false

  setAdministrator(s: boolean) {
    this.isAdministrator = s
  }

  setDisableHardwareAcceleration(s: boolean) {
    this.disableHardwareAcceleration = s
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class AppCommonSettings {
  /**
   * 输出前置声明
   */
  showFreeSoftwareDeclaration: boolean = true

  /**
   * 是否位于调试模式
   */
  isInKyokoMode: boolean = false

  setShowFreeSoftwareDeclaration(s: boolean) {
    this.showFreeSoftwareDeclaration = s
  }

  setIsInKyokoMode(s: boolean) {
    this.isInKyokoMode = s
  }

  constructor() {
    makeAutoObservable(this)
  }
}
