import { makeAutoObservable, observable } from 'mobx'

export class MainWindowState {
  windowState: 'normal' | 'maximized' | 'minimized' = 'normal'

  focusState: 'focused' | 'blurred' = 'focused'

  ready: boolean = false

  isShow: boolean = true

  windowSize: [number, number] = [1256, 780]

  constructor() {
    makeAutoObservable(this, {
      windowSize: observable.ref
    })
  }

  setWindowState(s: 'normal' | 'maximized' | 'minimized') {
    this.windowState = s
  }

  setFocusState(f: 'focused' | 'blurred' = 'focused') {
    this.focusState = f
  }

  setShow(show: boolean) {
    this.isShow = show
  }

  setReady(ready: boolean) {
    this.ready = ready
  }

  setWindowSize(size: [number, number]) {
    this.windowSize = size
  }
}
