import { LeagueAkariModule } from '@shared/akari/akari-module'
import { IReactionOptions, IReactionPublic, reaction } from 'mobx'

/**
 * 对于简单的状态，通常是 ref 或者 structural 状态量
 */
type SimpleStateGetter = () => any

/**
 * 实现了一些基于 Mobx 的简单状态管理封装
 */
export class MobxBasedModule extends LeagueAkariModule {
  protected _disposers = new Set<Function>()

  /**
   * 使用 mobx 监听一个简单资源的变化，并在变化时推送更新
   * @param resName 资源名称
   * @param getter 资源 getter
   */
  simpleSync(resName: string, getter: SimpleStateGetter) {
    this.autoDisposeReaction(getter, (newValue) => {
      this.sendEvent(`state-update/${resName}`, newValue)
    })
    this.onCall(`state-get/${resName}`, () => getter())
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

  override async dismantle() {
    await super.dismantle()
    this._disposers.forEach((fn) => fn())
    this._disposers.clear()
  }
}
