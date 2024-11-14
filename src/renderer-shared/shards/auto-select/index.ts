import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useAutoSelectStore } from './store'

const MAIN_SHARD_NAMESPACE = 'auto-select-main'

export class AutoSelectRenderer implements IAkariShardInitDispose {
  static id = 'auto-select-renderer'
  static dependencies = ['setting-utils-renderer', 'pinia-mobx-utils-renderer']

  private readonly _pm: PiniaMobxUtilsRenderer
  private readonly _setting: SettingUtilsRenderer

  constructor(deps: any) {
    this._pm = deps['pinia-mobx-utils-renderer']
    this._setting = deps['setting-utils-renderer']
  }

  setNormalModeEnabled(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'normalModeEnabled', enabled)
  }

  setExpectedChampions(expectedChampions: Record<string, number[]>) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'expectedChampions', expectedChampions)
  }

  setSelectTeammateIntendedChampion(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'selectTeammateIntendedChampion', enabled)
  }

  setShowIntent(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'showIntent', enabled)
  }

  setCompleted(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'completed', enabled)
  }

  setBenchModeEnabled(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'benchModeEnabled', enabled)
  }

  setBenchExpectedChampions(expectedChampions: number[]) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'benchExpectedChampions', expectedChampions)
  }

  setGrabDelaySeconds(seconds: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'grabDelaySeconds', seconds)
  }

  setBenchSelectFirstAvailableChampion(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'benchSelectFirstAvailableChampion', enabled)
  }

  setBanEnabled(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'banEnabled', enabled)
  }

  setBannedChampions(bannedChampions: Record<string, number[]>) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'bannedChampions', bannedChampions)
  }

  setBanTeammateIntendedChampion(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'banTeammateIntendedChampion', enabled)
  }

  async onInit() {
    const store = useAutoSelectStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
  }
}
