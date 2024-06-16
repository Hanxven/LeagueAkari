import { defineStore } from 'pinia'
import { reactive, ref, shallowRef } from 'vue'

export type LcuConnectionState = 'connecting' | 'connected' | 'disconnected'

export interface LcuAuth {
  port: number
  pid: number
  password: string
  certificate: string
  rsoPlatformId: string
  region: string
}

export const useLcuConnectionStore = defineStore('module:lcu-connection', () => {
  const state = ref<LcuConnectionState>('connecting')
  const auth = shallowRef<LcuAuth | null>(null)

  const connectingClient = shallowRef<LcuAuth | null>(null)
  const launchedClients = shallowRef<LcuAuth[]>([])

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
