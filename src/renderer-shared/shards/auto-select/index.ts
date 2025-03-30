import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useAutoSelectStore } from './store'

const MAIN_SHARD_NAMESPACE = 'auto-select-main'

@Shard(AutoSelectRenderer.id)
export class AutoSelectRenderer implements IAkariShardInitDispose {
  static id = 'auto-select-renderer'

  constructor(
    @Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer
  ) {}

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

  setPickStrategy(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'pickStrategy', enabled)
  }

  setLockInDelaySeconds(threshold: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'lockInDelaySeconds', threshold)
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

  setBanDelaySeconds(seconds: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'banDelaySeconds', seconds)
  }

  setBannedChampions(bannedChampions: Record<string, number[]>) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'bannedChampions', bannedChampions)
  }

  setBanTeammateIntendedChampion(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'banTeammateIntendedChampion', enabled)
  }

  setBenchHandleTradeEnabled(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'benchHandleTradeEnabled', enabled)
  }

  setBenchHandleTradeIgnoreChampionOwner(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'benchHandleTradeIgnoreChampionOwner', enabled)
  }

  async onInit() {
    const store = useAutoSelectStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'aramTracker', store.aramTracker)
  }
}
