import { mainCall, mainStateSync } from '@shared/renderer/utils/ipc'

import { useAutoSelectStore } from './store'

// 处理自动英雄选择相关逻辑
export async function setupAutoSelect() {
  const autoSelectState = useAutoSelectStore()

  mainStateSync(
    'auto-select/settings/normal-mode-enabled',
    (s) => (autoSelectState.settings.normalModeEnabled = s)
  )

  mainStateSync(
    'auto-select/settings/only-simul-mode',
    (s) => (autoSelectState.settings.onlySimulMode = s)
  )

  mainStateSync(
    'auto-select/settings/expected-champions',
    (s) => (autoSelectState.settings.expectedChampions = s)
  )

  mainStateSync(
    'auto-select/settings/select-teammate-intended-champion',
    (s) => (autoSelectState.settings.selectTeammateIntendedChampion = s)
  )



  mainStateSync(
    'auto-select/settings/show-intent',
    (s) => (autoSelectState.settings.showIntent = s)
  )

  mainStateSync('auto-select/settings/completed', (s) => (autoSelectState.settings.completed = s))

  mainStateSync(
    'auto-select/settings/bench-mode-enabled',
    (s) => (autoSelectState.settings.benchModeEnabled = s)
  )

  mainStateSync(
    'auto-select/settings/bench-expected-champions',
    (s) => (autoSelectState.settings.benchExpectedChampions = s)
  )

  mainStateSync(
    'auto-select/settings/grab-delay-seconds',
    (s) => (autoSelectState.settings.grabDelaySeconds = s)
  )

  mainStateSync(
    'auto-select/settings/ban-enabled',
    (s) => (autoSelectState.settings.banEnabled = s)
  )

  mainStateSync(
    'auto-select/settings/banned-champions',
    (s) => (autoSelectState.settings.bannedChampions = s)
  )


  mainStateSync(
    'auto-select/settings/ban-teammate-intended-champion',
    (s) => (autoSelectState.settings.banTeammateIntendedChampion = s)
  )

  mainStateSync(
    'auto-select/upcoming-pick',
    (s) => (autoSelectState.upcomingPick = s)
  )

  mainStateSync(
    'auto-select/upcoming-ban',
    (s) => (autoSelectState.upcomingBan = s)
  )

  mainStateSync(
    'auto-select/upcoming-grab',
    (s) => (autoSelectState.upcomingGrab = s)
  )
}

export function setNormalModeAutoSelectEnabled(enabled: boolean) {
  return mainCall('auto-select/settings/normal-mode-enabled/set', enabled)
}

export function setBenchModeAutoSelectEnabled(enabled: boolean) {
  return mainCall('auto-select/settings/bench-mode-enabled/set', enabled)
}

export function setBenchModeExpectedChampions(list: number[]) {
  return mainCall('auto-select/settings/bench-expected-champions/set', list)
}

export function setNormalModeExpectedChampions(list: number[]) {
  return mainCall('auto-select/settings/expected-champions/set', list)
}

export function setNormalModeBannedChampions(list: number[]) {
  return mainCall('auto-select/settings/banned-champions/set', list)
}

export function setAutoBanEnabled(enabled: boolean) {
  return mainCall('auto-select/settings/ban-enabled/set', enabled)
}

export function setAutoSelectCompleted(completed: boolean) {
  return mainCall('auto-select/settings/completed/set', completed)
}

export function setOnlySimulMode(yes: boolean) {
  return mainCall('auto-select/settings/only-simul-mode/set', yes)
}

export function setGrabDelaySeconds(seconds: number) {
  return mainCall('auto-select/settings/grab-delay-seconds/set', seconds)
}

export function setBanTeammateIntendedChampion(enabled: boolean) {
  return mainCall('auto-select/settings/ban-teammate-intended-champion/set', enabled)
}

export function setSelectTeammateIntendedChampion(enabled: boolean) {
  return mainCall('auto-select/settings/select-teammate-intended-champion/set', enabled)
}

export function setShowIntent(enabled: boolean) {
  return mainCall('auto-select/settings/show-intent/set', enabled)
}
