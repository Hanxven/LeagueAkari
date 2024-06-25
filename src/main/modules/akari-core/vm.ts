import { LeagueAkariModule } from '@main/akari-ipc/akari-module'
import { NodeVM } from 'vm2'

/**
 * TODO 提供运行环境相关的功能
 */
export class AkariVmModule extends LeagueAkariModule {
  private _vm = new NodeVM()

  constructor() {
    super('vm')
  }

  async setup() {
    await super.setup()
  }

  runInAkariVm(code: string) {
    return this._vm.run(code)
  }
}
