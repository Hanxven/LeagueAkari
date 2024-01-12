import cp from 'child_process'
import { app } from 'electron'
import { observable, reaction, runInAction } from 'mobx'

import { onCall, sendUpdateToAll } from './common'

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

  const testingCmd = `(New-Object System.Security.Principal.WindowsPrincipal([System.Security.Principal.WindowsIdentity]::GetCurrent())).IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)`
  await new Promise<void>((resolve) => {
    cp.exec(`powershell -Command "${testingCmd}"`, (err, stdout) => {
      runInAction(() => {
        if (err) {
          basicState.isAdmin = false
        } else {
          basicState.isAdmin = stdout.trim() === 'True'
        }
      })
      resolve()
    })
  })

  onCall('isAdmin', () => {
    return basicState.isAdmin
  })

  onCall('getVersion', () => {
    return app.getVersion()
  })

  // 检查英雄联盟渲染端是否存在
  onCall('isLeagueClientExists', async () => {
    return new Promise((resolve) => {
      cp.exec(
        `powershell -WindowStyle Hidden "Get-CimInstance -Query 'SELECT * from Win32_Process WHERE name LIKE ''${clientName}'''"`,
        (err, stdout) => {
          if (err) {
            resolve(false)
            return
          }
          if (stdout.length === 0) {
            resolve(false)
          } else {
            resolve(true)
          }
        }
      )
    })
  })
}
