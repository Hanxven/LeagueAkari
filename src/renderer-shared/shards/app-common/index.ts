import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import i18next from 'i18next'
import { effectScope, watch } from 'vue'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { HttpProxySetting, useAppCommonStore } from './store'

const MAIN_SHARD_NAMESPACE = 'app-common-main'

export class AppCommonRenderer implements IAkariShardInitDispose {
  static id = 'app-common-renderer'
  static dependencies = [
    'akari-ipc-renderer',
    'setting-utils-renderer',
    'pinia-mobx-utils-renderer'
  ]

  private readonly _ipc: AkariIpcRenderer
  private readonly _pm: PiniaMobxUtilsRenderer
  private readonly _setting: SettingUtilsRenderer

  private readonly _scope = effectScope()

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-renderer']
    this._pm = deps['pinia-mobx-utils-renderer']
    this._setting = deps['setting-utils-renderer']

    this._scope.run(() => {
      const store = useAppCommonStore()

      watch(
        () => store.settings.locale,
        (lo) => {
          i18next.changeLanguage(lo)
        },
        { immediate: true }
      )
    })
  }

  onSecondInstance(fn: (commandLine: string[], workingDirectory: string) => void) {
    return this._ipc.onEventVue(MAIN_SHARD_NAMESPACE, 'second-instance', fn)
  }

  getVersion() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getVersion') as Promise<string>
  }

  openUserDataDir() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'openUserDataDir')
  }

  setInKyokoMode(s: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'isInKyokoMode', s)
  }

  setShowFreeSoftwareDeclaration(s: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'showFreeSoftwareDeclaration', s)
  }

  setDisableHardwareAcceleration(s: boolean) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setDisableHardwareAcceleration', s)
  }

  setLocale(s: string) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'locale', s)
  }

  setTheme(s: 'default' | 'dark' | 'light') {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'theme', s)
  }

  setHttpProxy(s: HttpProxySetting | null) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'httpProxy', s)
  }

  readClipboardText() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'readClipboardText') as Promise<string>
  }

  writeClipboardImage(buffer: ArrayBuffer) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'writeClipboardImage', buffer)
  }

  async onInit() {
    const store = useAppCommonStore()
    store.version = await this.getVersion()

    await this._setting.savedGetterVue(
      AppCommonRenderer.id,
      'tempAkariSubscriptionInfo',
      () => store.tempAkariSubscriptionInfo,
      (v) => (store.tempAkariSubscriptionInfo = v)
    )

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
  }

  getRuntimeInfo() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getRuntimeInfo') as Promise<any>
  }

  async onDispose() {
    this._scope.stop()
  }
}
