import { app, dialog } from 'electron'
import { observable, reaction, runInAction } from 'mobx'

import {
  checkAdminPrivilegesCmd,
  checkAdminPrivilegesPowershell,
  checkAvailableShells,
  isProcessExistsCmd,
  isProcessExistsPowershell
} from '../utils/shell'
import { onCall, sendUpdateToAll } from '../utils/ipc'

const clientName = 'LeagueClientUx.exe'

export const basicState = observable({
  isAdmin: false,
  availableShells: [] as string[]
})

// 基础通讯 API
export async function initBasicIpc() {
  reaction(
    () => basicState.isAdmin,
    (isAdmin) => {
      sendUpdateToAll('isAdmin', isAdmin)
    }
  )

  const shells = await checkAvailableShells()

  if (shells.length === 0) {
    dialog.showErrorBox(
      '终端不可用',
      '未检测到 cmd、powershell 或 pwsh 终端存在于当前平台。本工具依赖于上述终端之一来收集必要信息。请确保至少安装其中一个终端后再尝试运行本工具。'
    )
    app.quit()
  }

  runInAction(() => {
    basicState.availableShells = shells
  })

  await new Promise<void>((resolve) => {
    if (shells[0] === 'cmd') {
      checkAdminPrivilegesCmd().then((isAdmin) => {
        runInAction(() => (basicState.isAdmin = isAdmin))
        resolve()
      })
    } else {
      checkAdminPrivilegesPowershell(shells[0]).then((isAdmin) => {
        runInAction(() => (basicState.isAdmin = isAdmin))
        resolve()
      })
    }
  })

  onCall('isAdmin', () => {
    return basicState.isAdmin
  })

  onCall('getVersion', () => {
    return app.getVersion()
  })

  // 检查英雄联盟渲染端是否存在
  onCall('isLeagueClientExists', async () => {
    if (shells[0] === 'cmd') {
      return await isProcessExistsCmd(clientName)
    } else {
      return await isProcessExistsPowershell(clientName)
    }
  })
}
