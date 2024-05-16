import { MainWindowCloseStrategy } from '@shared/types/modules/app'
import { defineStore } from 'pinia'
import { VNode, reactive, ref, shallowRef } from 'vue'

interface NewUpdates {
  currentVersion: string
  version: string
  pageUrl: string
  downloadUrl: string
  description: string
}

export type LcuConnectionState = 'connecting' | 'connected' | 'disconnected'

export interface LcuAuth {
  port: number
  pid: number
  password: string
  certificate: string
  rsoPlatformId: string
  region: string
}

export interface TitleBarTask {
  id: string // module id
  progress?: number // from 0 ~ 1
  foregroundColor?: string
  backgroundColor?: string
  text?: string | (() => VNode)
  icon?: () => VNode
}

export const useAppStore = defineStore('core:app', () => {
  const isAdministrator = ref(false)
  const version = ref('0.0.0')
  const updates = ref({
    isCheckingUpdates: false,
    lastCheckAt: null as Date | null,
    newUpdates: null as NewUpdates | null
  })

  const lcuConnectionState = ref<LcuConnectionState>('connecting')
  const lcuAuth = shallowRef<LcuAuth | null>(null)

  const connectingClient = shallowRef<LcuAuth | null>(null)
  const launchedClients = shallowRef<LcuAuth[]>([])

  const settings = reactive({
    autoConnect: false,
    useWmic: false,
    autoCheckUpdates: false,
    showFreeSoftwareDeclaration: false,
    fixWindowMethodAOptions: {
      baseWidth: 1280,
      baseHeight: 720
    },
    closeStrategy: 'unset' as MainWindowCloseStrategy
  })

  const titleBarTasks = ref<TitleBarTask[]>([])

  return {
    isAdministrator,
    version,
    updates,
    settings,
    lcuAuth,
    lcuConnectionState,
    titleBarTasks,
    connectingClient,
    launchedClients
  }
})
