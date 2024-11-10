import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { effectScope, watch } from 'vue'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useOngoingGameStore } from './store'

const MAIN_SHARD_NAMESPACE = 'ongoing-game-main'
export class OngoingGameRenderer implements IAkariShardInitDispose {
  static id = 'ongoing-game-renderer'
  static dependencies = [
    'akari-ipc-renderer',
    'pinia-mobx-utils-renderer',
    'setting-utils-renderer'
  ]

  private readonly _ipc: AkariIpcRenderer
  private readonly _pm: PiniaMobxUtilsRenderer
  private readonly _setting: SettingUtilsRenderer

  private _scope = effectScope()

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-renderer']
    this._pm = deps['pinia-mobx-utils-renderer']
    this._setting = deps['setting-utils-renderer']
  }

  setConcurrency(value: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'concurrency', value)
  }

  setEnabled(value: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'enabled', value)
  }

  setMatchHistoryLoadCount(value: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'matchHistoryLoadCount', value)
  }

  setPremadeTeamThreshold(value: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'premadeTeamThreshold', value)
  }

  setMatchHistoryUseSgpApi(value: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'matchHistoryUseSgpApi', value)
  }

  setMatchHistoryTag(value: string) {
    this._ipc.call(MAIN_SHARD_NAMESPACE, 'setMatchHistoryTag', value)
  }

  setMatchHistoryTagPreference(value: 'current' | 'all') {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'matchHistoryTagPreference', value)
  }

  reload() {
    this._ipc.call(MAIN_SHARD_NAMESPACE, 'reload')
  }

  getAll() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getAll') as Promise<{
      matchHistory: any
      summoner: any
      rankedStats: any
      championMastery: any
      savedInfo: any
    }>
  }

  async onInit() {
    const store = useOngoingGameStore()

    this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
    this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'clear', () => {
      store.summoner = {}
      store.matchHistory = {}
      store.rankedStats = {}
      store.championMastery = {}
      store.savedInfo = {}
    })

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'match-history-loaded', (puuid: string, data) => {
      store.matchHistory[puuid] = data
    })

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'summoner-loaded', (puuid: string, data) => {
      store.summoner[puuid] = data
    })

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'ranked-stats-loaded', (puuid: string, data) => {
      store.rankedStats[puuid] = data
    })

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'champion-mastery-loaded', (puuid: string, data) => {
      store.championMastery[puuid] = data
    })

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'saved-info-loaded', (puuid: string, data) => {
      store.savedInfo[puuid] = data
    })

    const { championMastery, matchHistory, rankedStats, savedInfo, summoner } = await this.getAll()
    store.championMastery = championMastery
    store.matchHistory = matchHistory
    store.rankedStats = rankedStats
    store.savedInfo = savedInfo
    store.summoner = summoner

    store.settings.orderPlayerBy = await this._setting.get(
      OngoingGameRenderer.id,
      'orderPlayerBy',
      store.settings.orderPlayerBy
    )

    this._scope.run(() => {
      watch(
        () => store.settings.orderPlayerBy,
        (newValue) => {
          this._setting.set(OngoingGameRenderer.id, 'orderPlayerBy', newValue)
        }
      )
    })
  }

  async onDispose() {
    this._scope.stop()
  }
}
