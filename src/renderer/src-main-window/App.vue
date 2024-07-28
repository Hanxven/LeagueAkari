<template>
  <div id="app-frame">
    <SettingsModal v-model:show="isShowingSettingModal" v-model:tab-name="settingModelTab" />
    <UpdateModal v-model:show="isShowingNewUpdateModal" :showing-new-update="isShowingNewUpdate" />
    <AnnouncementModal v-model:show="isShowingAnnouncementModal" />
    <DeclarationModal
      v-model:show="isShowingFreeSoftwareDeclaration"
      @confirm="handleConfirmation"
    />
    <MainWindowTitleBar class="title-bar-area" />
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
import { useExternalDataSourceStore } from '@shared/renderer/modules/external-data-source/store'
import { setupNaiveUiNotificationEvents } from '@shared/renderer/notification'
import { greeting } from '@shared/renderer/utils/greeting'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip
} from 'chart.js'
import { useNotification } from 'naive-ui'
import { provide, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import AnnouncementModal from './components/AnnouncementModal.vue'
import DeclarationModal from './components/DeclarationModal.vue'
import MainWindowTitleBar from './components/MainWindowTitleBar.vue'
import UpdateModal from './components/UpdateModal.vue'
import SettingsModal from './components/settings-modal/SettingsModal.vue'

ChartJS.register(
  CategoryScale,
  RadialLinearScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
)

setupNaiveUiNotificationEvents()

const router = useRouter()

const app = useAppStore()
const cf = useCoreFunctionalityStore()
const au = useAutoUpdateStore()

greeting(app.version)

provide('app', {
  openSettingsModal: (tabName?: string) => {
    isShowingSettingModal.value = true
    if (tabName) {
      settingModelTab.value = tabName
    }
  },
  openUpdateModal: () => {
    isShowingNewUpdateModal.value = true
    if (au.newUpdates) {
      isShowingNewUpdate.value = true
    } else {
      isShowingNewUpdate.value = false
    }
  },
  openAnnouncementModal: () => {
    isShowingAnnouncementModal.value = true
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
const settingModelTab = ref('basic')
const isShowingNewUpdateModal = ref(false)
const isShowingNewUpdate = ref(false)
const isShowingFreeSoftwareDeclaration = ref(false)
const isShowingAnnouncementModal = ref(false)

watchEffect(() => {
  if (app.settings.showFreeSoftwareDeclaration) {
    isShowingFreeSoftwareDeclaration.value = true
  }
})

watchEffect(() => {
  if (au.currentAnnouncement && !au.currentAnnouncement.isRead) {
    isShowingAnnouncementModal.value = true
  }
})

watchEffect(() => {
  if (au.newUpdates) {
    isShowingNewUpdateModal.value = true
    isShowingNewUpdate.value = true
  } else {
    isShowingNewUpdateModal.value = false
    isShowingNewUpdate.value = false
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

useKeyboardCombo('AKARI', {
  onFinish: () => {
    notification.success({
      title: 'League Akari',
      content: 'League Akari!',
      duration: 6000
    })
  },
  requireSameEl: true,
  caseSensitive: false,
  maxInterval: 250
})
</script>

<style lang="less">
#app-frame {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: var(--app-min-width);
  min-height: var(--app-min-height);

  > .title-bar-area {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
  }

  > .content {
    height: 0;
    flex: 1;
    overflow: hidden;
    margin-top: var(--title-bar-height);
  }
}
</style>
