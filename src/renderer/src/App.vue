<template>
  <div id="app-frame">
    <SettingsModal v-model:show="isShowingSettingModal" />
    <AppTitleBar @open-settings="isShowingSettingModal = true" />
    <div class="content"><RouterView /></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import AppTitleBar from './components/AppTitleBar.vue'
import SettingsModal from './components/settings-modal/SettingsModal.vue'
import { setupNaiveUiNotificationEvents } from './events/notifications'
import { useLcuStateStore } from './features/stores/lcu-connection'
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

const isShowingSettingModal = ref(false)
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
