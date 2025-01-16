import input from '@main/native/la-input-win64.node'
import { TimeoutTask } from '@main/utils/timer'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import EventEmitter from 'node:events'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { UNIFIED_KEY_ID, VKEY_MAP, isCommonModifierKey, isModifierKey } from './definitions'

interface ShortcutDetails {
  keyCodes: number[]
  keys: { keyId: string; isModifier: boolean; keyCode: number }[]
  id: string
  unifiedId: string
}

/**
 * 管理员权限下, 处理全局范围的键盘快捷键的模块
 * 提供订阅和事件分发服务
 */
export class KeyboardShortcutsMain implements IAkariShardInitDispose {
  static id = 'keyboard-shortcuts-main'
  static dependencies = ['app-common-main', 'akari-ipc-main', 'logger-factory-main']

  private readonly _app: AppCommonMain
  private readonly _ipc: AkariIpcMain
  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _log: AkariLogger

  /** 除了修饰键之外的其他按键 */
  private readonly _pressedOtherKeys = new Set<number>()

  /** 修饰键 */
  private readonly _pressedModifierKeys = new Set<number>()

  /** 最后一次激活的快捷键组合, 用于追踪在所有按键结束后的快捷键情况 */
  private _lastActiveShortcut: number[] = []

  /**
   * 修饰键的惯例可读顺序, 用于组合成好看的字符串
   */
  static readonly MODIFIER_READING_ORDER = {
    162: 0,
    163: 1,
    16: 2,
    160: 3,
    161: 4,
    18: 5,
    164: 6,
    165: 7,
    91: 8,
    92: 9
  }

  static readonly VK_CODE_F22 = 133

  static DISABLED_KEYS_TARGET_ID = 'akari-disabled-keys'
  static DISABLED_KEYS = [
    133, // F22
    13 // Enter
  ]

  /**
   * 原生监听到的键盘事件
   */
  public readonly events = new EventEmitter<{
    /**
     * 在任意一个有意义的快捷键被按下时触发
     */
    shortcut: [details: ShortcutDetails]

    /**
     * last-active: 在所有按键松开后再触发
     * 在所有按键结束后, 且最后一次激活的快捷键组合被触发时触发
     * 这个事件用于规避 SendInput 在模拟过程中, 和现有正在进行的按键冲突的问题
     */
    'last-active-shortcut': [details: ShortcutDetails]
  }>()

  private _registrationMap = new Map<
    string,
    {
      type: 'last-active' | 'normal'
      targetId: string
      cb: (details: ShortcutDetails) => void
    }
  >()

  private _targetIdMap = new Map<string, string>()

  private _correctTask = new TimeoutTask(() => {
    if (this._pressedModifierKeys.size === 0 && this._pressedOtherKeys.size === 0) {
      return
    }

    this._correctTrackingState()
  }, 2000)

  constructor(deps: any) {
    this._app = deps['app-common-main']
    this._ipc = deps['akari-ipc-main']
    this._loggerFactory = deps['logger-factory-main']
    this._log = this._loggerFactory.create(KeyboardShortcutsMain.id)
  }

