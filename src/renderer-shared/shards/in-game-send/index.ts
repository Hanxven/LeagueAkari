import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { CustomSend, useInGameSendStore } from './store'

const MAIN_SHARD_NAMESPACE = 'in-game-send-main'

@Shard(InGameSendRenderer.id)
export class InGameSendRenderer implements IAkariShardInitDispose {
  static id = 'in-game-send-renderer'

  static SHORTCUT_ID_SEND_ALLY = `${MAIN_SHARD_NAMESPACE}/send-ally`
  static SHORTCUT_ID_SEND_ENEMY = `${MAIN_SHARD_NAMESPACE}/send-enemy`
  static SHORTCUT_ID_SEND_ALL_ALLIES = `${MAIN_SHARD_NAMESPACE}/send-all-allies`
  static SHORTCUT_ID_SEND_ALL_ENEMIES = `${MAIN_SHARD_NAMESPACE}/send-all-enemies`
  static SHORTCUT_ID_CANCEL = `${MAIN_SHARD_NAMESPACE}/cancel`

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer
  ) {}

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

  setCancelShortcut(shortcut: string | null) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'cancelShortcut', shortcut)
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

  dryRunStatsSend(target = 'all'): Promise<
    {
      data: string[]
    } & (
      | { error: true; reason: string; extra: string }
      | { error: false; reason: null; extra: string }
    )
  > {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'dryRunStatsSend', target)
  }

  onSendCustomTemplateError(cb: (message: string) => void) {
    this._ipc.onEventVue(MAIN_SHARD_NAMESPACE, 'error-send-stats-use-custom-template', cb)
  }

  onSendCustomTemplateSuccess(cb: () => void) {
    this._ipc.onEventVue(MAIN_SHARD_NAMESPACE, 'success-send-stats-use-custom-template', cb)
  }
}
