import { i18next } from '@main/i18n'
import { IAkariShardInitDispose, Shard, SharedGlobalShard } from '@shared/akari-shard'
import { app, nativeImage, nativeTheme, shell } from 'electron'
import { clipboard } from 'electron'
import os from 'node:os'

import { AkariIpcMain } from '../ipc'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AppCommonSettings, AppCommonState } from './state'

/**
 * 一些不知道如何分类的通用功能, 可以放到这里
 */
@Shard(AppCommonMain.id)
export class AppCommonMain implements IAkariShardInitDispose {
  static id = 'app-common-main'

  public readonly state = new AppCommonState()
  public readonly settings = new AppCommonSettings()

  private readonly _setting: SetterSettingService

  constructor(
    private readonly _shared: SharedGlobalShard,
    private readonly _ipc: AkariIpcMain,
    private readonly _mobx: MobxUtilsMain,
    private readonly _settingFactory: SettingFactoryMain
  ) {
    this._setting = _settingFactory.register(
      AppCommonMain.id,
      {
        isInKyokoMode: { default: this.settings.isInKyokoMode },
        showFreeSoftwareDeclaration: { default: this.settings.showFreeSoftwareDeclaration },
        locale: { default: this._getSystemLocale() },
        theme: { default: this.settings.theme },
        httpProxy: { default: this.settings.httpProxy },
        streamerMode: { default: this.settings.streamerMode },
        streamerModeUseAkariStyledName: { default: this.settings.streamerModeUseAkariStyledName }
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

  async getRuntimeInfo() {
    const processMemoryInfo = await process.getProcessMemoryInfo()

    return {
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      execPath: process.execPath,
      pid: process.pid,
      title: process.title,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
      type: process.type,
      resourcesPath: process.resourcesPath,
      versions: process.versions,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PATH: process.env.PATH
      },
      gpuStatus: app.getGPUFeatureStatus(),
      os: {
        type: os.type(),
        release: os.release(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        cpus: os.cpus(),
        homedir: os.homedir(),
        tmpdir: os.tmpdir()
      },
      argv: process.argv,
      processMemoryInfo
    }
  }

  private async _handleState() {
    await this._setting.applyToState()
    this._mobx.propSync(AppCommonMain.id, 'settings', this.settings, [
      'isInKyokoMode',
      'showFreeSoftwareDeclaration',
      'locale',
      'theme',
      'httpProxy',
      'streamerMode',
      'streamerModeUseAkariStyledName'
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

    this._mobx.reaction(
      () => this.settings.theme,
      (theme) => {
        if (theme === 'default') {
          nativeTheme.themeSource = 'system'
        } else {
          nativeTheme.themeSource = theme
        }
      },
      { fireImmediately: true }
    )

    nativeTheme.on('updated', () => {
      this.state.setShouldUseDarkColors(nativeTheme.shouldUseDarkColors)
    })

    this.state.setShouldUseDarkColors(nativeTheme.shouldUseDarkColors)

    this._ipc.onCall(AppCommonMain.id, 'setDisableHardwareAcceleration', (_, s: boolean) => {
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

    this._ipc.onCall(AppCommonMain.id, 'writeClipboardImage', (_, buffer: ArrayBuffer) => {
      const buf = Buffer.from(buffer)
      const image = nativeImage.createFromBuffer(buf)
      clipboard.writeImage(image)
    })

    this._ipc.onCall(AppCommonMain.id, 'getRuntimeInfo', () => {
      return this.getRuntimeInfo()
    })
  }
}
