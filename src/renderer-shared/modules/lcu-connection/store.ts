import { defineStore } from 'pinia'
import { reactive, ref, shallowRef } from 'vue'

export type LcuConnectionState = 'connecting' | 'connected' | 'disconnected'

// copied from main process
export interface UxCommandLine {
  port: number
  pid: number
  authToken: string
  certificate: string
  region: string
  rsoPlatformId: string
  riotClientPort: number
  riotClientAuthToken: string
}

export const useLcuConnectionStore = defineStore('module:lcu-connection', () => {
  const state = ref<LcuConnectionState>('connecting')
  const auth = shallowRef<UxCommandLine | null>(null)

  const connectingClient = shallowRef<UxCommandLine | null>(null)
  const launchedClients = shallowRef<UxCommandLine[]>([])

  const settings = reactive({
    autoConnect: true
  })

  return {
    state,
    auth,
    connectingClient,
    launchedClients,
    settings
  }
})
