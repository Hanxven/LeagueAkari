import { StateSyncModule } from '@renderer-shared/akari-ipc/state-sync-module'

import { useAuxiliaryWindowStore } from './store'

export class AuxWindowRendererModule extends StateSyncModule {
  constructor() {
    super('auxiliary-window')
  }

  override async setup() {
    await super.setup()

    await this._syncMainState()
  }

  private async _syncMainState() {
    const store = useAuxiliaryWindowStore()

    store.currentFunctionality = await this.getFunctionality()

    this.stateSync('state', store)
  }

  setSize(width: number, height: number) {
    return this.call('set-size', width, height)
  }

  getSize() {
    return this.call('get-size')
  }

  minimize() {
    return this.call('minimize')
  }

  hide() {
    return this.call('hide')
  }

  toggleDevTools() {
    return this.call('toggle-devtools')
  }

  setOpacity(opacity: number) {
    return this.call('set-setting', 'opacity', opacity)
  }

  setAlwaysOnTop(top: boolean) {
    return this.call('set-setting', 'isPinned', top)
  }

  resetWindowPosition() {
    return this.call('reset-window-position')
  }

  setEnabled(enabled: boolean) {
    return this.call('set-setting', 'enabled', enabled)
  }

  setShowSkinSelector(b: boolean) {
    return this.call('set-setting', 'showSkinSelector', b)
  }

  setZoomFactor(f: number) {
    return this.call('set-setting', 'zoomFactor', f)
  }

  setWindowSize(width: number, height: number) {
    return this.call('set-window-size', width, height)
  }

  getWindowSize(): Promise<{ width: number; height: number }> {
    return this.call('get-window-size')
  }

  setFunctionality(f: string) {
    return this.call('set-functionality', f)
  }

  getFunctionality() {
    return this.call('get-functionality')
  }

  show() {
    return this.call('show')
  }
}

export const auxiliaryWindowRendererModule = new AuxWindowRendererModule()
