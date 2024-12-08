import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { CustomSend, useInGameSendStore } from './store'

const MAIN_SHARD_NAMESPACE = 'in-game-send-main'

export class InGameSendRenderer implements IAkariShardInitDispose {
  static id = 'in-game-send-renderer'
  static dependencies = [
    'akari-ipc-renderer',
    'pinia-mobx-utils-renderer',
    'setting-utils-renderer'
  ]

  static SHORTCUT_ID_SEND_ALLY = `${MAIN_SHARD_NAMESPACE}/send-ally`
  static SHORTCUT_ID_SEND_ENEMY = `${MAIN_SHARD_NAMESPACE}/send-enemy`
  static SHORTCUT_ID_SEND_ALL_ALLIES = `${MAIN_SHARD_NAMESPACE}/send-all-allies`
  static SHORTCUT_ID_SEND_ALL_ENEMIES = `${MAIN_SHARD_NAMESPACE}/send-all-enemies`

  private readonly _ipc: AkariIpcRenderer
  private readonly _pm: PiniaMobxUtilsRenderer
  private readonly _setting: SettingUtilsRenderer

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-renderer']
    this._pm = deps['pinia-mobx-utils-renderer']
    this._setting = deps['setting-utils-renderer']
  }

  async onInit() {
    const store = useInGameSendStore()

    this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
  }

  setSendStatsEnabled(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'sendStatsEnabled', enabled)
  }

  setSendStatsUseDefaultTemplate(useDefault: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'sendStatsUseDefaultTemplate', useDefault)
  }

  setSendAllyShortcut(shortcut: string | null) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'sendAllyShortcut', shortcut)
  }

  setSendEnemyShortcut(shortcut: string | null) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'sendEnemyShortcut', shortcut)
  }

  setSendAllAlliesShortcut(shortcut: string | null) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'sendAllAlliesShortcut', shortcut)
  }

  setSendAllEnemiesShortcut(shortcut: string | null) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'sendAllEnemiesShortcut', shortcut)
  }

  createCustomSend(name: string): Promise<CustomSend> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'createCustomSend', name)
  }

  updateCustomSend(id: string, data: Omit<Partial<CustomSend>, 'id'>) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'updateCustomSend', id, data)
  }

  deleteCustomSend(id: string) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'deleteCustomSend', id)
  }

  shortcutTargetId(id: string) {
    return `${MAIN_SHARD_NAMESPACE}/custom-send/${id}`
  }

  updateSendStatsTemplate(template: string): Promise<{
    template: string
    isValid: boolean
  }> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'updateSendStatsTemplate', template)
  }

  setSendInterval(interval: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'sendInterval', interval)
  }

  dryRunStatsSend(): Promise<
    {
      data: string[]
    } & (
      | { error: true; reason: string; extra: string }
      | { error: false; reason: null; extra: string }
    )
  > {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'dryRunStatsSend')
  }

  onSendError(cb: (message: string) => void) {
    this._ipc.onEventVue(MAIN_SHARD_NAMESPACE, 'send-stats-error', cb)
  }
}
