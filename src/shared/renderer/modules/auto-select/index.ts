import { StateSyncModule } from '@shared/renderer/akari-ipc/state-sync-module'
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

    this.simpleSync('champ-select-action-info/member-me', (s) => (store.memberMe = s))
    this.simpleSync('upcoming-pick', (s) => (store.upcomingPick = s))
    this.simpleSync('upcoming-ban', (s) => (store.upcomingBan = s))
    this.simpleSync('upcoming-grab', (s) => (store.upcomingGrab = s))

    this.simpleSync('settings/normal-mode-enabled', (s) => (store.settings.normalModeEnabled = s))
    this.simpleSync('settings/only-simul-mode', (s) => (store.settings.onlySimulMode = s))
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

  setOnlySimulMode(value: boolean) {
    return this.call('set-setting/only-simul-mode', value)
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
