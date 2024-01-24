import axios, { AxiosInstance, isAxiosError } from 'axios'
import https from 'https'
import { observable, reaction, runInAction, toJS } from 'mobx'
import { WebSocket } from 'ws'

import {
  LcuAuth,
  certificate,
  isLcuAuthObject,
  queryLcuAuth,
  queryLcuAuthOnAdmin
} from '../utils/lcu-auth'
import { getRandomAvailableLoopbackAddrWithPort } from '../utils/loopback'
import { basicState } from './basic'
import { onCall, sendUpdateToAll } from '../utils/ipc'

let request: AxiosInstance | null = null
let ws: WebSocket | null = null

export const connectState = observable<{
  wsState: string
  auth: LcuAuth | null
}>({
  wsState: 'disconnected',
  auth: null
})

reaction(
  () => connectState.wsState,
  (wsState) => {
    sendUpdateToAll('lcuState', wsState)
  }
)

reaction(
  () => connectState.auth,
  (lcuAuth) => {
    sendUpdateToAll('lcuAuth', toJS(lcuAuth))
  }
)

const PING_URL = '/riotclient/auth-token'
const REQUEST_TIMEOUT = 10000

async function initHttpInstance(auth: LcuAuth) {
  request = axios.create({
    baseURL: `https://127.0.0.1:${auth.port}`,
    headers: {
      Authorization: `Basic ${Buffer.from(`riot:${auth.password}`).toString('base64')}`
    },
    httpsAgent: new https.Agent({
      ca: auth.certificate,
      localAddress: await getRandomAvailableLoopbackAddrWithPort(auth.port)
    }),
    timeout: REQUEST_TIMEOUT,
    proxy: false
  })

  // ping 测试
  try {
    await request.get(PING_URL)
  } catch (err) {
    if (isAxiosError(err) && (!err.response || (err.status && err.status >= 500))) {
      console.error(err)
      throw new Error('初始化 ping 失败')
    }
  }

  // 在主进程和渲染进程通信途中，仅内部错误被视作错误
  // 4xx 和 5xx 错误在业务上被看作是正常响应，交由渲染进程处理
  request.interceptors.response.use(null, (err) => {
    if (isAxiosError(err) && (err.response || (!err.response && err.status && err.status < 500))) {
      return Promise.resolve(err.response)
    }
    return Promise.reject(err)
  })

  return request
}

async function initWebSocket(auth: LcuAuth) {
  ws = new WebSocket(`wss://riot:${auth.password}@127.0.0.1:${auth.port}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`riot:${auth.password}`).toString('base64')}`
    },
    agent: new https.Agent({
      localAddress: await getRandomAvailableLoopbackAddrWithPort(auth.port),
      keepAlive: true
    }),
    ca: auth.certificate,
    rejectUnauthorized: typeof auth.certificate !== 'undefined'
  })

  return ws
}

export function getHttpInstance() {
  return request
}

export function getWebSocket() {
  return ws
}

const INTERVAL_TIMEOUT = 10000

export async function initConnectionIpc() {
  onCall('connect', async (_, auth1?: LcuAuth) => {
    try {
      if (connectState.wsState === 'connecting') {
        throw new Error('连接正在进行中')
      }

      if (auth1 && !isLcuAuthObject(auth1)) {
        throw new Error('错误的 LcuAuth 格式')
      }

      runInAction(() => {
        connectState.wsState = 'connecting'
      })

      const auth =
        auth1 || (basicState.isAdmin ? await queryLcuAuthOnAdmin() : await queryLcuAuth())

      auth.certificate = auth.certificate || certificate

      const ws = await initWebSocket(auth)

      let timeoutTimer: NodeJS.Timeout
      await new Promise<void>((resolve, reject) => {
        timeoutTimer = setTimeout(() => {
          ws.close()
          reject(new Error('连接超时'))
        }, INTERVAL_TIMEOUT)

        ws.on('open', async () => {
          try {
            await initHttpInstance(auth)
            clearTimeout(timeoutTimer)
          } catch (err) {
            reject(err)
          }

          ws.send(JSON.stringify([5, 'OnJsonApiEvent']))

          runInAction(() => {
            connectState.wsState = 'connected'
            connectState.auth = auth
          })

          resolve()
        })

        ws.on('error', () => {
          runInAction(() => {
            connectState.wsState = 'disconnected'
            connectState.auth = null
          })
          reject(new Error('连接断开'))
        })
      })

      ws.on('close', () => {
        runInAction(() => {
          connectState.wsState = 'disconnected'
          connectState.auth = null
        })
        clearTimeout(timeoutTimer)
      })

      ws.on('message', (msg) => {
        try {
          const data = JSON.parse(msg.toString())[2]
          sendUpdateToAll('lcuEvent', data)
        } catch {
          /* TODO NOTHING */
        }
      })
    } catch (err) {
      runInAction(() => {
        connectState.wsState = 'disconnected'
        connectState.auth = null
      })
      throw err
    }
  })

  onCall('getLcuState', async () => {
    return connectState.wsState
  })

  onCall('getLcuAuth', async () => {
    return toJS(connectState.auth)
  })

  onCall('httpRequest', async (_event, config) => {
    if (connectState.wsState !== 'connected') {
      throw new Error('LCU 未初始化')
    }

    const { config: c, request, ...rest } = await getHttpInstance()!.request(config)

    return {
      ...rest,
      config: {
        data: c.data,
        url: c.url
      }
    }
  })
}
