import { CommonMain } from '../common'

/**
 * 处理键盘快捷键的模块
 * 通过较为 Native 的方式, 使其可以在任何地方使用
 */
export class KeyboardShortcuts {
  static id = 'keyboard-shortcuts-main'
  static dependencies = ['common-main']

  private readonly _common: CommonMain

  constructor(deps: any) {
    this._common = deps['common-main']
  }
}
