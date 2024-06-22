<template>
  <div id="app-frame">
    <SettingsModal v-model:show="isShowingSettingModal" />
    <UpdateModal v-model:show="isShowingNewUpdateModal" />
    <DeclarationModal
      v-model:show="isShowingFreeSoftwareDeclaration"
      @confirm="handleConfirmation"
    />
    <MainWindowTitleBar />
    <div class="content"><RouterView /></div>
  </div>
</template>

<script setup lang="ts">
import { KYOKO_MODE_KEY_SEQUENCE } from '@shared/constants/common'
import { useKeyboardCombo } from '@shared/renderer/compositions/useKeyboardCombo'
import { appRendererModule as am } from '@shared/renderer/modules/app'
import { useAppStore } from '@shared/renderer/modules/app/store'
import { useAutoUpdateStore } from '@shared/renderer/modules/auto-update/store'
import { useCoreFunctionalityStore } from '@shared/renderer/modules/core-functionality/store'
import { setupNaiveUiNotificationEvents } from '@shared/renderer/notification'
import { greeting } from '@shared/renderer/utils/greeting'
import { useNotification } from 'naive-ui'
import { provide, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import DeclarationModal from './components/DeclarationModal.vue'
import MainWindowTitleBar from './components/MainWindowTitleBar.vue'
import UpdateModal from './components/UpdateModal.vue'
import SettingsModal from './components/settings-modal/SettingsModal.vue'

greeting()

setupNaiveUiNotificationEvents()

const router = useRouter()

const app = useAppStore()
const cf = useCoreFunctionalityStore()
const au = useAutoUpdateStore()

provide('app', {
  openSettingsModal: () => {
    isShowingSettingModal.value = true
  }
})

watch(
  () => cf.queryState,
  (state) => {
    if (!cf.settings.autoRouteOnGameStart || !cf.settings.ongoingAnalysisEnabled) {
      return
    }

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
  if (au.newUpdates) {
    isShowingNewUpdateModal.value = true
  } else {
    isShowingNewUpdateModal.value = false
  }
})

const handleConfirmation = (notShowAgain: boolean) => {
  am.setShowFreeSoftwareDeclaration(notShowAgain)
  isShowingFreeSoftwareDeclaration.value = false
}

const notification = useNotification()

am.onEvent('second-instance', () => {
  notification.info({
    title: 'League Akari',
    content: '因为 Akari 是独一无二的，所以同一时间只能有一个 Akari',
    duration: 10000
  })
})

useKeyboardCombo(KYOKO_MODE_KEY_SEQUENCE, {
  onFinish: () => {
    if (app.settings.isInKyokoMode) {
      return
    }

    am.setInKyokoMode(true)

    notification.success({
      title: 'League Akari 测试模式',
      content: 'Kyoko Mode, on!',
      duration: 6000
    })
  },
  requireSameEl: true,
  caseSensitive: false,
  maxInterval: 500
})
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
