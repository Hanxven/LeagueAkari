import { Config, Dep, Shard } from '@shared/akari-shard'
import { getSgpServerId } from '@shared/data-sources/sgp/utils'
import { RadixEventEmitter } from '@shared/event-emitter'
import { LeagueClientHttpApiAxiosHelper } from '@shared/http-api-axios-helper/league-client'
import { LcuEvent } from '@shared/types/league-client/event'
import axios from 'axios'
import axiosRetry from 'axios-retry'
import { useTranslation } from 'i18next-vue'
import { getCurrentScope, onScopeDispose, watch } from 'vue'

import { useBackgroundTasksStore } from '../background-tasks/store'
import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { SetupInAppScopeRenderer } from '../setup-in-app-scope'
import { UxCommandLine, useLeagueClientStore } from './store'

export const MAIN_SHARD_NAMESPACE = 'league-client-main'

export interface LeagueClientRendererConfig {
  subscribeState?: {
    gameData?: boolean
    honor?: boolean
    champSelect?: boolean
    chat?: boolean
    matchmaking?: boolean
    gameflow?: boolean
    lobby?: boolean
    login?: boolean
    summoner?: boolean
  }
}

@Shard(LeagueClientRenderer.id)
export class LeagueClientRenderer {
  static id = 'league-client-renderer'

  /** 这里只用于当作一个普通的静态事件分发器 */
  private readonly _emitter = new RadixEventEmitter()

  public readonly _http = axios.create({ baseURL: 'akari://league-client', adapter: 'fetch' })
  public readonly api: LeagueClientHttpApiAxiosHelper

  async onInit() {
    const store = useLeagueClientStore()

    const {
      gameData = true,
      honor = true,
      champSelect = true,
      chat = true,
      matchmaking = true,
      gameflow = true,
      lobby = true,
      login = true,
      summoner = true
    } = this._config?.subscribeState || {}

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'initialization', store.initialization)

    if (gameData) {
      await this._pm.sync(MAIN_SHARD_NAMESPACE, 'gameData', store.gameData)
    }

    if (honor) {
      await this._pm.sync(MAIN_SHARD_NAMESPACE, 'honor', store.honor)
    }

    if (champSelect) {
      await this._pm.sync(MAIN_SHARD_NAMESPACE, 'champSelect', store.champSelect)
    }

    if (chat) {
      await this._pm.sync(MAIN_SHARD_NAMESPACE, 'chat', store.chat)
    }

    if (matchmaking) {
      await this._pm.sync(MAIN_SHARD_NAMESPACE, 'matchmaking', store.matchmaking)
    }

    if (gameflow) {
      await this._pm.sync(MAIN_SHARD_NAMESPACE, 'gameflow', store.gameflow)
    }

    if (lobby) {
      await this._pm.sync(MAIN_SHARD_NAMESPACE, 'lobby', store.lobby)
    }

    if (login) {
      await this._pm.sync(MAIN_SHARD_NAMESPACE, 'login', store.login)
    }

    if (summoner) {
      await this._pm.sync(MAIN_SHARD_NAMESPACE, 'summoner', store.summoner)
    }

    this._handleSubscribedLcuEventDispatch()

    this._setup.addSetupFn(() => this._handleInitializationProgressShow())

    // @ts-ignore
    window.lcuApi = this.api
  }

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setup: SetupInAppScopeRenderer,
    @Config() private _config?: LeagueClientRendererConfig
  ) {
    axiosRetry(this._http, {
      retries: 2,
      retryCondition: (error) => {
        if (error.response === undefined) {
          return true
        }

        return !(error.response.status >= 400 && error.response.status < 500)
      }
    })

    this.api = new LeagueClientHttpApiAxiosHelper(this._http)
  }

  private async _internalSubscribe(uri: string) {
    const subId = await this._ipc.call<string>(MAIN_SHARD_NAMESPACE, 'subscribeLcuEndpoint', uri)

    return {
      subId,
      unsubscribe: () => {
        return this._ipc.call<boolean>(MAIN_SHARD_NAMESPACE, 'unsubscribeLcuEndpoint', subId)
      }
    }
  }

  private _handleSubscribedLcuEventDispatch() {
    this._ipc.onEvent(
      MAIN_SHARD_NAMESPACE,
      'extra-lcu-event',
      (subId: string, event: LcuEvent, params) => {
        this._emitter.emit(subId, { event, params })
      }
    )
  }

  private _handleInitializationProgressShow() {
    const lcStore = useLeagueClientStore()
    const taskStore = useBackgroundTasksStore()
    const { t } = useTranslation()

    const initTaskId = `${LeagueClientRenderer.id}/initialization`

    watch(
      () => lcStore.initialization.progress,
      (progress) => {
        if (!progress) {
          taskStore.removeTask(initTaskId)
          return
        }

        if (!taskStore.hasTask(initTaskId)) {
          taskStore.createTask(initTaskId, {
            name: () => t('league-client-renderer.initialization-task.name')
          })
        }

        taskStore.updateTask(initTaskId, {
          description: () =>
            t('league-client-renderer.initialization-task.current', {
              endpoint: progress.currentId,
              finishedCount: progress.finished.length,
              allCount: progress.all.length
            }),
          progress: progress.finished.length / progress.all.length
        })
      },
      { immediate: true }
    )

    const connectTaskId = `${LeagueClientRenderer.id}/connection`

    watch(
      () => lcStore.connectingClient,
      (client) => {
        if (!client) {
          taskStore.removeTask(connectTaskId)
          return
        }

        if (!taskStore.hasTask(connectTaskId)) {
          taskStore.createTask(connectTaskId, {
            name: () => t('league-client-renderer.connection-task.name'),
            description: () =>
              t('league-client-renderer.connection-task.target', {
                target: getSgpServerId(client.region, client.rsoPlatformId)
              })
          })
        }
      },
      { immediate: true }
    )
  }

  onLcuEventVue<T = any, P = Record<string, any>>(
    uri: string,
    listener: (data: LcuEvent<T>, params: P) => void
  ) {
    let disposed = false
    let unsubscribeFn: (() => Promise<boolean>) | null = null
    let offFn: (() => void) | null = null

    this._internalSubscribe(uri).then(({ subId, unsubscribe }) => {
      if (disposed) {
        unsubscribe()
        return
      }

      unsubscribeFn = unsubscribe
      offFn = this._emitter.on(subId, ({ event, params }) => listener(event, params))
    })

    const dispose = () => {
      if (disposed) {
        return
      }

      if (offFn) {
        offFn()
      }

      if (unsubscribeFn) {
        unsubscribeFn().catch(console.error)
      }

      disposed = true
    }

    getCurrentScope() && onScopeDispose(() => dispose())
    return dispose
  }

  static url(uri: string) {
    return new URL(uri, 'akari://league-client').href
  }

  setAutoConnect(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'autoConnect', enabled)
  }

  disconnect() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'disconnect')
  }

  connect(auth: UxCommandLine) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'connect', auth)
  }

  writeItemSetsToDisk(items: any[], clearPrevious?: boolean) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'writeItemSetsToDisk', items, clearPrevious)
  }

  fixWindowMethodA(config?: { baseHeight: number; baseWidth: number }) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'fixWindowMethodA', config)
  }
}
