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

    this.getterSync('settings/is-pinned', (s) => (store.settings.isPinned = s))
    this.getterSync('settings/opacity', (s) => (store.settings.opacity = s))
    this.getterSync('settings/enabled', (s) => (store.settings.enabled = s))
    this.getterSync('settings/show-skin-selector', (s) => (store.settings.showSkinSelector = s))
    this.getterSync('settings/zoom-factor', (s) => (store.settings.zoomFactor = s))

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
    return this.call('set-setting/opacity', opacity)
  }

  setAlwaysOnTop(top: boolean) {
    return this.call('set-setting/is-pinned', top)
  }

  resetWindowPosition() {
    return this.call('reset-window-position')
  }

  setEnabled(enabled: boolean) {
    return this.call('set-setting/enabled', enabled)
  }

  setShowSkinSelector(b: boolean) {
    return this.call('set-setting/show-skin-selector', b)
  }

  setZoomFactor(f: number) {
    return this.call('set-setting/zoom-factor', f)
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
