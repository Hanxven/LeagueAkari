import { AkariIpcRenderer } from '../ipc'

export const MAIN_SHARD_NAMESPACE = 'setting-factory-main'

export class SettingUtilsRenderer {
  static id = 'setting-utils-renderer'
  static dependencies = ['akari-ipc-renderer']

  private _ipc: AkariIpcRenderer

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-renderer']
  }

  set(namespace: string, key: string, value: any) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'set', namespace, key, value)
  }

  async get(namespace: string, key: string, defaultValue?: any) {
    return (await this._ipc.call(MAIN_SHARD_NAMESPACE, 'get', namespace, key)) ?? defaultValue
  }
}
