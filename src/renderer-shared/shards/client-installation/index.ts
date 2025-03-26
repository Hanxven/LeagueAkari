import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AkariIpcRenderer } from '../ipc'
import { LoggerRenderer } from '../logger'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { useClientInstallationStore } from './store'

const MAIN_SHARD_NAMESPACE = 'client-installation-main'

export class ClientInstallationRenderer implements IAkariShardInitDispose {
  static id = 'client-installation-renderer'
  static dependencies = [AkariIpcRenderer.id, LoggerRenderer.id, PiniaMobxUtilsRenderer.id]

  private readonly _ipc: AkariIpcRenderer
  private readonly _log: LoggerRenderer
  private readonly _pm: PiniaMobxUtilsRenderer

  constructor(deps: any) {
    this._ipc = deps[AkariIpcRenderer.id]
    this._log = deps[LoggerRenderer.id]
    this._pm = deps[PiniaMobxUtilsRenderer.id]
  }

  async onInit() {
    const store = useClientInstallationStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
  }

  launchTencentTcls() {
    this._log.info(ClientInstallationRenderer.id, '启动 TCLS 客户端')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'launchTencentTcls')
  }

  launchWeGameLeagueOfLegends() {
    this._log.info(ClientInstallationRenderer.id, '启动 WeGame 客户端')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'launchWeGameLeagueOfLegends')
  }

  launchWeGame() {
    this._log.info(ClientInstallationRenderer.id, '启动 WeGame 客户端')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'launchWeGame')
  }

  launchDefaultRiotClient() {
    this._log.info(ClientInstallationRenderer.id, '启动默认 RiotClient 客户端')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'launchDefaultRiotClient')
  }
}
