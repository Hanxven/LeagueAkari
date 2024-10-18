import { makeAutoObservable } from 'mobx'

/**
 * 主窗口关闭策略
 * - minimize-to-tray: 最小化到托盘
 * - quit: 退出应用
 * - ask: 询问用户
 */
export type MainWindowCloseAction = 'minimize-to-tray' | 'quit' | 'ask'

export class WindowManagerSettings {
  /**
   * 关闭主窗口时采取的行动
   */
  mainWindowCloseAction: MainWindowCloseAction = 'ask'

  /*
    是否在合适的时机自动显示辅助窗口
   */
  autoShowAuxWindow: boolean = true

  setMainWindowCloseAction(action: MainWindowCloseAction) {
    this.mainWindowCloseAction = action
  }

  setAutoShowAuxWindow(autoShow: boolean) {
    this.autoShowAuxWindow = autoShow
  }

  constructor() {
    makeAutoObservable(this)
  }
}
