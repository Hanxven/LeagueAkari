import { AkariIpcRenderer } from '@renderer-shared/shards/ipc'

export class DebugRenderer {
  static id = 'debug-renderer'
  static dependencies = ['akari-ipc-renderer']

  private readonly _ipc: AkariIpcRenderer

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-renderer']
  }
}
