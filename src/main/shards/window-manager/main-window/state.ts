import { makeAutoObservable, observable } from 'mobx'

/**
 * 主窗口关闭策略
 * - minimize-to-tray: 最小化到托盘
 * - quit: 退出应用
 * - ask: 询问用户
 */
export type MainWindowCloseAction = 'minimize-to-tray' | 'quit' | 'ask'

/**
 * 分离设置项到独立的类
 */
export class MainWindowSettings {
  closeAction: MainWindowCloseAction = 'ask'

  setCloseAction(action: MainWindowCloseAction) {
    this.closeAction = action
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class MainWindowState {
  status: 'normal' | 'maximized' | 'minimized' = 'normal'

  focus: 'focused' | 'blurred' = 'focused'

  /**
   * 对应 Electron 的 ready 事件
   */
  ready: boolean = false

  show: boolean = true

  size: [number, number] = [1380, 860]

  setStatus(status: 'normal' | 'maximized' | 'minimized') {
    this.status = status
  }

  setFocus(focus: 'focused' | 'blurred') {
    this.focus = focus
  }

  setReady(ready: boolean) {
    this.ready = ready
  }

  setShow(show: boolean) {
    this.show = show
  }

  setSize(size: [number, number]) {
    this.size = size
  }

  constructor() {
    makeAutoObservable(this, {
      size: observable.ref
    })
  }
}
