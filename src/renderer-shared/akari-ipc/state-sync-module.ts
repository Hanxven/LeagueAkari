import { set } from 'lodash'
import { markRaw } from 'vue'

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
    try {
      const configList = (await this.call('get-state-props', stateId)) as {
        path: string
        raw: boolean
      }[]
      const jobs = configList
        .map((config) => {
          return async () => {
            try {
              const value = await this.call(`get-state-prop`, stateId, config.path)
              set(obj, config.path, config.raw ? markRaw(value) : value)
            } catch (error) {
              throw new Error(
                `Failed to get initial state of ${config} from ${stateId}: ${(error as Error).message}`
              )
            }
          }
        })
        .map((job) => job())

      this.onEvent(`update-state-prop/${stateId}`, (path: string, value, raw: boolean) => {
        // FOR DEBUGGING ONLY: uncomment the following line to see state changes
        // console.log(this.id, stateId, path, value)
        set(obj, path, raw ? markRaw(value) : value)
      })

      await Promise.all(jobs)
    } catch (error) {
      console.error(`Failed to sync initial state of ${stateId}`, error)
    }
  }

  async mutateProp(stateId: string, propPath: string, value: any) {
    return this.call(`set-state-prop/${stateId}`, propPath, value)
  }

  async setSetting(settingItem: string, value: any) {
    return this.call(`set-setting`, settingItem, value)
  }
}
