import { ipcStateSync, onRendererCall } from '@main/utils/ipc'
import { LcuAuth } from '@main/utils/lcu-auth'
import { SUBSCRIBED_LCU_ENDPOINTS } from '@shared/constants/subscribed-lcu-endpoints'
import { RadixEventEmitter } from '@shared/event-emitter'
import { formatError } from '@shared/utils/errors'
import { sleep } from '@shared/utils/sleep'
import axios, { AxiosInstance, isAxiosError } from 'axios'
import https from 'https'
import { comparer, computed, makeAutoObservable, observable, reaction } from 'mobx'
import { WebSocket } from 'ws'

import { appState } from './app'
import { getLaunchedClients } from './lcu-client'
import { createLogger } from './log'
import { mwNotification } from './main-window'

export type LcuConnectionStateType = 'connecting' | 'connected' | 'disconnected'

const logger = createLogger('lcu-connection')

class LcuConnectionState {
  state: LcuConnectionStateType = 'disconnected'

  auth: LcuAuth | null = null

  launchedClients: LcuAuth[] = []

  connectingClient: LcuAuth | null = null

  constructor() {
    makeAutoObservable(this, {
      auth: observable.ref,
      launchedClients: observable.struct,
      connectingClient: observable.struct
    })
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

  setLaunchedClients(c: LcuAuth[]) {
    this.launchedClients = c
  }

  setConnectingClient(c: LcuAuth | null) {
    this.connectingClient = c
  }
}

export const lcuConnectionState = new LcuConnectionState()

export const lcuEventBus = new RadixEventEmitter()

let clientPollTimerId: NodeJS.Timeout

let lcuHttpRequest: AxiosInstance | null = null
let ws: WebSocket | null = null

// a fixed url of LOL game client
const GAME_CLIENT_BASE_URL = 'https://127.0.0.1:2999'

const CLIENT_CMD_POLL_INTERVAL = 2000
const CONNECT_TO_LCU_RETRY_INTERVAL = 750

export const gameClientHttpRequest = axios.create({
  baseURL: GAME_CLIENT_BASE_URL,
  httpsAgent: new https.Agent({ rejectUnauthorized: false })
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
      rejectUnauthorized: false
    }),
    timeout: REQUEST_TIMEOUT_MS,
    proxy: false
  })

  // ping 测试，有任何返回内容则成功
  try {
    await lcuHttpRequest.get(PING_URL)
  } catch (error) {
    if (isAxiosError(error) && (!error.response || (error.status && error.status >= 500))) {
      logger.warn(`无法执行 PING 操作: ${formatError(error)}`)

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
    rejectUnauthorized: false
  })

  return ws
}

export function getHttpInstance() {
  return lcuHttpRequest
}

export function getWebSocket() {
  return ws
}

export function setWebSocketSubscribeAll(enabled: boolean) {
  if (!ws) {
    return Promise.reject(new Error('LCU is not connected'))
  }

  const _sendSubscribeTask = (code: number, eventName: string) =>
    new Promise<void>((resolve, reject) => {
      ws?.send(JSON.stringify([code, eventName]), (error) => {
        if (error instanceof Error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })

  if (enabled) {
    const subTasks = SUBSCRIBED_LCU_ENDPOINTS.map((eventName) => _sendSubscribeTask(6, eventName))

    subTasks.push(_sendSubscribeTask(5, 'OnJsonApiEvent'))

    return new Promise<void>((resolve, reject) =>
      Promise.all(subTasks)
        .then(() => resolve())
        .catch(reject)
    )
  } else {
    const subTasks = SUBSCRIBED_LCU_ENDPOINTS.map((eventName) => _sendSubscribeTask(5, eventName))

    subTasks.unshift(_sendSubscribeTask(6, 'OnJsonApiEvent'))

    return new Promise<void>((resolve, reject) =>
      Promise.all(subTasks)
        .then(() => resolve())
        .catch(reject)
    )
  }
}

const INTERVAL_TIMEOUT = 12500

async function connectToLcu(auth: LcuAuth) {
  try {
    if (lcuConnectionState.state === 'connecting' || lcuConnectionState.state === 'connected') {
      return
    }

    const { certificate, ...rest } = auth
    logger.info(`尝试连接，${JSON.stringify(rest)}`)

    lcuConnectionState.setConnecting()

    const ws = await initWebSocket(auth)

    let timeoutTimer: NodeJS.Timeout
    await new Promise<void>((resolve, reject) => {
      timeoutTimer = setTimeout(() => {
        ws.close()
        const error = new Error(`timeout trying to connect to LCU Websocket: ${INTERVAL_TIMEOUT}ms`)
        error.name = 'LCU:TIMEOUT'
        reject(error)
      }, INTERVAL_TIMEOUT)

      ws.on('open', async () => {
        try {
          await initHttpInstance(auth)
          clearTimeout(timeoutTimer)
        } catch (error) {
          reject(error)
        }

        const _sendTask = (eventName: string) =>
          new Promise<void>((resolve, reject) => {
            ws.send(JSON.stringify([5, eventName]), (error) => {
              if (error instanceof Error) {
                reject(error)
              } else {
                resolve()
              }
            })
          })

        const subTasks = SUBSCRIBED_LCU_ENDPOINTS.map((eventName) => _sendTask(eventName))

        Promise.all(subTasks)
          .then(() => {
            lcuConnectionState.setConnected(auth)
            resolve()
          })
          .catch((error) => {
            lcuConnectionState.setDisconnected()
            ws.close()
            reject(error)
          })
      })

      ws.on('error', (error) => {
        lcuConnectionState.setDisconnected()
        clearTimeout(timeoutTimer)
        reject(error)
      })
    })

    ws.on('close', () => {
      lcuConnectionState.setDisconnected()
      clearTimeout(timeoutTimer)
    })

    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg.toString())

        // self main process
        lcuEventBus.emit(data[2].uri, data[2])
      } catch {
        /* TODO NOTHING */
      }
    })
  } catch (error) {
    lcuConnectionState.setDisconnected()
    throw error
  }
}

