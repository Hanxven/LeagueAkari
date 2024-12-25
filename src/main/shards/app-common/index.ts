import { i18next } from '@main/i18n'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { AkariSharedGlobalShard, SHARED_GLOBAL_ID } from '@shared/akari-shard/manager'
import { app, dialog, nativeImage, shell } from 'electron'
import { clipboard } from 'electron'

import { AkariIpcMain } from '../ipc'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AppCommonSettings, AppCommonState } from './state'

/**
 * 一些不知道如何分类的通用功能, 可以放到这里
 */
export class AppCommonMain implements IAkariShardInitDispose {
  static id = 'app-common-main'
  static dependencies = [
    SHARED_GLOBAL_ID,
    'akari-ipc-main',
    'mobx-utils-main',
    'setting-factory-main'
  ]

  public readonly state = new AppCommonState()
  public readonly settings = new AppCommonSettings()

  private _shared: AkariSharedGlobalShard
  private _ipc: AkariIpcMain
  private _mobx: MobxUtilsMain
  private _setting: SetterSettingService

  constructor(deps: any) {
    this._shared = deps[SHARED_GLOBAL_ID]
    this._ipc = deps['akari-ipc-main']
    this._mobx = deps['mobx-utils-main']

    this._setting = (deps['setting-factory-main'] as SettingFactoryMain).create(
      AppCommonMain.id,
      {
        isInKyokoMode: { default: this.settings.isInKyokoMode },
        showFreeSoftwareDeclaration: { default: this.settings.showFreeSoftwareDeclaration },
        locale: { default: this._getSystemLocale() }
      },
      this.settings
    )

    this.state.setAdministrator(this._shared.global.isAdministrator)

    // 通知第二实例事件
    this._shared.global.events.on('second-instance', (commandLine, workingDirectory) => {
      this._ipc.sendEvent(AppCommonMain.id, 'second-instance', commandLine, workingDirectory)
    })

    this.state.setBaseConfig(this._shared.global.baseConfig.value)
  }

  private _getSystemLocale() {
    const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale

    if (systemLocale.startsWith('zh')) {
      return 'zh-CN'
    }

    return 'en'
  }

  private _setDisableHardwareAccelerationAndRelaunch(s: boolean) {
    if (s) {
      if (this.state.disableHardwareAcceleration) {
        return
      }

      this._shared.global.baseConfig.write({
        disableHardwareAcceleration: true
      })
    } else {
      if (!this.state.disableHardwareAcceleration) {
        return
      }

      this._shared.global.baseConfig.write({
        disableHardwareAcceleration: false
      })
    }

    this._shared.global.restart()
  }

  openUserDataDir() {
    return shell.openPath(app.getPath('userData'))
  }

  private async _handleState() {
    await this._setting.applyToState()
    this._mobx.propSync(AppCommonMain.id, 'settings', this.settings, [
      'isInKyokoMode',
      'showFreeSoftwareDeclaration',
      'locale'
    ])
    this._mobx.propSync(AppCommonMain.id, 'state', this.state, [
      'isAdministrator',
      'disableHardwareAcceleration',
      'baseConfig'
    ])

    // 状态指示, 是否禁用硬件加速
    this.state.setDisableHardwareAcceleration(
      this._shared.global.baseConfig.value?.disableHardwareAcceleration || false
    )
  }

  async onInit() {
    await this._handleState()

    this._mobx.reaction(
      () => this.settings.locale,
      (locale) => {
        i18next.changeLanguage(locale)
      },
      { fireImmediately: true }
    )

    this._ipc.onCall(AppCommonMain.id, 'setDisableHardwareAcceleration', (s: boolean) => {
      this._setDisableHardwareAccelerationAndRelaunch(s)
    })

    this._ipc.onCall(AppCommonMain.id, 'getVersion', () => {
      return this._shared.global.version
    })

    this._ipc.onCall(AppCommonMain.id, 'openUserDataDir', () => {
      return this.openUserDataDir()
    })

    this._ipc.onCall(AppCommonMain.id, 'readClipboardText', () => {
      return clipboard.readText()
    })

    this._ipc.onCall(AppCommonMain.id, 'writeClipboardImage', (buffer: ArrayBuffer) => {
      const buf = Buffer.from(buffer)
      const image = nativeImage.createFromBuffer(buf)
      clipboard.writeImage(image)
    })
  }
}
