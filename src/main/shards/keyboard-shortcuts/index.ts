import { input } from '@hanxven/league-akari-addons'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import EventEmitter from 'node:events'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'

interface ShortcutDetails {
  keyCodes: number[]
  keys: { keyId: string; isModifier: boolean; keyCode: number }[]
  id: string
  unifiedId: string
  pressed: boolean
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
  /** 最后一次激活的快捷键组合，用于 normal / last-active 逻辑 */
  private _lastActiveShortcut: number[] = []
  /**
   * stateful 类型：当前处于按下状态的快捷键组合，
   * 记录的组合为排序后的修饰键 + 最后按下的非修饰键
   */
  private _activeStatefulShortcut: number[] = []

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

  public readonly events = new EventEmitter<{
    /**
     * 普通快捷键：在任意有意义的快捷键按下时触发（无差别分发)
     */
    shortcut: [details: ShortcutDetails]
    /**
     * last-active：在所有按键松开后触发，用于规避模拟冲突的问题 （无差别分发)
     */
    'last-active-shortcut': [details: ShortcutDetails]
    /**
     * stateful 类型：按下时触发 (仅存在订阅时才会被分发)
     */
    'stateful-shortcut-pressed': [details: ShortcutDetails]
    /**
     * stateful 类型：松开时触发 (仅存在订阅时才会被分发)
     */
    'stateful-shortcut-released': [details: ShortcutDetails]
  }>()

  private _registrationMap = new Map<
    string,
    {
      type: 'last-active' | 'normal' | 'stateful'
      targetId: string
      cb: (details: ShortcutDetails) => void
    }
  >()

  private _targetIdMap = new Map<string, string>()

  constructor(deps: any) {
    this._app = deps['app-common-main']
    this._ipc = deps['akari-ipc-main']
    this._loggerFactory = deps['logger-factory-main']
    this._log = this._loggerFactory.create(KeyboardShortcutsMain.id)
  }

