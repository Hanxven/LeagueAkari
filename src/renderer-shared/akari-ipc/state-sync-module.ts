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

  async stateSync<T extends object>(stateId: string, obj: T) {
    this.onEvent(`update-state-prop/${stateId}`, (path: string | string[], value) =>
      set(obj, path, value)
    )
    try {
      const paths = (await this.call('get-initial-state-props', stateId)) as string[]
      const jobs = paths
        .toSorted((a, b) => b.length - a.length)
        .map((path) => {
          return async () => {
            try {
              const value = await this.call(`get-initial-state-prop`, stateId, path)
              set(obj, path, value)
            } catch (error) {
              throw new Error(
                `Failed to get initial state of ${path} from ${stateId}: ${(error as Error).message}`
              )
            }
          }
        })
        .map((job) => job())

      await Promise.all(jobs)
    } catch (error) {
      console.error(`Failed to sync initial state of ${stateId}`, error)
    }
  }
}