  async onInit() {
    if (this._app.state.isAdministrator) {
      input.startHook()

      this._log.info('监听键盘事件')

      input.onKeyEvent((key) => {
        const [keyCodeRaw, state] = key.split(',')

        // ignore VK_PACKET (231)
        if (keyCodeRaw === '231' || !VKEY_MAP[keyCodeRaw]) {
          return
        }

        const keyCode = parseInt(keyCodeRaw, 10)

        if (isCommonModifierKey(keyCode)) {
          return
        }

        const isDown = state === 'DOWN'

        // 定期尝试修正状态 (无奈之举)
        if (isDown) {
          this._correctTask.start()
        }

        if (isModifierKey(keyCode)) {
          // skip if unchanged
          if (this._pressedModifierKeys.has(keyCode) === isDown) {
            return
          }

          if (isDown) {
            this._pressedModifierKeys.add(keyCode)
          } else {
            this._pressedModifierKeys.delete(keyCode)
          }
        } else {
          if (isDown) {
            this._pressedOtherKeys.add(keyCode)
            const modifiers = Array.from(this._pressedModifierKeys.values())
            const sorted = modifiers.toSorted((a, b) => {
              return (
                KeyboardShortcutsMain.MODIFIER_READING_ORDER[a] -
                KeyboardShortcutsMain.MODIFIER_READING_ORDER[b]
              )
            })

            const keyCodes = [...sorted, keyCode]
            const keys = keyCodes.map((k) => ({
              keyId: VKEY_MAP[k].keyId,
              keyCode: k,
              isModifier: isModifierKey(k)
            }))
            const combined = keys.map((k) => k.keyId).join('+')
            const unified = [
              ...new Set(keyCodes.map((k) => UNIFIED_KEY_ID[k] || VKEY_MAP[k].keyId))
            ].join('+')

            this._lastActiveShortcut = keyCodes

            this.events.emit('shortcut', { keyCodes, keys, id: combined, unifiedId: unified })

            const registration = this._registrationMap.get(combined)
            if (registration && registration.type === 'normal') {
              registration.cb({
                keyCodes,
                keys,
                id: combined,
                unifiedId: unified
              })
            }

            this._ipc.sendEvent(KeyboardShortcutsMain.id, 'shortcut', {
              keyCodes,
              keys,
              id: combined,
              unifiedId: unified
            })
          } else {
            this._pressedOtherKeys.delete(keyCode)
          }
        }

        if (
          this._pressedModifierKeys.size === 0 &&
          this._pressedOtherKeys.size === 0 &&
          this._lastActiveShortcut.length > 0
        ) {
          const keys = this._lastActiveShortcut.map((k) => ({
            keyId: VKEY_MAP[k].keyId,
            keyCode: k,
            isModifier: isModifierKey(k)
          }))
          const combined = keys.map((k) => k.keyId).join('+')
          const unified = [
            ...new Set(this._lastActiveShortcut.map((k) => UNIFIED_KEY_ID[k] || VKEY_MAP[k].keyId))
          ].join('+')

          this.events.emit('last-active-shortcut', {
            keyCodes: this._lastActiveShortcut,
            keys,
            id: combined,
            unifiedId: unified
          })

          this._ipc.sendEvent(KeyboardShortcutsMain.id, 'last-active-shortcut', {
            keyCodes: this._lastActiveShortcut,
            keys,
            id: combined,
            unifiedId: unified
          })

          const registration = this._registrationMap.get(combined)
          if (registration && registration.type === 'last-active') {
            registration.cb({
              keyCodes: this._lastActiveShortcut,
              keys,
              id: combined,
              unifiedId: unified
            })
          }

          this._lastActiveShortcut = []
        }
      })

      await this._correctTrackingState()
    }

    this._ipc.onCall(KeyboardShortcutsMain.id, 'getRegistration', (shortcutId: string) => {
      const r = this.getRegistration(shortcutId)

      if (!r) {
        return null
      }

      const { cb, ...rest } = r
      return rest
    })

    this._ipc.onCall(KeyboardShortcutsMain.id, 'getRegistrationByTargetId', (targetId: string) => {
      const r = this.getRegistrationByTargetId(targetId)

      if (!r) {
        return null
      }

      const { cb, ...rest } = r
      return rest
    })

    this._ipc.onCall(KeyboardShortcutsMain.id, '_getInternalVars', () => {
      // 调试用
      return {
        _pressedOtherKeys: this._pressedOtherKeys,
        _pressedModifierKeys: this._pressedModifierKeys,
        _lastActiveShortcut: this._lastActiveShortcut
      }
    })
  }

