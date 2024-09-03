import { Paths } from '@shared/utils/types'
import { set } from 'lodash'

import { LeagueAkariRendererModule } from './renderer-akari-module'

type SimpleStateSetter = (value: any) => any

/**
 * 用于与主进程 MobxBasedModule 通信
 */
export class StateSyncModule extends LeagueAkariRendererModule {
  /**
   * await 将会等待主进程返回的结果
   * 如果需要提前加载，则需要异步等待
   */
  async getterSync(resName: string, setter: SimpleStateSetter) {
    this.onEvent(`update-getter/${resName}`, setter)
    setter(await this.call(`get-getter/${resName}`))
  }

  /**
   *
   * @param obj 目标对象
   * @param stateId 状态内部标识符
   * @param resPath 来自主进程状态路径
   * @param targetPath 目标设置路径 (若不提供, 则同主进程状态路径)
   */
  async dotPropSync<T extends object>(
    obj: T,
    stateId: string,
    resPath: Paths<T>,
    targetPath?: string
  ) {
    this.onEvent(`update-dot-prop/${stateId}/${resPath}`, (value) =>
      set(obj, targetPath === undefined ? resPath : targetPath, value)
    )
    try {
      set(
        obj,
        targetPath === undefined ? resPath : targetPath,
        await this.call(`get-dot-prop/${stateId}/${resPath}`)
      )
    } catch (error) {
      console.error(`Failed to get initial state of ${resPath} from ${stateId}`, error)
    }
  }
}
