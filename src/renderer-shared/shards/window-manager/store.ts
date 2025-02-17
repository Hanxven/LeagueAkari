import { defineStore } from 'pinia'
import { ref, shallowReactive } from 'vue'

// copied
export type MainWindowCloseAction = 'minimize-to-tray' | 'quit' | 'ask'

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
    closeAction: 'ask' as MainWindowCloseAction
  })

  const status = ref('normal')
  const focus = ref('focused')
  const show = ref(true)
  const ready = ref(false)

  return {
    settings,
    status,
    focus,
    show,
    ready
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

  const status = ref('normal')
  const focus = ref('focused')
  const show = ref(true)
  const ready = ref(false)

  return {
    settings,
    status,
    focus,
    show,
    ready
  }
})

export const useOpggWindowStore = defineStore('shard:main-window-renderer/opgg-window', () => {
  const settings = shallowReactive({
    enabled: true,
    autoShow: true,
    opacity: 0.9,
    pinned: true
  })

  const status = ref('normal')
  const focus = ref('focused')
  const show = ref(true)
  const ready = ref(false)

  return {
    settings,
    status,
    focus,
    show,
    ready
  }
})
