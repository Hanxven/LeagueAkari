import { LeagueClientHttpApiAxiosHelper } from '@shared/http-api-axios-helper/league-client'
import axios from 'axios'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { UxCommandLine, useLeagueClientStore } from './store'

export const MAIN_SHARD_NAMESPACE = 'league-client-main'

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

    this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    this._pm.sync(MAIN_SHARD_NAMESPACE, 'gameData', store.gameData)
    this._pm.sync(MAIN_SHARD_NAMESPACE, 'honor', store.honor)
    this._pm.sync(MAIN_SHARD_NAMESPACE, 'champSelect', store.champSelect)
    this._pm.sync(MAIN_SHARD_NAMESPACE, 'chat', store.chat)
    this._pm.sync(MAIN_SHARD_NAMESPACE, 'matchmaking', store.matchmaking)
    this._pm.sync(MAIN_SHARD_NAMESPACE, 'gameflow', store.gameflow)
    this._pm.sync(MAIN_SHARD_NAMESPACE, 'lobby', store.lobby)
    this._pm.sync(MAIN_SHARD_NAMESPACE, 'login', store.login)
    this._pm.sync(MAIN_SHARD_NAMESPACE, 'summoner', store.summoner)
    this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
  }

  constructor(deps: any) {
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
