import { makeAutoObservable } from 'mobx'

export class RendererDebugState {
  /**
   * 当为 true 时，将发送所有事件到主窗口渲染进程，仅用于调试
   */
  sendAllNativeLcuEvents = false

  logAllLcuEvents = false

  setSendAllNativeLcuEvents(enabled: boolean) {
    this.sendAllNativeLcuEvents = enabled
  }

  setLogAllLcuEvents(enabled: boolean) {
    this.logAllLcuEvents = enabled
  }

  constructor() {
    makeAutoObservable(this)
  }
}
