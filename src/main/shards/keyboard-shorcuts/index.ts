import input from '@main/native/la-input-win64.node'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import EventEmitter from 'node:events'

import { AppCommonMain } from '../app-common'
import { KeyDefinition, VKEY_MAP } from './definitions'

/**
 * 处理键盘快捷键的模块
 * 通过较为 Native 的方式, 使其可以在程序外任何地方使用, 前提是程序有管理员权限
 */
export class KeyboardShortcutsMain implements IAkariShardInitDispose {
  static id = 'keyboard-shortcuts-main'
  static dependencies = ['app-common-main']

  private readonly _common: AppCommonMain

  private _tracked: number[] = new Array(384).fill(0)

  /**
   * 原生监听到的键盘事件
   */
  public readonly events = new EventEmitter<{
    key: [event: KeyDefinition & { isDown: boolean }]
  }>()

  constructor(deps: any) {
    this._common = deps['app-common-main']
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

      const DEFAULT_KEY_DEF = {
        _nameRaw: 'UNKNOWN',
        name: 'UNKNOWN',
        standardName: ''
      }

      input.OnKeyEvent((key) => {
        const [keyCodeRaw, state] = key.split(',')

        const keyCode = parseInt(keyCodeRaw)
        const isDown = state === 'DOWN'

        this.events.emit('key', {
          ...(VKEY_MAP[keyCode] || DEFAULT_KEY_DEF),
          isDown
        })

        this._tracked[keyCode] = state === 'DOWN' ? 1 : 0
      })
    }
  }

  async onDispose() {
    if (this._common.state.isAdministrator) {
      input.stopHook()
    }
    this.events.removeAllListeners()
  }
}
