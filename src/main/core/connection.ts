import axios, { AxiosInstance, isAxiosError } from 'axios'
import https from 'https'
import { observable, reaction, runInAction, toJS } from 'mobx'
import { WebSocket } from 'ws'

import { LcuAuth, certificate, isLcuAuthObject, queryLcuAuth } from '../utils/lcu-auth'
import { getRandomAvailableLoopbackAddrWithPort } from '../utils/loopback'
import { onCall, sendUpdateToAll } from './common'

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

async function initHttpInstance(auth: LcuAuth) {
  request = axios.create({
    baseURL: `https://127.0.0.1:${auth.port}`,
    headers: {
      Authorization: `Basic ${Buffer.from(`riot:${auth.password}`).toString('base64')}`
    },
    httpsAgent: new https.Agent({
      ca: auth.certificate,
      localAddress: await getRandomAvailableLoopbackAddrWithPort(auth.port),
      keepAlive: true
    }),
    timeout: 10000,
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

// 连接之后立即发送大量请求有一定概率会失败
// 因此设置一点缓冲时间
const INTERNAL_WAITING_TIME = 500

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

      const auth = auth1 || (await queryLcuAuth())

      auth.certificate = auth.certificate || certificate

      await initHttpInstance(auth)
      const ws = await initWebSocket(auth)

      let timeoutTimer: NodeJS.Timeout
      let internalWaitingTimer: NodeJS.Timeout
      await new Promise<void>((resolve, reject) => {
        timeoutTimer = setTimeout(() => {
          ws.close()
          reject(new Error('连接超时'))
        }, 10000)

        ws.on('open', () => {
          clearTimeout(timeoutTimer)
          internalWaitingTimer = setTimeout(() => {
            runInAction(() => {
              connectState.wsState = 'connected'
              connectState.auth = auth
            })
          }, INTERNAL_WAITING_TIME)
          ws.send(JSON.stringify([5, 'OnJsonApiEvent']))
          resolve()
        })

        ws.on('error', () => {
          clearTimeout(internalWaitingTimer)
          runInAction(() => {
            connectState.wsState = 'disconnected'
            connectState.auth = null
          })
          reject(new Error('连接断开'))
        })
      })

      ws.on('close', () => {
        clearTimeout(internalWaitingTimer)
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
