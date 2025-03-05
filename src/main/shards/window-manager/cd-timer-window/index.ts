import input from '@main/native/la-input-win64.node'
import { GameClientMain } from '@main/shards/game-client'
import { AkariIpcError } from '@main/shards/ipc'
import { sleep } from '@shared/utils/sleep'
import { comparer, computed } from 'mobx'

import { WindowManagerMain, type WindowManagerMainContext } from '..'
import icon from '../../../../../resources/LA_ICON.ico?asset'
import { BaseAkariWindow } from '../base-akari-window'
import { CdTimerWindowSettings, CdTimerWindowState } from './state'

export class AkariCdTimerWindow extends BaseAkariWindow<CdTimerWindowState, CdTimerWindowSettings> {
  static readonly NAMESPACE_SUFFIX = 'cd-timer-window'
  static readonly HTML_ENTRY = 'cd-timer-window.html'
  static readonly TITLE = 'Akari Timer'
  static readonly BASE_WIDTH = 100 // 100 for auto resize
  static readonly BASE_HEIGHT = 220 // 220 for 5 players (as default)
  static readonly MIN_WIDTH = 100
  static readonly MIN_HEIGHT = 100
  static readonly GAME_STATS_POLL_INTERVAL = 4000

  static readonly ENTER_KEY_CODE = 13
  static readonly ENTER_KEY_INTERNAL_DELAY = 20
  static readonly INPUT_DELAY = 65

  public shortcutTargetId: string

  private _gameStatsPollTimer: NodeJS.Timeout | null = null

  constructor(_context: WindowManagerMainContext) {
    const state = new CdTimerWindowState()
    const settings = new CdTimerWindowSettings()

    super(_context, AkariCdTimerWindow.NAMESPACE_SUFFIX, state, settings, {
      baseWidth: AkariCdTimerWindow.BASE_WIDTH,
      baseHeight: AkariCdTimerWindow.BASE_HEIGHT,
      minWidth: AkariCdTimerWindow.BASE_WIDTH,
      minHeight: AkariCdTimerWindow.BASE_HEIGHT,
      htmlEntry: AkariCdTimerWindow.HTML_ENTRY,
      rememberPosition: true,
      rememberSize: false,
      settingSchema: {
        enabled: { default: settings.enabled },
        showShortcut: { default: settings.showShortcut },
        timerType: { default: settings.timerType }
      },
      browserWindowOptions: {
        title: AkariCdTimerWindow.TITLE,
        icon: icon,
        show: false,
        frame: false,
        resizable: false,
        focusable: false,
        maximizable: false,
        minimizable: false,
        fullscreenable: false,
        transparent: true,
        skipTaskbar: true,
        autoHideMenuBar: true,
        backgroundColor: '#00000000',
        webPreferences: {
          backgroundThrottling: true // focusable: false 和 backgroundThrottling: false 一起使用, 会出现莫名其妙的 BUG
        }
      }
    })

    this.shortcutTargetId = `${this._namespace}/show`
  }

