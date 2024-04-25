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
import { setShowFreeSoftwareDeclaration } from '@shared/renderer/features/app'
import { useAppStore } from '@shared/renderer/features/app/store'
import { useCoreFunctionalityStore } from '@shared/renderer/features/core-functionality/store'
import { setupNaiveUiNotificationEvents } from '@shared/renderer/notification'
import { greeting } from '@shared/renderer/utils/greeting'
import { ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import AppTitleBar from './components/AppTitleBar.vue'
import DeclarationModal from './components/DeclarationModal.vue'
import UpdateModal from './components/UpdateModal.vue'
import SettingsModal from './components/settings-modal/SettingsModal.vue'

greeting()

setupNaiveUiNotificationEvents()

const router = useRouter()

const app = useAppStore()

const cf = useCoreFunctionalityStore()

watchEffect(() => {
  if (app.lcuConnectionState === 'disconnected') {
    router.replace('/connecting')
  }
})

watch(
  () => cf.ongoingState,
  (state) => {
    if (state === 'champ-select' || state === 'in-game') {
      if (router.currentRoute.value.name !== 'ongoing-name') {
        router.replace({ name: 'ongoing-game' })
      }
    }
  }
)

const isShowingSettingModal = ref(false)
const isShowingNewUpdateModal = ref(false)
const isShowingFreeSoftwareDeclaration = ref(false)

watchEffect(() => {
  if (app.settings.showFreeSoftwareDeclaration) {
    isShowingFreeSoftwareDeclaration.value = true
  }
})

watchEffect(() => {
  if (app.updates.newUpdates) {
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
