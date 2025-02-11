import { LeagueClientHttpApiAxiosHelper } from '@shared/http-api-axios-helper/league-client'
import axios from 'axios'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
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

export class LeagueClientRenderer {
  static id = 'league-client-renderer'
  static dependencies = [
    'pinia-mobx-utils-renderer',
    'akari-ipc-renderer',
    'setting-utils-renderer'
  ]

  private readonly _ipc: AkariIpcRenderer
  private readonly _pm: PiniaMobxUtilsRenderer
  private readonly _setting: SettingUtilsRenderer

  public readonly api = new LeagueClientHttpApiAxiosHelper(
    axios.create({ baseURL: 'akari://league-client', adapter: 'fetch' })
  )

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
    } = this._config.subscribeState || {}

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)

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
  }

  constructor(
    deps: any,
    private _config: LeagueClientRendererConfig
  ) {
    this._pm = deps['pinia-mobx-utils-renderer']
    this._ipc = deps['akari-ipc-renderer']
    this._setting = deps['setting-utils-renderer']
  }

  url(uri: string) {
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
