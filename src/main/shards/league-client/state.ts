import { UxCommandLine } from '@main/utils/ux-cmd'
import { makeAutoObservable, observable } from 'mobx'

export type LcConnectionStateType = 'connecting' | 'connected' | 'disconnected'

export class LeagueClientSettings {
  autoConnect = true

  constructor() {
    makeAutoObservable(this)
  }

  setAutoConnect(s: boolean) {
    this.autoConnect = s
  }
}

export class LeagueClientState {
  connectionState: LcConnectionStateType = 'disconnected'

  auth: UxCommandLine | null = null

  /**
   * 用于表示当前正在连接的客户端, 如果其存在, 就尝试连接到这个客户端
   */
  connectingClient: UxCommandLine | null = null

  constructor() {
    makeAutoObservable(this, {
      auth: observable.ref,
      connectingClient: observable.struct
    })
  }

  get isConnected() {
    return this.connectionState === 'connected'
  }

  setConnected(auth: UxCommandLine) {
    this.connectionState = 'connected'
    this.auth = auth
  }

  setConnecting() {
    this.connectionState = 'connecting'
    this.auth = null
  }

  setDisconnected() {
    this.connectionState = 'disconnected'
    this.auth = null
  }

  setConnectingClient(c: UxCommandLine | null) {
    this.connectingClient = c
  }
}
