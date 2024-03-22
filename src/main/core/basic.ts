import { app, dialog } from 'electron'
import { observable, reaction, runInAction } from 'mobx'

import toolkit from '../native/laToolkitWin32x64.node'
import { onCall, sendUpdateToAll } from '../utils/ipc'
import { isProcessExistsStandalone } from '../utils/shell'

const clientName = 'LeagueClientUx.exe'

export const basicState = observable({
  isAdmin: false
})

// 基础通讯 API
export async function initBasicIpc() {
  reaction(
    () => basicState.isAdmin,
    (isAdmin) => {
      sendUpdateToAll('isAdmin', isAdmin)
    }
  )

  runInAction(() => {
    basicState.isAdmin = toolkit.isElevated()
  })

  if (!basicState.isAdmin) {
    dialog.showErrorBox('缺乏必要权限', '本工具依赖管理员权限，以获取必要的命令行信息。')
    throw new Error('缺乏必要权限')
  }

  onCall('isAdmin', () => {
    return basicState.isAdmin
  })

  onCall('getVersion', () => {
    return app.getVersion()
  })

  // 检查英雄联盟渲染端是否存在
  onCall('isLeagueClientExists', async () => {
    return await isProcessExistsStandalone(clientName)
  })
}
