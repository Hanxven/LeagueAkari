<template>
  <div id="app-frame">
    <SettingsModal v-model:show="isShowingSettingModal" v-model:tab-name="settingModelTab" />
    <UpdateModal v-model:show="isShowingNewUpdateModal" :showing-new-update="isShowingNewUpdate" />
    <AnnouncementModal v-model:show="isShowingAnnouncementModal" />
    <DeclarationModal
      v-model:show="isShowingFreeSoftwareDeclaration"
      @confirm="handleConfirmation"
    />
    <Transition name="bg-fade">
      <div
        :key="muis.tabBackgroundSkinUrl || muis.backgroundSkinUrl"
        class="background-wallpaper"
        :class="{ 'no-image': !muis.backgroundSkinUrl && !muis.tabBackgroundSkinUrl }"
        :style="{
          backgroundImage: `url('${muis.tabBackgroundSkinUrl || muis.backgroundSkinUrl}')`
        }"
      ></div>
    </Transition>
    <MainWindowTitleBar />
    <div id="app-content"><RouterView /></div>
  </div>
</template>

<script setup lang="ts">
import { useKeyboardCombo } from '@renderer-shared/compositions/useKeyboardCombo'
import { setupNaiveUiNotificationEvents } from '@renderer-shared/notification'
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useSelfUpdateStore } from '@renderer-shared/shards/self-update/store'
import { greeting } from '@renderer-shared/utils/greeting'
import { KYOKO_MODE_KEY_SEQUENCE } from '@shared/constants/common'
import { useNotification } from 'naive-ui'
import { provide, ref, watchEffect } from 'vue'

import AnnouncementModal from './components/AnnouncementModal.vue'
import DeclarationModal from './components/DeclarationModal.vue'
import UpdateModal from './components/UpdateModal.vue'
import SettingsModal from './components/settings-modal/SettingsModal.vue'
import MainWindowTitleBar from './components/title-bar/MainWindowTitleBar.vue'
import { useMainWindowUiStore } from './shards/main-window-ui/store'

setupNaiveUiNotificationEvents()

const muis = useMainWindowUiStore()

const su = useSelfUpdateStore()
const as = useAppCommonStore()

const app = useInstance<AppCommonRenderer>('app-common-renderer')

greeting(as.version)

provide('app', {
  openSettingsModal: (tabName?: string) => {
    isShowingSettingModal.value = true
    if (tabName) {
      settingModelTab.value = tabName
    }
  },
  openUpdateModal: () => {
    isShowingNewUpdateModal.value = true
    if (su.newUpdates) {
      isShowingNewUpdate.value = true
    } else {
      isShowingNewUpdate.value = false
    }
  },
  openAnnouncementModal: () => {
    isShowingAnnouncementModal.value = true
  }
})

const isShowingSettingModal = ref(false)
const settingModelTab = ref('basic')
const isShowingNewUpdateModal = ref(false)
const isShowingNewUpdate = ref(false)
const isShowingFreeSoftwareDeclaration = ref(false)
const isShowingAnnouncementModal = ref(false)

watchEffect(() => {
  if (as.settings.showFreeSoftwareDeclaration) {
    isShowingFreeSoftwareDeclaration.value = true
  }
})

watchEffect(() => {
  if (su.currentAnnouncement && !su.currentAnnouncement.isRead) {
    console.log(su.currentAnnouncement)
    isShowingAnnouncementModal.value = true
  }
})

watchEffect(() => {
  if (su.newUpdates) {
    isShowingNewUpdateModal.value = true
    isShowingNewUpdate.value = true
  } else {
    isShowingNewUpdateModal.value = false
    isShowingNewUpdate.value = false
  }
})

const handleConfirmation = (notShowAgain: boolean) => {
  app.setShowFreeSoftwareDeclaration(notShowAgain)
  isShowingFreeSoftwareDeclaration.value = false
}

const notification = useNotification()

app.onSecondInstance(() => {
  notification.info({
    title: 'League Akari',
    content: '因为 Akari 是独一无二的，所以同一时间只能有一个 Akari',
    duration: 10000
  })
})

useKeyboardCombo(KYOKO_MODE_KEY_SEQUENCE, {
  onFinish: () => {
    if (as.settings.isInKyokoMode) {
      return
    }

    app.setInKyokoMode(true)
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

  > #app-content {
    height: 0;
    flex: 1;
    overflow: hidden;
  }
}

.background-wallpaper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  z-index: -1;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.80) 0%,
      rgba(0, 0, 0, 0.85) 75%,
      rgba(0, 0, 0, 0.85) 100%
    );
  }

  &.no-image {
    background-color: var(--background-color-primary);

    &::before {
      background: none;
    }
  }
}

.bg-fade-enter-active,
.bg-fade-leave-active {
  transition: opacity 0.3s;
}

.bg-fade-enter-from,
.bg-fade-leave-to {
  opacity: 0;
}

.bg-fade-enter-to,
.bg-fade-leave-from {
  opacity: 1;
}
</style>
