import { Rectangle } from 'electron'
import { makeAutoObservable, observable } from 'mobx'

export class OngoingGameOverlayWindowSettings {
  enabled: boolean = true

  pinned: boolean = true

  opacity: number = 1

  showShortcut: string | null = null

  setPinned(pinned: boolean) {
    this.pinned = pinned
  }

  setOpacity(opacity: number) {
    this.opacity = opacity
  }

  setShowShortcut(shortcut: string | null) {
    this.showShortcut = shortcut
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class OngoingGameOverlayWindowState {
  status: 'normal' | 'maximized' | 'minimized' = 'normal'

  focus: 'focused' | 'blurred' = 'focused'

  ready: boolean = false

  show: boolean = true

  size: [number, number] = [1500, 860]

  bounds: Rectangle | null

  setStatus(status: 'normal' | 'maximized' | 'minimized') {
    this.status = status
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

  setBounds(bounds: Rectangle | null) {
    this.bounds = bounds
  }

  constructor() {
    makeAutoObservable(this, {
      bounds: observable.ref
    })
  }
}
