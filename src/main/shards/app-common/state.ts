import { BaseConfig } from '@main/bootstrap/base-config'
import { makeAutoObservable, observable } from 'mobx'

export class AppCommonState {
  isAdministrator: boolean = false

  /**
   * 仅用于展示, 是否禁用硬件加速
   */
  disableHardwareAcceleration: boolean = false

  baseConfig: BaseConfig | null

  setAdministrator(s: boolean) {
    this.isAdministrator = s
  }

  setDisableHardwareAcceleration(s: boolean) {
    this.disableHardwareAcceleration = s
  }

  setBaseConfig(s: BaseConfig | null) {
    this.baseConfig = s
  }

  constructor() {
    makeAutoObservable(this, { baseConfig: observable.ref })
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

  /**
   * 语言
   */
  locale: string = 'zh-CN'

  setShowFreeSoftwareDeclaration(s: boolean) {
    this.showFreeSoftwareDeclaration = s
  }

  setIsInKyokoMode(s: boolean) {
    this.isInKyokoMode = s
  }

  setLocale(s: string) {
    this.locale = s
  }

  constructor() {
    makeAutoObservable(this)
  }
}
