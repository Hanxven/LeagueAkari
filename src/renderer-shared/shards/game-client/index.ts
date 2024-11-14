import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useGameClientStore } from './store'

// copied from main shard
interface LaunchSpectatorConfig {
  locale?: string
  sgpServerId: string
  puuid: string
}

const MAIN_SHARD_NAMESPACE = 'game-client-main'

export class GameClientRenderer implements IAkariShardInitDispose {
  static id = 'game-client-renderer'
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

  async onInit() {
    const store = useGameClientStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
  }

  launchSpectator(config: LaunchSpectatorConfig) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'launchSpectator', config)
  }

  setTerminateGameClientOnAltF4(value: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'terminateGameClientOnAltF4', value)
  }
}
