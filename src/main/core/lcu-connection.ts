import { ipcStateSync, onRendererCall } from '@main/utils/ipc'
import { LcuAuth, RIOT_CERTIFICATE } from '@main/utils/lcu-auth'
import { RadixEventEmitter } from '@shared/event-emitter'
import { formatError } from '@shared/utils/errors'
import axios, { AxiosInstance, isAxiosError } from 'axios'
import https from 'https'
import { makeAutoObservable, observable, reaction } from 'mobx'
import { WebSocket } from 'ws'

import { getRandomAvailableLoopbackAddrWithPort } from '../utils/loopback'
import { appState } from './app'
import { createLogger } from './log'

export type LcuConnectionStateType = 'connecting' | 'connected' | 'disconnected'

const logger = createLogger('lcu-connection')

class LcuConnectionState {
  state: LcuConnectionStateType = 'disconnected'

  auth: LcuAuth | null = null

  constructor() {
    makeAutoObservable(this, { auth: observable.ref })
  }

  setConnected(auth: LcuAuth) {
    this.state = 'connected'
    this.auth = auth
  }

  setConnecting() {
    this.state = 'connecting'
    this.auth = null
  }

  setDisconnected() {
    this.state = 'disconnected'
    this.auth = null
  }
}

export const lcuConnectionState = new LcuConnectionState()

export const lcuEventBus = new RadixEventEmitter()

let lcuHttpRequest: AxiosInstance | null = null
let ws: WebSocket | null = null

// a fixed url of LOL game client
const GAME_CLIENT_BASE_URL = 'https://127.0.0.1:2999'

export const gameClientHttpRequest = axios.create({
  baseURL: GAME_CLIENT_BASE_URL,
  httpsAgent: new https.Agent({ ca: RIOT_CERTIFICATE })
})

const PING_URL = '/riotclient/auth-token'
const REQUEST_TIMEOUT_MS = 12500

async function initHttpInstance(auth: LcuAuth) {
  lcuHttpRequest = axios.create({
    baseURL: `https://127.0.0.1:${auth.port}`,
    headers: {
      Authorization: `Basic ${Buffer.from(`riot:${auth.password}`).toString('base64')}`
    },
    httpsAgent: new https.Agent({
      ca: auth.certificate,
      localAddress: await getRandomAvailableLoopbackAddrWithPort(auth.port)
    }),
    timeout: REQUEST_TIMEOUT_MS,
    proxy: false
  })

  // ping 测试，有任何返回内容则成功
  try {
    await lcuHttpRequest.get(PING_URL)
  } catch (error) {
    if (isAxiosError(error) && (!error.response || (error.status && error.status >= 500))) {
      logger.warn(`LCU client http PING: ${formatError(error)}`)

      throw new Error('http initialization PING failed')
    }
  }

  return lcuHttpRequest
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
  return lcuHttpRequest
}

export function getWebSocket() {
  return ws
}

const INTERVAL_TIMEOUT = 12500

async function connectToLcu(auth1: LcuAuth) {
  try {
    if (lcuConnectionState.state === 'connecting' || lcuConnectionState.state === 'connected') {
      return
    }

    lcuConnectionState.setConnecting()

    const ws = await initWebSocket(auth1)

    let timeoutTimer: NodeJS.Timeout
    await new Promise<void>((resolve, reject) => {
      timeoutTimer = setTimeout(() => {
        ws.close()
        logger.warn(`LCU connecting TIMEOUT, exceeded ${INTERVAL_TIMEOUT} ms`)
        reject(new Error('timeout trying to connect to LCU Websocket'))
      }, INTERVAL_TIMEOUT)

      ws.on('open', async () => {
        try {
          await initHttpInstance(auth1)
          clearTimeout(timeoutTimer)
        } catch (error) {
          reject(error)
        }

        ws.send(JSON.stringify([5, 'OnJsonApiEvent']))

        lcuConnectionState.setConnected(auth1)
        resolve()
      })

      ws.on('error', (error) => {
        lcuConnectionState.setDisconnected()
        logger.warn(`An error occurred during connection to LCU Websocket: ${formatError(error)}`)
        clearTimeout(timeoutTimer)
        reject(new Error('disconnected'))
      })
    })

    ws.on('close', () => {
      lcuConnectionState.setDisconnected()
      clearTimeout(timeoutTimer)
    })

    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg.toString())[2]

        // self main process
        lcuEventBus.emit(data.uri, data)
      } catch {
        /* TODO NOTHING */
      }
    })
  } catch (error) {
    logger.warn(`LCU client connection: ${formatError(error)}`)

    lcuConnectionState.setDisconnected()
    throw error
  }
}

export async function initLcuConnection() {
  ipcStateSync('lcu-connection/state', () => lcuConnectionState.state)
  ipcStateSync('lcu-connection/auth', () => lcuConnectionState.auth)

  reaction(
    () => [lcuConnectionState.auth, lcuConnectionState.state] as const,
    ([a, s]) => {
      logger.info(`LCU state changed: ${s} ${JSON.stringify(a)}`)
    }
  )

  onRendererCall('lcu-connection/connect', async (_, auth1: LcuAuth) => {
    await connectToLcu(auth1)
  })

  onRendererCall('lcu-connection/disconnect', async () => {
    if (ws) {
      ws.close()
      ws = null
    }

    if (lcuHttpRequest) {
      lcuHttpRequest = null
    }

    lcuConnectionState.setDisconnected()
  })

  onRendererCall('lcu-connection/http-request', async (_event, config) => {
    if (lcuConnectionState.state !== 'connected') {
      throw new Error('LCU uninitialized')
    }

    // 通过 IPC 调用的网络请求，则是不完整的可序列化信息
    try {
      const { config: c, request, ...rest } = await getHttpInstance()!.request(config)

      return {
        ...rest,
        config: { data: c.data, url: c.url }
      }
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        const { config: c, request, ...rest } = error.response
        return {
          ...rest,
          config: { data: c.data, url: c.url }
        }
      }

      logger.warn(`LCU client http: ${formatError(error)}`)

      throw error
    }
  })

  onRendererCall('game-client/http-request', async (_event, config) => {
    try {
      const { config: c, request, ...rest } = await gameClientHttpRequest.request(config)

      return {
        ...rest,
        config: { data: c.data, url: c.url }
      }
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        const { config: c, request, ...rest } = error.response
        return {
          ...rest,
          config: { data: c.data, url: c.url }
        }
      }

      logger.warn(`Game client http: ${formatError(error)}`)

      throw error
    }
  })

  logger.info('Initialized')
}
