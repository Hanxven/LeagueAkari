import { Rectangle } from 'electron'
import { makeAutoObservable, observable } from 'mobx'

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

  /**
   * 是否启用辅助窗口
   */
  auxWindowEnabled: boolean = true

  /*
    是否在合适的时机自动显示辅助窗口
   */
  auxWindowAutoShow: boolean = true

  /**
   * 辅助窗口透明度
   */
  auxWindowOpacity: number = 0.9

  /**
   * 辅助窗口是否固定在最前
   */
  auxWindowPinned: boolean = true

  /**
   * 一个小工具
   */
  auxWindowShowSkinSelector: boolean = false

  setAuxWindowOpacity(opacity: number) {
    this.auxWindowOpacity = opacity
  }

  setAuxWindowPinned(pinned: boolean) {
    this.auxWindowPinned = pinned
  }

  setAuxWindowShowSkinSelector(show: boolean) {
    this.auxWindowShowSkinSelector = show
  }

  setMainWindowCloseAction(action: MainWindowCloseAction) {
    this.mainWindowCloseAction = action
  }

  setAutoShowAuxWindow(autoShow: boolean) {
    this.auxWindowAutoShow = autoShow
  }

  setAuxWindowEnabled(enabled: boolean) {
    this.auxWindowEnabled = enabled
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class WindowManagerState {
  mainWindowStatus: 'normal' | 'maximized' | 'minimized' = 'normal'
  mainWindowFocus: 'focused' | 'blurred' = 'focused'
  mainWindowReady: boolean = false
  mainWindowShow: boolean = true
  mainWindowSize: [number, number] = [1256, 780]

  auxWindowStatus: 'normal' | 'maximized' | 'minimized' = 'normal'
  auxWindowFocus: 'focused' | 'blurred' = 'focused'
  auxWindowReady: boolean = false
  auxWindowShow: boolean = true
  auxWindowBounds: Rectangle | null = null
  auxWindowFunctionalityBounds: Record<string, Partial<Rectangle>> = {}
  auxWindowFunctionality: 'indicator' | 'opgg' = 'indicator'

  supportsMica: boolean = false

  isShardsReady: boolean = false

  setMainWindowStatus(status: 'normal' | 'maximized' | 'minimized') {
    this.mainWindowStatus = status
  }

  setMainWindowFocus(focus: 'focused' | 'blurred') {
    this.mainWindowFocus = focus
  }

  setMainWindowReady(ready: boolean) {
    this.mainWindowReady = ready
  }

  setMainWindowShow(show: boolean) {
    this.mainWindowShow = show
  }

  setMainWindowSize(size: [number, number]) {
    this.mainWindowSize = size
  }

  setAuxWindowStatus(status: 'normal' | 'maximized' | 'minimized') {
    this.auxWindowStatus = status
  }

  setAuxWindowFocus(focus: 'focused' | 'blurred') {
    this.auxWindowFocus = focus
  }

  setAuxWindowReady(ready: boolean) {
    this.auxWindowReady = ready
  }

  setAuxWindowShow(show: boolean) {
    this.auxWindowShow = show
  }

  setAuxWindowBounds(bounds: Rectangle | null) {
    this.auxWindowBounds = bounds
  }

  setAuxWindowFunctionality(f: 'indicator' | 'opgg') {
    this.auxWindowFunctionality = f
  }

  setAuxWindowFunctionalityBounds(fb: Record<string, Partial<Rectangle>>) {
    this.auxWindowFunctionalityBounds = fb
  }

  setSupportsMica(supports: boolean) {
    this.supportsMica = supports
  }

  setShardsReady(ready: boolean) {
    this.isShardsReady = ready
  }

  constructor() {
    makeAutoObservable(this, {
      auxWindowBounds: observable.ref,
      auxWindowFunctionalityBounds: observable.ref,
      mainWindowSize: observable.ref
    })
  }
}
