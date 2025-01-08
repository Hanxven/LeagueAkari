import { defineStore } from 'pinia'
import { ref, shallowReactive } from 'vue'

// copied
export type MainWindowCloseAction = 'minimize-to-tray' | 'quit' | 'ask'

export const useWindowManagerStore = defineStore('shard:window-manager-renderer', () => {
  const settings = shallowReactive({
    mainWindowCloseAction: 'ask' as MainWindowCloseAction,
    auxWindowEnabled: true,
    auxWindowAutoShow: true,
    auxWindowOpacity: 0.9,
    auxWindowPinned: true,
    auxWindowShowSkinSelector: false,
    backgroundMaterial: 'none' as 'none' | 'mica'
  })

  const mainWindowStatus = ref('normal')
  const mainWindowFocus = ref('focused')
  const mainWindowShow = ref(true)

  const auxWindowStatus = ref('normal')
  const auxWindowFocus = ref('focused')
  const auxWindowShow = ref(true)
  const auxWindowFunctionality = ref('indicator')

  const supportsMica = ref(false)

  return {
    settings,
    mainWindowStatus,
    mainWindowFocus,
    mainWindowShow,
    auxWindowStatus,
    auxWindowFocus,
    auxWindowShow,
    auxWindowFunctionality,

    supportsMica
  }
})