  private _handleCdTimerWindowLogics() {
    if (!this.settings.pinned) {
      this._setting.set('pinned', true)
    }

    this._setting.onChange('pinned', (value: boolean) => {
      if (!value) {
        throw new AkariIpcError('cd-timer 窗口必须置顶', 'UnsupportedActionNotTopmost')
      }
    })

    this._mobx.reaction(
      () => [this.settings.enabled, this._windowManager.state.isManagerFinishedInit],
      ([enabled, finishedInit]) => {
        if (!finishedInit) {
          return
        }

        if (enabled) {
          this.createWindow()
        } else {
          this.close(true)
        }
      },
      {
        fireImmediately: true,
        equals: comparer.shallow,
        delay: 500
      }
    )

    this._mobx.reaction(
      () => this.state.ready,
      (ready) => {
        if (!ready) {
          return
        }

        // TODO DEBUG NEVER ABOVE
        if (this._window) {
          if (!WindowManagerMain.setAboveTheWorld(this._window!).res) {
            this._log.warn('无法将 cd-timer 窗口置顶')
          }
        }
      }
    )

    this._mobx.reaction(
      () => this.settings.showShortcut,
      (shortcut) => {
        if (shortcut) {
          try {
            this._keyboardShortcuts.register(this.shortcutTargetId, shortcut, 'normal', () => {
              this._log.debug('cd-timer 窗口快捷键触发')
              if (this.state.show) {
                this.hide()
              } else {
                this.show()
              }
            })
          } catch {
            this._log.warn('无法注册 cd-timer 窗口快捷键')
            this._setting.set('showShortcut', null)
          }
        } else {
          this._log.debug('注销 cd-timer 窗口快捷键')
          this._keyboardShortcuts.unregisterByTargetId(this.shortcutTargetId)
        }
      },
      { fireImmediately: true }
    )

    const shouldUseCdTimer = computed(() => {
      if (!this.state.ready || !this.settings.enabled) {
        return false
      }

      const session = this._leagueClient.data.gameflow.session

      if (
        session &&
        session.phase === 'InProgress' &&
        this.state.supportedGameModes.some(
          (mode) => mode.gameMode === session.gameData.queue.gameMode
        )
      ) {
        return true
      }

      return false
    })

    this._mobx.reaction(
      () => shouldUseCdTimer.get(),
      (should) => {
        if (should) {
          this.show()
        } else {
          this.hide()
        }
      },
      { fireImmediately: true }
    )

    this._mobx.reaction(
      () => shouldUseCdTimer.get(),
      (should) => {
        if (should) {
          this._log.info('轮询游戏对局信息开始')
          this._updateGameStats()
          this._gameStatsPollTimer = setInterval(
            () => this._updateGameStats(),
            AkariCdTimerWindow.GAME_STATS_POLL_INTERVAL
          )
        } else {
          if (this._gameStatsPollTimer) {
            this._log.info('轮询游戏对局信息结束')
            clearInterval(this._gameStatsPollTimer)
            this._gameStatsPollTimer = null
          }

          this.state.setGameTime(null)
        }
      },
      { fireImmediately: true }
    )
  }

  private _handleIpcCall() {
    let isSending = false
    this._ipc.onCall(this._namespace, 'sendInGame', async (_, text: string) => {
      if (!isSending && GameClientMain.isGameClientForeground()) {
        isSending = true
        await input.sendKeyAsync(AkariCdTimerWindow.ENTER_KEY_CODE, true)
        await sleep(AkariCdTimerWindow.ENTER_KEY_INTERNAL_DELAY)
        await input.sendKeyAsync(AkariCdTimerWindow.ENTER_KEY_CODE, false)
        await sleep(AkariCdTimerWindow.INPUT_DELAY)
        await input.sendKeysAsync(text)
        await sleep(AkariCdTimerWindow.INPUT_DELAY)
        await input.sendKeyAsync(AkariCdTimerWindow.ENTER_KEY_CODE, true)
        await sleep(AkariCdTimerWindow.ENTER_KEY_INTERNAL_DELAY)
        await input.sendKeyAsync(AkariCdTimerWindow.ENTER_KEY_CODE, false)
        isSending = false
      }
    })
  }

  private async _updateGameStats() {
    try {
      const { data } = await this._gameClient.api.getGameStats()
      this.state.setGameTime(data.gameTime)
    } catch (error) {
      this.state.setGameTime(null)
      this._log.warn('获取游戏数据失败', error)
    }
  }

  override async onInit() {
    await super.onInit()

    // 出于稳定性考虑, 仍要求管理员权限
    if (!this._app.state.isAdministrator) {
      return
    }

    this._handleIpcCall()
    this._handleCdTimerWindowLogics()
  }

  protected override getStatePropKeys() {
    return ['supportedGameModes', 'gameTime'] as const
  }

  protected override getSettingPropKeys() {
    return ['enabled', 'showShortcut', 'timerType'] as const
  }
}