  /**
   * 修正当前的按键状态, 最大程度上保证状态的一致性
   */
  private async _correctTrackingState() {
    const states = await input.getAllKeyStatesAsync()

    this._pressedModifierKeys.clear()
    this._pressedOtherKeys.clear()

    states.forEach((key) => {
      const { vkCode, pressed } = key

      // 你知道吗? 当微信启动的时候, 会伸出一个无形的大手将 F22 (VK_CODE 133) 按下, 然后永远不松开
      // 使用此逻辑以释放 F22
      if (vkCode === KeyboardShortcutsMain.VK_CODE_F22 && pressed) {
        this._log.info('F22 被按下, 试图释放')
        input.sendKeyAsync(KeyboardShortcutsMain.VK_CODE_F22, false).catch(() => {})
        return
      }

      if (isCommonModifierKey(vkCode)) {
        return
      }

      if (isModifierKey(vkCode)) {
        if (pressed) {
          this._pressedModifierKeys.add(vkCode)
        }
      } else {
        if (pressed) {
          this._pressedOtherKeys.add(vkCode)
        }
      }
    })
  }

  /**
   * 注册一个精准快捷键
   * 同 targetId 的快捷键允许被覆盖, 否则会抛出异常
   */
  register(
    targetId: string,
    shortcutId: string,
    type: 'last-active' | 'normal',
    cb: (details: ShortcutDetails) => void
  ) {
    if (!this._app.state.isAdministrator) {
      this._log.info(`当前位于普通权限, 忽略快捷键注册: ${shortcutId} (${type})`)
      return
    }

    const originShortcut = this._targetIdMap.get(targetId)
    if (originShortcut) {
      const options = this._registrationMap.get(originShortcut)
      if (options) {
        if (options.targetId === targetId) {
          this._registrationMap.delete(originShortcut)
        } else {
          throw new Error(`Shortcut with targetId ${targetId} already exists`)
        }
      }
    }

    this._registrationMap.set(shortcutId, { type, targetId, cb })
    this._targetIdMap.set(targetId, shortcutId)

    this._log.info(`注册快捷键 ${shortcutId} (${type})`)
  }

  unregister(shortcutId: string) {
    const options = this._registrationMap.get(shortcutId)
    if (options) {
      this._registrationMap.delete(shortcutId)
      this._targetIdMap.delete(options.targetId)
      this._log.info(`注销快捷键 ${shortcutId}`)
      return true
    }

    return false
  }

  unregisterByTargetId(targetId: string) {
    const shortcutId = this._targetIdMap.get(targetId)
    if (shortcutId) {
      this._registrationMap.delete(shortcutId)
      this._targetIdMap.delete(targetId)
      return true
    }

    return false
  }

  getRegistration(shortcutId: string) {
    const reservedKeyIds = KeyboardShortcutsMain.DISABLED_KEYS.map((k) => VKEY_MAP[k].keyId)
    if (reservedKeyIds.some((k) => shortcutId.includes(k))) {
      return {
        type: 'normal',
        targetId: KeyboardShortcutsMain.DISABLED_KEYS_TARGET_ID,
        cb: () => {}
      }
    }

    return this._registrationMap.get(shortcutId) || null
  }

  getRegistrationByTargetId(targetId: string) {
    if (targetId === KeyboardShortcutsMain.DISABLED_KEYS_TARGET_ID) {
      return {
        type: 'normal',
        targetId: KeyboardShortcutsMain.DISABLED_KEYS_TARGET_ID,
        cb: () => {}
      }
    }

    const shortcutId = this._targetIdMap.get(targetId)
    if (shortcutId) {
      return this._registrationMap.get(shortcutId) || null
    }
    return null
  }

  async onDispose() {
    if (this._app.state.isAdministrator) {
      this._log.info('停止监听键盘事件')
      input.stopHook()
    }
    this.events.removeAllListeners()
    this._registrationMap.clear()
    this._targetIdMap.clear()
    this._correctTask.cancel()
  }
}
