import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { Game } from '@shared/types/league-client/match-history'
import { computed, effectScope, markRaw, toRaw, watch } from 'vue'
import { useRouter } from 'vue-router'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import {
  ChampionMasteryPlayer,
  MatchHistoryPlayer,
  RankedStatsPlayer,
  SummonerPlayer,
  useOngoingGameStore
} from './store'

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

  setGameTimelineLoadCount(value: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'gameTimelineLoadCount', value)
  }

  reload() {
    this._ipc.call(MAIN_SHARD_NAMESPACE, 'reload')
  }

  getAll() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getAll') as Promise<{
      matchHistory: Record<string, MatchHistoryPlayer>
      summoner: Record<string, SummonerPlayer>
      rankedStats: Record<string, RankedStatsPlayer>
      championMastery: Record<string, ChampionMasteryPlayer>
      additionalGames: Record<number, any>
      savedInfo: any
    }>
  }

  private _toShallowedMarkRaw<T extends object>(obj: T) {
    return Object.entries(obj).reduce(
      (acc, [key, value]) => {
        acc[key] = markRaw(value)
        return acc
      },
      {} as Record<keyof T, any>
    )
  }

  async onInit() {
    const store = useOngoingGameStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'clear', () => {
      store.summoner = {}
      store.matchHistory = {}
      store.rankedStats = {}
      store.championMastery = {}
      store.savedInfo = {}
      store.cachedGames = {}
    })

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'match-history-loaded', (puuid: string, data) => {
      store.matchHistory[puuid] = markRaw(data)

      const games = data.data as Game[]
      games.forEach((game) => (store.cachedGames[game.gameId] = markRaw(game)))
    })

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'additional-game-loaded', (gameId: number, data) => {
      store.cachedGames[gameId] = markRaw(data.data)
    })

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'summoner-loaded', (puuid: string, data) => {
      store.summoner[puuid] = markRaw(data)
    })

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'ranked-stats-loaded', (puuid: string, data) => {
      store.rankedStats[puuid] = markRaw(data)
    })

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'champion-mastery-loaded', (puuid: string, data) => {
      store.championMastery[puuid] = markRaw(data)
    })

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'saved-info-loaded', (puuid: string, data) => {
      store.savedInfo[puuid] = markRaw(data)
    })

    const { championMastery, matchHistory, rankedStats, savedInfo, summoner, additionalGames } =
      await this.getAll()
    store.championMastery = this._toShallowedMarkRaw(championMastery)
    store.matchHistory = this._toShallowedMarkRaw(matchHistory)
    store.rankedStats = this._toShallowedMarkRaw(rankedStats)
    store.savedInfo = this._toShallowedMarkRaw(savedInfo)
    store.summoner = this._toShallowedMarkRaw(summoner)

    Object.values(matchHistory).forEach((data) => {
      const games = data.data as Game[]
      games.forEach((game) => (store.cachedGames[game.gameId] = markRaw(game)))
    })

    Object.values(additionalGames).forEach((data) => {
      store.cachedGames[data.data.gameId] = markRaw(data.data)
    })

    // 出于历史原因, 此设置项仍位于 settings/ 下而非 frontendSettings/
    await this._setting.savedPropVue(OngoingGameRenderer.id, store.settings, 'orderPlayerBy')

    await this._setting.savedPropVue(
      OngoingGameRenderer.id,
      store.frontendSettings,
      'autoRouteWhenGameStarts'
    )

    await this._setting.savedPropVue(
      OngoingGameRenderer.id,
      store.frontendSettings,
      'showChampionUsage',
      {
        savePropKey: 'frontend/showChampionUsage'
      }
    )

    await this._setting.savedPropVue(
      OngoingGameRenderer.id,
      store.frontendSettings,
      'showMatchHistoryItemBorder',
      {
        savePropKey: 'frontend/showMatchHistoryItemBorder'
      }
    )

    await this._setting.savedPropVue(
      OngoingGameRenderer.id,
      store.frontendSettings,
      'playerCardTags',
      {
        savePropKey: 'frontend/playerCard',
        watchOptions: { deep: true }
      }
    )
  }

  setupAutoRouteWhenGameStarts() {
    const router = useRouter()
    const store = useOngoingGameStore()

    const shouldRoute = computed(() => {
      return store.queryStage.phase !== 'unavailable'
    })

    watch(
      () => shouldRoute.value,
      (value) => {
        if (value && store.frontendSettings.autoRouteWhenGameStarts) {
          router.replace({ name: 'ongoing-game' })
        }
      },
      { immediate: true }
    )
  }

  async onDispose() {}
}
