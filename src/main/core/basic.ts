import cp from 'child_process'
import { app } from 'electron'
import { observable, reaction, runInAction } from 'mobx'

import { onCall, sendUpdateToAll } from './common'

const clientName = 'LeagueClientUx.exe'

export const basicState = observable({
  isAdmin: false
})

// 基础通讯 API
export function initBasicIpc() {
  reaction(
    () => basicState.isAdmin,
    (isAdmin) => {
      sendUpdateToAll('isAdmin', isAdmin)
    }
  )

  cp.exec('net session', (err) => {
    if (err) {
      runInAction(() => {
        basicState.isAdmin = false
      })
    } else {
      runInAction(() => {
        basicState.isAdmin = true
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
