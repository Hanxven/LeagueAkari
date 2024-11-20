import input from '@main/native/la-input-win64.node'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import EventEmitter from 'node:events'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { UNIFIED_KEY_ID, VKEY_MAP, isModifierKey } from './definitions'

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
  static dependencies = ['app-common-main', 'akari-ipc-main']

  private readonly _common: AppCommonMain
  private readonly _ipc: AkariIpcMain

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

  /**
   * 原生监听到的键盘事件
   */
  public readonly events = new EventEmitter<{
    /**
     * 在任意一个有意义的快捷键被按下时触发
     */
    shortcut: [details: ShortcutDetails]

    /**
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

  constructor(deps: any) {
    this._common = deps['app-common-main']
    this._ipc = deps['akari-ipc-main']
  }

  sendKey(code: number, press: boolean) {
    input.sendKey(code, press)
  }

  sendKeys(str: string) {
    input.sendKeys(str)
  }

  async onInit() {
    if (this._common.state.isAdministrator) {
      input.startHook()

      input.onKeyEvent((key) => {
        const [keyCodeRaw, state] = key.split(',')

        // ignore VK_PACKET (231)
        if (keyCodeRaw === '231') {
          return
        }

        if (!VKEY_MAP[keyCodeRaw]) {
          return
        }

        const keyCode = parseInt(keyCodeRaw, 10)
        const isDown = state === 'DOWN'

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
                keyCodes: this._lastActiveShortcut,
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
    }

    this._ipc.onCall(KeyboardShortcutsMain.id, 'getRegistration', (shortcutId: string) => {
      return this.getRegistration(shortcutId)
    })

    this._ipc.onCall(KeyboardShortcutsMain.id, 'getRegistrationByTargetId', (targetId: string) => {
      return this.getRegistrationByTargetId(targetId)
    })
  }

  /**
   * 注册一个精准快捷键, 松手后触发的那种 (避免和当前按键冲突)
   */
  register(
    targetId: string,
    shortcutId: string,
    type: 'last-active' | 'normal',
    cb: (details: ShortcutDetails) => void
  ) {
    const options = this._registrationMap.get(shortcutId)

    if (options && options.targetId !== targetId) {
      throw new Error(`Shortcut ${shortcutId} is already registered by ${options.targetId}`)
    }

    this._registrationMap.set(shortcutId, { type, targetId, cb })
    this._targetIdMap.set(targetId, shortcutId)
  }

  unregister(shortcutId: string) {
    const options = this._registrationMap.get(shortcutId)
    if (options) {
      this._registrationMap.delete(shortcutId)
      this._targetIdMap.delete(options.targetId)
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
    return this._registrationMap.get(shortcutId) || null
  }

  getRegistrationByTargetId(targetId: string) {
    const shortcutId = this._targetIdMap.get(targetId)
    if (shortcutId) {
      return this._registrationMap.get(shortcutId) || null
    }
    return null
  }

  async onDispose() {
    if (this._common.state.isAdministrator) {
      input.stopHook()
    }
    this.events.removeAllListeners()
    this._registrationMap.clear()
    this._targetIdMap.clear()
  }
}
