import { Shard } from '@shared/akari-shard'

/**
 * 用于处理作用域问题
 *
 * 必须是同步函数, 且需将组件 <SetupInAppScope /> 放置于应用范围中
 */
@Shard(SetupInAppScopeRenderer.id)
export class SetupInAppScopeRenderer {
  static id = 'setup-in-app-scope-renderer'

  private _setupFns: (() => void)[] = []

  setup() {
    this._setupFns.forEach((fn) => fn())
  }

  addSetupFn(fn: () => void) {
    this._setupFns.push(fn)
  }

  removeSetupFn(fn: () => void) {
    const index = this._setupFns.indexOf(fn)
    if (index !== -1) {
      this._setupFns.splice(index, 1)
    }
  }

  clearSetupFns() {
    this._setupFns = []
  }
}
