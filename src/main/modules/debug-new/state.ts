import { makeAutoObservable } from 'mobx'

class DebugSettings {
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

export class DebugState {
  settings = new DebugSettings()

  constructor() {
    makeAutoObservable(this)
  }
}

export const debugState = new DebugState()
