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

    this.dotPropSync(store, 'auto-select', 'upcomingBan')
    this.dotPropSync(store, 'auto-select', 'upcomingPick')
    this.dotPropSync(store, 'auto-select', 'upcomingGrab')
    this.dotPropSync(store, 'auto-select', 'memberMe')

    this.getterSync('settings/normal-mode-enabled', (s) => (store.settings.normalModeEnabled = s))
    this.getterSync(
      'settings/expected-champions-multi',
      (s) => (store.settings.expectedChampions = markRaw(s))
    )
    this.getterSync(
      'settings/select-teammate-intended-champion',
      (s) => (store.settings.selectTeammateIntendedChampion = s)
    )
    this.getterSync('settings/show-intent', (s) => (store.settings.showIntent = s))
    this.getterSync('settings/completed', (s) => (store.settings.completed = s))
    this.getterSync('settings/bench-mode-enabled', (s) => (store.settings.benchModeEnabled = s))
    this.getterSync(
      'settings/bench-expected-champions',
      (s) => (store.settings.benchExpectedChampions = s)
    )
    this.getterSync('settings/grab-delay-seconds', (s) => (store.settings.grabDelaySeconds = s))
    this.getterSync(
      'settings/bench-select-first-available-champion',
      (s) => (store.settings.benchSelectFirstAvailableChampion = s)
    )
    this.getterSync('settings/ban-enabled', (s) => (store.settings.banEnabled = s))
    this.getterSync(
      'settings/banned-champions-multi',
      (s) => (store.settings.bannedChampions = markRaw(s))
    )
    this.getterSync(
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
