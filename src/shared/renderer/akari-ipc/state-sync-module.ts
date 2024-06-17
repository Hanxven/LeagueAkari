import { LeagueAkariRendererModule } from './renderer-akari-module'

type SimpleStateSetter = (value: any) => any

/**
 * 用于与主进程 MobxBasedModule 通信
 */
export class StateSyncModule extends LeagueAkariRendererModule {
  simpleSync(resName: string, setter: SimpleStateSetter) {
    this.onEvent(`state-update/${resName}`, setter)
    this.call(`state-get/${resName}`).then((s) => setter(s))
  }
}
