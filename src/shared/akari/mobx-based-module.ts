import { LeagueAkariModule } from '@shared/akari/akari-module'
import { IReactionOptions, IReactionPublic, reaction } from 'mobx'

import { LeagueAkariModuleManager } from './main-module-manager'

/**
 * 对于简单的状态，通常是 ref 或者 structural 状态量
 */
type SimpleMobxStateGetter = () => any

/**
 * 基于 mobx 状态管理构建的模块，封装了一些 mobx 的功能
 */
export class MobxBasedModule extends LeagueAkariModule {
  private _disposers = new Set<Function>()

  /**
   * 使用 mobx 监听一个简单资源的变化，并在变化时推送更新
   * @param resName 资源名称
   * @param getter 资源 getter
   */
  simpleSync(resName: string, getter: SimpleMobxStateGetter) {
    const disposerFn = reaction(getter, (newValue) => {
      this.sendEvent(`mobx-update/${resName}`, newValue)
    })
    const callRemovalFn = this.onCall(`mobx-get/${resName}`, () => getter())
    this._disposers.add(disposerFn)
    this._disposers.add(callRemovalFn)

    return () => {
      if (this._disposers.has(disposerFn)) {
        disposerFn()
        this._disposers.delete(disposerFn)
      }

      if (this._disposers.has(callRemovalFn)) {
        callRemovalFn()
        this._disposers.delete(callRemovalFn)
      }
    }
  }

  /**
   * mobx `reaction` 封装，会在 unregister 时自动清除
   */
  autoDisposeReaction<T, FireImmediately extends boolean = false>(
    expression: (r: IReactionPublic) => T,
    effect: (
      arg: T,
      prev: FireImmediately extends true ? T | undefined : T,
      r: IReactionPublic
    ) => void,
    opts?: IReactionOptions<T, FireImmediately>
  ) {
    const fn = reaction(expression, effect, opts)
    this._disposers.add(fn)

    return () => {
      if (this._disposers.has(fn)) {
        fn()
        this._disposers.delete(fn)
      }
    }
  }

  override onUnregister(): void {
    super.onUnregister()
    this._disposers.forEach((fn) => fn())
    this._disposers.clear()
  }
}
