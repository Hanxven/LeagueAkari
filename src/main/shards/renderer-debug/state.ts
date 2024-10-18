import { makeAutoObservable } from 'mobx'

export class RendererDebugState {
  /**
   * 当为 true 时，将发送所有事件到主窗口渲染进程，仅用于调试
   */
  sendAllNativeLcuEvents = false

  setSendAllNativeLcuEvents(enabled: boolean) {
    this.sendAllNativeLcuEvents = enabled
  }

  constructor() {
    makeAutoObservable(this)
  }
}
