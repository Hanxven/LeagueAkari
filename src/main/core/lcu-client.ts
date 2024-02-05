import toolkit from '../native/ltToolkitWin32x64.node'
import { onCall } from '../utils/ipc'
import { basicState } from './basic'
import { getHttpInstance } from './connection'

export function initLcuClientFunctions() {
  onCall('fixWindowMethodA', async (_e, config) => {
    if (!basicState.isAdmin) {
      throw new Error('权限不足')
    }

    const instance = getHttpInstance()
    if (!instance) {
      throw new Error('LCU 未连接')
    }

    try {
      const scale = await instance.request({
        url: '/riotclient/zoom-scale',
        method: 'GET'
      })

      toolkit.fixWindowMethodA(scale.data, config)
    } catch (err) {
      throw err
    }
  })
}
