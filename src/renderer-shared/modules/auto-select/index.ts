import { StateSyncModule } from '@renderer-shared/akari-ipc/state-sync-module'
import { set } from 'lodash'
import { markRaw } from 'vue'

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

    this.sync(store, 'auto-select', 'upcomingBan')
    this.sync(store, 'auto-select', 'upcomingPick')
    this.sync(store, 'auto-select', 'upcomingGrab')
    this.sync(store, 'auto-select', 'memberMe')

    this.simpleSync('settings/normal-mode-enabled', (s) => (store.settings.normalModeEnabled = s))
    this.simpleSync(
      'settings/expected-champions-multi',
      (s) => (store.settings.expectedChampions = markRaw(s))
    )
    this.simpleSync(
      'settings/select-teammate-intended-champion',
      (s) => (store.settings.selectTeammateIntendedChampion = s)
    )
    this.simpleSync('settings/show-intent', (s) => (store.settings.showIntent = s))
    this.simpleSync('settings/completed', (s) => (store.settings.completed = s))
    this.simpleSync('settings/bench-mode-enabled', (s) => (store.settings.benchModeEnabled = s))
    this.simpleSync(
      'settings/bench-expected-champions',
      (s) => (store.settings.benchExpectedChampions = s)
    )
    this.simpleSync('settings/grab-delay-seconds', (s) => (store.settings.grabDelaySeconds = s))
    this.simpleSync(
      'settings/bench-select-first-available-champion',
      (s) => (store.settings.benchSelectFirstAvailableChampion = s)
    )
    this.simpleSync('settings/ban-enabled', (s) => (store.settings.banEnabled = s))
    this.simpleSync(
      'settings/banned-champions-multi',
      (s) => (store.settings.bannedChampions = markRaw(s))
    )
    this.simpleSync(
      'settings/ban-teammate-intended-champion',
      (s) => (store.settings.banTeammateIntendedChampion = s)
    )
  }

  setNormalModeEnabled(value: boolean) {
    return this.call('set-setting/normal-mode-enabled', value)
  }

  setExpectedChampions(value: Record<string, number[]>) {
    return this.call('set-setting/expected-champions-multi', value)
  }

  setSelectTeammateIntendedChampion(value: boolean) {
    return this.call('set-setting/select-teammate-intended-champion', value)
  }

  setShowIntent(value: boolean) {
    return this.call('set-setting/show-intent', value)
  }

  setCompleted(value: boolean) {
    return this.call('set-setting/completed', value)
  }

  setBenchModeEnabled(value: boolean) {
    return this.call('set-setting/bench-mode-enabled', value)
  }

  setBenchSelectFirstAvailableChampion(value: boolean) {
    return this.call('set-setting/bench-select-first-available-champion', value)
  }

  setBenchExpectedChampions(value: number[]) {
    return this.call('set-setting/bench-expected-champions', value)
  }

  setGrabDelaySeconds(value: number) {
    return this.call('set-setting/grab-delay-seconds', value)
  }

  setBanEnabled(value: boolean) {
    return this.call('set-setting/ban-enabled', value)
  }

  setBannedChampions(value: Record<string, number[]>) {
    return this.call('set-setting/banned-champions-multi', value)
  }

  setBanTeammateIntendedChampion(value: boolean) {
    return this.call('set-setting/ban-teammate-intended-champion', value)
  }
}

export const autoSelectRendererModule = new AutoSelectRendererModule()
