import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AkariIpcRenderer } from '../ipc'
import { LoggerRenderer } from '../logger'

const MAIN_SHARD_NAMESPACE = 'overlay-main'

export class OverlayRenderer implements IAkariShardInitDispose {
  static id = 'overlay-renderer'
  static dependencies = [
    'akari-ipc-renderer',
    'logger-renderer'
  ]

  private readonly _ipc: AkariIpcRenderer
  private readonly _log: LoggerRenderer

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-renderer']
    this._log = deps['logger-renderer']
  }

  async onInit() {}

  show() {
    this._log.info(OverlayRenderer.id, '显示Overlay')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'overlay/show')
  }

  toggleClickThrough(value: boolean) {
    this._log.info(OverlayRenderer.id, '切换Overlay可穿透')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'overlay/clickThrough', value)
  }

}