  // fast equal for two arrays (shallow)
  private _areArraysEqual(arr1: number[], arr2: number[]): boolean {
    if (arr1.length !== arr2.length) return false
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false
    }
    return true
  }

  private _buildShortcutDetails(keyCodes: number[], pressed: boolean): ShortcutDetails {
    const keys = keyCodes.map((k) => ({
      keyId: input.VKEY_MAP[k].keyId,
      keyCode: k,
      isModifier: input.isModifierKey(k)
    }))
    const id = keys.map((k) => k.keyId).join('+')
    const unifiedId = [
      ...new Set(keyCodes.map((k) => input.UNIFIED_KEY_ID[k] || input.VKEY_MAP[k].keyId))
    ].join('+')
    return { keyCodes, keys, id, unifiedId, pressed }
  }

  // 当所有按键松开时，发送 last-active 快捷键信息
  private _emitLastActiveShortcutIfNeeded(): void {
    if (
      this._pressedModifierKeys.size === 0 &&
      this._pressedOtherKeys.size === 0 &&
      this._lastActiveShortcut.length > 0
    ) {
      const details = this._buildShortcutDetails(this._lastActiveShortcut, false)
      this.events.emit('last-active-shortcut', details)
      this._ipc.sendEvent(KeyboardShortcutsMain.id, 'last-active-shortcut', details)
      const registration = this._registrationMap.get(details.id)
      if (registration && registration.type === 'last-active') {
        registration.cb(details)
      }
      this._lastActiveShortcut = []
    }
  }

  // 处理修饰键的按下和释放
  private _handleModifierKey(event: input.KeyEvent): void {
    if (this._pressedModifierKeys.has(event.keyCode) === event.isDown) {
      return
    }

    if (event.isDown) {
      this._pressedModifierKeys.add(event.keyCode)
    } else {
      this._pressedModifierKeys.delete(event.keyCode)
    }
  }

  // 处理非修饰键按下事件
  private _handleNonModifierKeyDown(keyCode: number): void {
    this._pressedOtherKeys.add(keyCode)
    const modifiers = Array.from(this._pressedModifierKeys.values())
    const sortedModifiers = modifiers.toSorted((a, b) => {
      return (
        KeyboardShortcutsMain.MODIFIER_READING_ORDER[a] -
        KeyboardShortcutsMain.MODIFIER_READING_ORDER[b]
      )
    })
    const keyCodes = [...sortedModifiers, keyCode]
    const details = this._buildShortcutDetails(keyCodes, true)

    // 更新 lastActive 用于 normal/last-active 逻辑
    this._lastActiveShortcut = keyCodes

    // 触发普通快捷键事件
    this.events.emit('shortcut', details)

    const registration = this._registrationMap.get(details.id)
    if (registration) {
      if (registration.type === 'normal') {
        registration.cb(details)
      } else if (registration.type === 'stateful') {
        // 如果 stateful 组合发生变化，则先触发之前的 released，再触发新的 pressed
        if (!this._areArraysEqual(this._activeStatefulShortcut, keyCodes)) {
          if (this._activeStatefulShortcut.length) {
            const prevDetails = this._buildShortcutDetails(this._activeStatefulShortcut, false)
            this.events.emit('stateful-shortcut-released', prevDetails)
            registration.cb(prevDetails)
          }
          this._activeStatefulShortcut = keyCodes
          this.events.emit('stateful-shortcut-pressed', details)
          registration.cb(details)
        }
      }
    }

    // 通知 IPC 保持原有逻辑
    this._ipc.sendEvent(KeyboardShortcutsMain.id, 'shortcut', details)
  }

  // 处理非修饰键释放事件
  private _handleNonModifierKeyUp(keyCode: number): void {
    this._pressedOtherKeys.delete(keyCode)
    // 如果释放的键是当前 stateful 快捷键中的关键非修饰键，则发出 released 事件
    if (
      this._activeStatefulShortcut.length &&
      this._activeStatefulShortcut[this._activeStatefulShortcut.length - 1] === keyCode
    ) {
      const details = this._buildShortcutDetails(this._activeStatefulShortcut, false)
      this.events.emit('stateful-shortcut-released', details)
      const registration = this._registrationMap.get(details.id)
      if (registration && registration.type === 'stateful') {
        registration.cb(details)
      }
      this._activeStatefulShortcut = []
    }
  }

  private _handleNativeKeyEvent(event: input.KeyEvent): void {
    if (event.keyCode === 231) {
      return
    }

    // 如果是常见修饰键则不处理
    if (event.isCommonModifier) {
      return
    }

    if (event.isModifier) {
      this._handleModifierKey(event)
    } else {
      if (event.isDown) {
        this._handleNonModifierKeyDown(event.keyCode)
      } else {
        this._handleNonModifierKeyUp(event.keyCode)
      }
    }

    // 检查是否所有按键都已释放，若是则发出 last-active 快捷键事件
    this._emitLastActiveShortcutIfNeeded()
  }

  async onInit() {
    if (this._app.state.isAdministrator) {
      this._log.info('监听键盘事件')
      input.instance.install()
      input.instance.on('keyEvent', (key) => {
        this._handleNativeKeyEvent(key)
      })
    }

    this._ipc.onCall(KeyboardShortcutsMain.id, 'getRegistration', (_, shortcutId: string) => {
      const r = this.getRegistration(shortcutId)
      if (!r) return null
      const { cb, ...rest } = r
      return rest
    })

    this._ipc.onCall(
      KeyboardShortcutsMain.id,
      'getRegistrationByTargetId',
      (_, targetId: string) => {
        const r = this.getRegistrationByTargetId(targetId)
        if (!r) return null
        const { cb, ...rest } = r
        return rest
      }
    )

    this._ipc.onCall(KeyboardShortcutsMain.id, '_getInternalVars', () => {
      return {
        _pressedOtherKeys: this._pressedOtherKeys,
        _pressedModifierKeys: this._pressedModifierKeys,
        _lastActiveShortcut: this._lastActiveShortcut,
        _activeStatefulShortcut: this._activeStatefulShortcut
      }
    })
  }

  register(
    targetId: string,
    shortcutId: string,
    type: 'last-active' | 'normal' | 'stateful',
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
    const reservedKeyIds = KeyboardShortcutsMain.DISABLED_KEYS.map((k) => input.VKEY_MAP[k].keyId)
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
      input.instance.uninstall()
    }
    this.events.removeAllListeners()
    this._registrationMap.clear()
    this._targetIdMap.clear()
  }
}
