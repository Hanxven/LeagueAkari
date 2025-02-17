import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { usePlayerStalkingStore } from './store'

const MAIN_SHARD_NAMESPACE = 'player-stalking-main'

/**
 * 连接到主进程的快捷键服务
 */
export class PlayerStalkingRenderer implements IAkariShardInitDispose {
  static id = 'player-stalking-renderer'
  static dependencies = [
    'akari-ipc-renderer',
    'pinia-mobx-utils-renderer',
    'setting-utils-renderer'
  ]

  static DISABLED_KEYS_TARGET_ID = 'akari-disabled-keys'

  private readonly _ipc: AkariIpcRenderer
  private readonly _pm: PiniaMobxUtilsRenderer
  private readonly _setting: SettingUtilsRenderer

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-renderer']
    this._pm = deps['pinia-mobx-utils-renderer']
    this._setting = deps['setting-utils-renderer']
  }

  setEnabled(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'enabled', enabled)
  }

  addPlayer(puuid: string, sgpServerId: string) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'addPlayer', puuid, sgpServerId)
  }

  removePlayer(puuid: string) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'removePlayer', puuid)
  }

  enabledPlayer(puuid: string, enabled: boolean) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'enabledPlayer', puuid, enabled)
  }

  async onInit() {
    const store = usePlayerStalkingStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
  }
}
