import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useGameClientStore } from './store'

// copied from main shard
interface LaunchSpectatorConfig {
  locale?: string
  sgpServerId: string
  observerEncryptionKey: string
  observerServerPort: number
  observerServerIp: string
  gameId: number
  gameMode: string
}

const MAIN_SHARD_NAMESPACE = 'game-client-main'

export class GameClientRenderer implements IAkariShardInitDispose {
  static id = 'game-client-renderer'
  static dependencies = [AkariIpcRenderer.id, PiniaMobxUtilsRenderer.id, SettingUtilsRenderer.id]

  private readonly _ipc: AkariIpcRenderer
  private readonly _pm: PiniaMobxUtilsRenderer
  private readonly _setting: SettingUtilsRenderer

  static SHORTCUT_ID_TERMINATE_GAME_CLIENT = `${MAIN_SHARD_NAMESPACE}/terminate-game-client`

  constructor(deps: any) {
    this._ipc = deps[AkariIpcRenderer.id]
    this._pm = deps[PiniaMobxUtilsRenderer.id]
    this._setting = deps[SettingUtilsRenderer.id]
  }

  async onInit() {
    const store = useGameClientStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
  }

  launchSpectator(config: LaunchSpectatorConfig) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'launchSpectator', config)
  }

  setTerminateGameClientWithShortcut(value: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'terminateGameClientWithShortcut', value)
  }

  setTerminateShortcut(shortcut: string | null) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'terminateShortcut', shortcut)
  }

  setSettingsFileReadonlyOrWritable(mode: 'readonly' | 'writable') {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setSettingsFileReadonlyOrWritable', mode)
  }

  getSettingsFileReadonlyOrWritable() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getSettingsFileReadonlyOrWritable')
  }
}
