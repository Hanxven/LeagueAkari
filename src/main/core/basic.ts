import { app, dialog } from 'electron'
import { observable, reaction, runInAction } from 'mobx'

import { onCall, sendUpdateToAll } from '../utils/ipc'
import { checkAdminPrivileges, checkShellAvailability, isProcessExists } from '../utils/shell'

const clientName = 'LeagueClientUx.exe'

export const basicState = observable({
  isAdmin: false,
  availableShells: {
    cmd: false,
    powershell: false,
    pwsh: false
  }
})

// 基础通讯 API
export async function initBasicIpc() {
  reaction(
    () => basicState.isAdmin,
    (isAdmin) => {
      sendUpdateToAll('isAdmin', isAdmin)
    }
  )

  const shells = await checkShellAvailability()

  if (!shells.cmd && !shells.powershell && !shells.pwsh) {
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
    if (shells.cmd) {
      checkAdminPrivileges('cmd').then((isAdmin) => {
        runInAction(() => (basicState.isAdmin = isAdmin))
        resolve()
      })
    } else {
      checkAdminPrivileges(shells.powershell ? 'powershell' : 'pwsh').then((isAdmin) => {
        runInAction(() => (basicState.isAdmin = isAdmin))
        resolve()
      })
    }
  })

  if (!basicState.isAdmin) {
    dialog.showErrorBox(
      '缺乏必要权限',
      '本工具依赖管理员权限，以获取必要的命令行信息。'
    )
    app.quit()
  }

  onCall('isAdmin', () => {
    return basicState.isAdmin
  })

  onCall('getVersion', () => {
    return app.getVersion()
  })

  // 检查英雄联盟渲染端是否存在
  onCall('isLeagueClientExists', async () => {
    if (shells.cmd) {
      return await isProcessExists('cmd', clientName)
    } else {
      return await isProcessExists(shells.powershell ? 'powershell' : 'pwsh', clientName)
    }
  })
}
