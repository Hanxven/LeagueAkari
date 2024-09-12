import { UxCommandLine } from "@main/utils/ux-cmd"
import { makeAutoObservable, observable } from "mobx"
import { LcuConnectionStateType } from "."

class LcuConnectionSettings {
  autoConnect = true

  constructor() {
    makeAutoObservable(this)
  }

  setAutoConnect(s: boolean) {
    this.autoConnect = s
  }
}

export class LcuConnectionState {
  settings = new LcuConnectionSettings()

  state: LcuConnectionStateType = 'disconnected'

  auth: UxCommandLine | null = null

  launchedClients: UxCommandLine[] = []

  connectingClient: UxCommandLine | null = null

  constructor() {
    makeAutoObservable(this, {
      auth: observable.ref,
      launchedClients: observable.struct,
      connectingClient: observable.struct
    })
  }

  setConnected(auth: UxCommandLine) {
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

  setLaunchedClients(c: UxCommandLine[]) {
    this.launchedClients = c
  }

  setConnectingClient(c: UxCommandLine | null) {
    this.connectingClient = c
  }
}