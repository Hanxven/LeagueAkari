import { makeAutoObservable, observable } from 'mobx'

export class LcuClientSettings {
  /**
   * 基于 Win32 API 的窗口调整方法
   */
  fixWindowMethodAOptions: {
    baseWidth: number
    baseHeight: number
  } = {
    baseWidth: 1600,
    baseHeight: 900
  }

  terminateGameClientOnAltF4 = false

  setFixWindowMethodAOptions(option: { baseWidth: number; baseHeight: number }) {
    this.fixWindowMethodAOptions = option
  }

  setTerminateGameClientOnAltF4(value: boolean) {
    this.terminateGameClientOnAltF4 = value
  }

  constructor() {
    makeAutoObservable(this, {
      fixWindowMethodAOptions: observable.ref
    })
  }
}
