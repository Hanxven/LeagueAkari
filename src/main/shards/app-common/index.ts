import { AkariSharedGlobalShard } from '@shared/akari-shard/interface'
import { AkariManager } from '@shared/akari-shard/manager'

import toolkit from '../../native/laToolkitWin32x64.node'
import { AkariIpcMain } from '../ipc'
import { AppCommonState } from './state'

/**
 * 一些不知道如何分类的通用功能, 可以放到这里
 */
export class AppCommonMain {
  static id = 'app-common-main'
  static dependencies = [AkariManager.SHARED_GLOBAL_ID, 'akari-ipc-main']

  public state = new AppCommonState()

  private _shared: AkariSharedGlobalShard
  private _ipc: AkariIpcMain

  constructor(deps: any) {
    this._shared = deps[AkariManager.SHARED_GLOBAL_ID]
    this._ipc = deps['akari-ipc-main']

    this.state.setAdministrator(toolkit.isElevated())

    // 通知第二实例事件
    this._shared.global.bus.on('second-instance', (commandLine, workingDirectory) => {
      this._ipc.sendEvent(AppCommonMain.id, 'second-instance', commandLine, workingDirectory)
    })
  }
}