async function doConnectingLoop() {
  while (true) {
    // 连接途中，目标丢失，停止连接
    if (!lcuConnectionState.connectingClient) {
      break
    }

    // 目标连接对象已不在当前启动列表中，停止连接
    if (
      !lcuConnectionState.launchedClients.find(
        (c) => c.pid === lcuConnectionState.connectingClient?.pid
      )
    ) {
      lcuConnectionState.setConnectingClient(null)
      break
    }

    try {
      await connectToLcu(lcuConnectionState.connectingClient)
      lcuConnectionState.setConnectingClient(null) // finished connecting!
      break
    } catch (error) {
      if ((error as any).code !== 'ECONNREFUSED') {
        mwNotification.error(
          'lcu-connection',
          '连接错误',
          `尝试连接到 LCU 时发生错误：${(error as any)?.message}`
        )
        logger.error(`尝试连接到 LCU 客户端时发生错误 ${formatError(error)}`)
      }
    }

    await sleep(CONNECT_TO_LCU_RETRY_INTERVAL)
  }
}

export async function initLcuConnection() {
  ipcStateSync('lcu-connection/state', () => lcuConnectionState.state)
  ipcStateSync('lcu-connection/auth', () => lcuConnectionState.auth)
  ipcStateSync('lcu-connection/launched-clients', () => lcuConnectionState.launchedClients)
  ipcStateSync('lcu-connection/connecting-client', () => lcuConnectionState.connectingClient)

  const pollTiming = computed(() => {
    if (lcuConnectionState.state === 'connected') {
      return 'stop-it!'
    }

    if (!appState.isAdministrator && appState.settings.useWmic) {
      return 'stop-it!'
    }

    return 'do-polling！'
  })

  reaction(
    () => pollTiming.get(),
    (state) => {
      if (state === 'stop-it!') {
        lcuConnectionState.setLaunchedClients([])
        clearInterval(clientPollTimerId)
        return
      }

      const _pollFn = async () => {
        try {
          lcuConnectionState.setLaunchedClients(await getLaunchedClients())
        } catch (error) {
          mwNotification.error('lcu-connection', '进程轮询', '在获取客户端进程信息时发生错误')
          logger.error(`获取客户端信息时失败 ${formatError(error)}`)
        }
      }

      _pollFn()
      clientPollTimerId = setInterval(_pollFn, CLIENT_CMD_POLL_INTERVAL)
    },
    { fireImmediately: true }
  )

  reaction(
    () => lcuConnectionState.connectingClient,
    (auth) => {
      if (!auth) {
        return
      }

      doConnectingLoop()
    }
  )

  // 自动连接 - 当客户端唯一时，自动连接到 LCU 客户端
  reaction(
    () => [appState.settings.autoConnect, lcuConnectionState.launchedClients] as const,
    async ([s, c]) => {
      if (s) {
        if (c.length === 1) {
          lcuConnectionState.setConnectingClient(c[0])
        } else {
          lcuConnectionState.setConnectingClient(null)
        }
      }
    }
  )

  reaction(
    () => [lcuConnectionState.auth, lcuConnectionState.state] as const,
    ([a, s]) => {
      if (a) {
        const { certificate, ...rest } = a
        logger.info(`LCU 状态发生变化: ${s} ${JSON.stringify(rest)}`)
      } else {
        logger.info(`LCU 状态发生变化: ${s} ${JSON.stringify(a)}`)
      }
    },
    { equals: comparer.shallow }
  )

  onRendererCall('lcu-connection/connect', async (_, auth: LcuAuth) => {
    lcuConnectionState.setConnectingClient(auth)
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

      logger.warn(`LCU HTTP 客户端错误: ${formatError(error)}`)

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

      logger.warn(`游戏客户端错误 Game Client: ${formatError(error)}`)

      throw error
    }
  })

  logger.info('初始化完成')
}
