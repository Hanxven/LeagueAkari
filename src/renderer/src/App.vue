<template>
  <div id="app-frame">
    <SettingsModal v-model:show="isShowingSettingModal" />
    <UpdateModal v-model:show="isShowingNewUpdateModal" />
    <DeclarationModal
      v-model:show="isShowingFreeSoftwareDeclaration"
      @confirm="handleConfirmation"
    />
    <AppTitleBar @open-settings="isShowingSettingModal = true" />
    <div class="content"><RouterView /></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import AppTitleBar from './components/AppTitleBar.vue'
import DeclarationModal from './components/DeclarationModal.vue'
import UpdateModal from './components/UpdateModal.vue'
import SettingsModal from './components/settings-modal/SettingsModal.vue'
import { setupNaiveUiNotificationEvents } from './events/notifications'
import { setShowFreeSoftwareDeclaration } from './features/app'
import { useAppState } from './features/stores/app'
import { useLcuStateStore } from './features/stores/lcu-connection'
import { useSettingsStore } from './features/stores/settings'
import { greeting } from './utils/greeting'

greeting()

setupNaiveUiNotificationEvents()

const router = useRouter()

const lcuState = useLcuStateStore()
watchEffect(() => {
  if (lcuState.state === 'disconnected') {
    router.replace('/connecting')
  }
})

const appState = useAppState()
const settings = useSettingsStore()

const isShowingSettingModal = ref(false)
const isShowingNewUpdateModal = ref(false)
const isShowingFreeSoftwareDeclaration = ref(settings.app.showFreeSoftwareDeclaration)

watchEffect(() => {
  if (appState.updates.newUpdates) {
    isShowingNewUpdateModal.value = true
  } else {
    isShowingNewUpdateModal.value = false
  }
})

const handleConfirmation = (notShowAgain: boolean) => {
  setShowFreeSoftwareDeclaration(notShowAgain)
  isShowingFreeSoftwareDeclaration.value = false
}

// check for updates
</script>

<style lang="less">
#app-frame {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: var(--app-min-width);
  min-height: var(--app-min-height);

  > .content {
    height: 0;
    flex: 1;
    overflow: hidden;
  }
}
</style>
