import input from '@main/native/laInputWin32x64.node'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AppCommonMain } from '../app-common'

/**
 * 处理键盘快捷键的模块
 * 通过较为 Native 的方式, 使其可以在任何地方使用
 */
export class KeyboardShortcuts implements IAkariShardInitDispose {
  static id = 'keyboard-shortcuts-main'
  static dependencies = ['app-common-main']

  private readonly _common: AppCommonMain

  constructor(deps: any) {
    this._common = deps['app-common-main']
  }

  private _handle() {}

  async onInit() {
    // 这个事件监听使用了 Hook 方式, 管理员权限下才能使用
    if (this._common.state.isAdministrator) {
      input.install()
    }
  }

  async onDispose() {
    if (this._common.state.isAdministrator) {
      input.uninstall()
    }
  }
}
