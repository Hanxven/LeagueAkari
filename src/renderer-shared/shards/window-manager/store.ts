import { defineStore } from 'pinia'
import { ref, shallowReactive } from 'vue'

// copied
export type MainWindowCloseAction = 'minimize-to-tray' | 'quit' | 'ask'

export function useBasicWindowStates() {
  const status = ref<'normal' | 'maximized' | 'minimized'>('normal')
  const focus = ref<'focused' | 'blurred'>('blurred')
  const show = ref(false)
  const bounds = ref(null)
  const ready = ref(false)

  return {
    status,
    focus,
    bounds,
    show,
    ready
  }
}

export const useWindowManagerStore = defineStore('shard:window-manager-renderer', () => {
  const settings = shallowReactive({
    backgroundMaterial: 'none' as 'none' | 'mica'
  })

  const supportsMica = ref(false)

  return {
    settings,
    supportsMica
  }
})

export const useMainWindowStore = defineStore('shard:main-window-renderer/main-window', () => {
  const settings = shallowReactive({
    closeAction: 'ask' as MainWindowCloseAction,
    opacity: 1,
    pinned: false
  })

  const basicWindowState = useBasicWindowStates()

  return {
    settings,
    ...basicWindowState
  }
})

export const useAuxWindowStore = defineStore('shard:main-window-renderer/aux-window', () => {
  const settings = shallowReactive({
    enabled: true,
    autoShow: true,
    opacity: 0.9,
    pinned: true,
    showSkinSelector: false
  })

  const basicWindowState = useBasicWindowStates()

  return {
    settings,
    ...basicWindowState
  }
})

export const useOpggWindowStore = defineStore('shard:main-window-renderer/opgg-window', () => {
  const settings = shallowReactive({
    enabled: true,
    autoShow: true,
    opacity: 0.9,
    pinned: true
  })

  const basicWindowState = useBasicWindowStates()

  return {
    settings,
    ...basicWindowState
  }
})

export const useOngoingGameWindowStore = defineStore(
  'shard:main-window-renderer/ongoing-game-window',
  () => {
    const settings = shallowReactive({
      enabled: true,
      showShortcut: null as string | null,
      opacity: 0.9,
      pinned: true
    })

    const basicWindowState = useBasicWindowStates()

    return {
      settings,
      ...basicWindowState
    }
  }
)
