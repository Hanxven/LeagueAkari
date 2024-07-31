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
  async simpleSync(resName: string, setter: SimpleStateSetter) {
    this.onEvent(`state-update/${resName}`, setter)
    setter(await this.call(`state-get/${resName}`))
  }
}
