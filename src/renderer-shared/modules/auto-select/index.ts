import { StateSyncModule } from '@renderer-shared/akari-ipc/state-sync-module'

import { useAutoSelectStore } from './store'

export class AutoSelectRendererModule extends StateSyncModule {
  constructor() {
    super('auto-select')
  }

  override async setup() {
    await super.setup()

    this._syncMainState()
  }

  private _syncMainState() {
    const store = useAutoSelectStore()

    this.stateSync('state', store)
  }

  setNormalModeEnabled(value: boolean) {
    return this.call('set-setting', 'normalModeEnabled', value)
  }

  setExpectedChampions(value: Record<string, number[]>) {
    return this.call('set-setting', 'expectedChampions', value)
  }

  setSelectTeammateIntendedChampion(value: boolean) {
    return this.call('set-setting', 'selectTeammateIntendedChampion', value)
  }

  setShowIntent(value: boolean) {
    return this.call('set-setting', 'showIntent', value)
  }

  setCompleted(value: boolean) {
    return this.call('set-setting', 'completed', value)
  }

  setBenchModeEnabled(value: boolean) {
    return this.call('set-setting', 'benchModeEnabled', value)
  }

  setBenchSelectFirstAvailableChampion(value: boolean) {
    return this.call('set-setting', 'benchSelectFirstAvailableChampion', value)
  }

  setBenchExpectedChampions(value: number[]) {
    return this.call('set-setting', 'benchExpectedChampions', value)
  }

  setGrabDelaySeconds(value: number) {
    return this.call('set-setting', 'grabDelaySeconds', value)
  }

  setBanEnabled(value: boolean) {
    return this.call('set-setting', 'banEnabled', value)
  }

  setBannedChampions(value: Record<string, number[]>) {
    console.log(value)
    return this.call('set-setting', 'bannedChampions', value)
  }

  setBanTeammateIntendedChampion(value: boolean) {
    return this.call('set-setting', 'banTeammateIntendedChampion', value)
  }
}

export const autoSelectRendererModule = new AutoSelectRendererModule()
