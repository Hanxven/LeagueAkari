import { MainWindowCloseStrategy } from '@shared/types/modules/app'
import { makeAutoObservable } from 'mobx'

export class AppSettings {
  /**
   * 使用 WMIC 查询命令行，而不是默认的 NtQueryInformationProcess
   */
  useWmic: boolean = false

  /**
   * 输出前置声明
   */
  showFreeSoftwareDeclaration: boolean = true

  /**
   * 关闭应用的默认行为
   */
  closeStrategy: MainWindowCloseStrategy = 'unset'

  /**
   * 禁用硬件加速, 特殊设置项, 仅用于展示
   */
  disableHardwareAcceleration: boolean = false

  /**
   * 是否位于调试模式，更多不稳定功能将被启用
   */
  isInKyokoMode: boolean = false

  setUseWmic(enabled: boolean) {
    this.useWmic = enabled
  }

  setShowFreeSoftwareDeclaration(enabled: boolean) {
    this.showFreeSoftwareDeclaration = enabled
  }

  setCloseStrategy(s: MainWindowCloseStrategy) {
    this.closeStrategy = s
  }

  setInKyokoMode(b: boolean) {
    this.isInKyokoMode = b
  }

  setDisableHardwareAcceleration(b: boolean) {
    this.disableHardwareAcceleration = b
  }

  constructor() {
    makeAutoObservable(this)
  }
}
