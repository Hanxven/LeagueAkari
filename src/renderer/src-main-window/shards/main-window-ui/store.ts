import { defineStore } from 'pinia'
import { ref, shallowReactive } from 'vue'

export const useMainWindowUiStore = defineStore('shard:main-window-ui-renderer', () => {
  const settings = shallowReactive({
    useProfileSkinAsBackground: false
  })

  const backgroundSkinUrl = ref('')
  const tabBackgroundSkinUrl = ref('')

  return {
    settings,
    backgroundSkinUrl,
    tabBackgroundSkinUrl
  }
})
