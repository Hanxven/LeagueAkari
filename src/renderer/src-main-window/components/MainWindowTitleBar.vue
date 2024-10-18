<template>
  <div class="app-title-bar" :class="{ blurred: wmStore.mainWindowFocus === 'blurred' }">
    <NModal
      style="width: 300px"
      transform-origin="center"
      preset="card"
      v-model:show="isCloseConfirmationModelShow"
      :z-index="10000000"
    >
      <template #header><span class="close-confirmation-header">退出 League Akari</span></template>
      <NRadioGroup v-model:value="closeStrategy" size="small">
        <NFlex vertical>
          <NRadio value="minimize-to-tray">最小化到托盘区</NRadio>
          <NRadio value="quit">退出程序</NRadio>
        </NFlex>
      </NRadioGroup>
      <NFlex align="center" justify="space-between" style="margin-top: 12px">
        <NCheckbox v-model:checked="isRememberCloseStrategy" style="margin-right: auto" size="small"
          >记住选择</NCheckbox
        >
        <NFlex style="gap: 4px">
          <NButton
            style="font-size: 13px; width: 54px"
            size="small"
            @click="isCloseConfirmationModelShow = false"
            >取消</NButton
          >
          <NButton
            style="font-size: 13px; width: 54px"
            size="small"
            type="primary"
            @click="handleReallyClose"
            >确定</NButton
          >
        </NFlex>
      </NFlex>
    </NModal>
    <div class="title-bar-items" ref="title-bar-items">
      <div
        v-if="sus.updateProgressInfo"
        class="title-bar-item task-item auto-update relative"
        :class="{ hide: !autoUpdateTaskShow }"
        :title="
          sus.updateProgressInfo.phase === 'waiting-for-restart'
            ? '在程序关闭后执行更新流程'
            : '正在准备更新中'
        "
        @click="() => handleShowAboutSettings()"
        ref="auto-update-task"
      >
        <template v-if="sus.updateProgressInfo.phase === 'downloading'">
          <div
            class="progress-mask"
            :style="{ width: `${sus.updateProgressInfo.downloadingProgress * 100}%` }"
          ></div>
          <NIcon class="icon"><UpgradeFilledIcon /></NIcon>
          <span class="text"
            >下载更新 {{ (sus.updateProgressInfo.downloadingProgress * 100).toFixed() }} %
          </span>
        </template>
        <template v-else-if="sus.updateProgressInfo.phase === 'unpacking'">
          <div
            class="progress-mask"
            :style="{ width: `${sus.updateProgressInfo.unpackingProgress * 100}%` }"
          ></div>
          <NIcon class="icon"><UpgradeFilledIcon /></NIcon>
          <span class="text"
            >正在解压 {{ (sus.updateProgressInfo.unpackingProgress * 100).toFixed() }} %</span
          >
        </template>
        <template v-else-if="sus.updateProgressInfo.phase === 'waiting-for-restart'">
          <NIcon class="icon"><UpgradeFilledIcon /></NIcon>
          <span class="text">关闭后更新</span>
        </template>
      </div>
      <div
        v-if="rts.info.isDead"
        class="title-bar-item task-item respawn-timer relative"
        :class="{ hide: !respawnTimerTaskShow }"
        title="距离重生时间"
        ref="respawn-timer-task"
      >
        <div
          class="progress-mask"
          :style="{ width: `${100 - (rts.info.timeLeft / rts.info.totalTime) * 100}%` }"
        ></div>
        <NIcon class="icon"><HourglassIcon /></NIcon>
        <span class="text">距离重生 {{ rts.info.timeLeft.toFixed() }} s</span>
      </div>
      <div
        v-if="agfs.willAccept"
        class="title-bar-item auto-gameflow-accept task-item relative"
        :class="{ hide: !autoAcceptTaskShow }"
        title="即将开启自动接受对局"
        ref="auto-accept-task"
      >
        <NIcon class="icon"><TimeIcon /></NIcon>
        <span class="text">接受对局 {{ willAcceptIn.toFixed(1) }} s</span>
      </div>
      <div
        v-if="agfs.willSearchMatch"
        class="title-bar-item auto-gameflow-search-match task-item relative"
        :class="{ hide: !autoSearchMatchTaskShow }"
        title="即将开启自动匹配"
        ref="auto-search-match-task"
      >
        <NIcon class="icon"><TimeIcon /></NIcon>
        <span class="text">开启匹配 {{ willSearchMatchIn.toFixed(1) }} s</span>
      </div>
      <div
        v-if="lcs.login.loginQueueState"
        class="title-bar-item in-login-queue task-item relative"
        :class="{ hide: !queueTaskShow }"
        :title="`等待排队登录中 (${lcs.login.loginQueueState.approximateWaitTimeSeconds} / ${lcs.login.loginQueueState.maxDisplayedWaitTimeSeconds} s, ${lcs.login.loginQueueState.estimatedPositionInQueue} / ${lcs.login.loginQueueState.maxDisplayedPosition})`"
        ref="queue-task"
      >
        <NIcon class="icon"><QueuedIcon /></NIcon>
        <span class="text" style="display: flex; gap: 6px; align-items: center"
          >排队
          <div>
            <div style="font-size: 9px; line-height: 11px">
              预计 {{ lcs.login.loginQueueState.approximateWaitTimeSeconds }} s
            </div>
            <div style="font-size: 9px; line-height: 11px">
              位置 {{ lcs.login.loginQueueState.estimatedPositionInQueue }}
            </div>
          </div></span
        >
      </div>
    </div>
    <div class="traffic-buttons">
      <div
        v-if="wms.settings.auxWindowEnabled"
        title="小窗口"
        class="traffic-button minimize"
        @click="handleShowAuxWindow"
      >
        <NIcon><WindowNew20FilledIcon /></NIcon>
      </div>
      <div title="最小化" class="traffic-button minimize" @click="handleMinimize">
        <NIcon style="transform: rotate(90deg)"><DividerShort20RegularIcon /></NIcon>
      </div>
      <div
        :title="wmStore.mainWindowStatus === 'normal' ? '最大化' : '还原'"
        class="traffic-button maximize"
        @click="handleMaximize"
      >
        <NIcon
          ><Maximize20RegularIcon
            v-if="wmStore.mainWindowStatus === 'normal'"
          /><WindowMultiple16FilledIcon v-else />
        </NIcon>
      </div>
      <div title="关闭" class="traffic-button close" @click="handleClose">
        <NIcon><CloseOutlinedIcon /></NIcon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCompleteVisibility } from '@renderer-shared/compositions/useOverflowDetection'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useAutoGameflowStore } from '@renderer-shared/shards/auto-gameflow/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useRespawnTimerStore } from '@renderer-shared/shards/respawn-timer/store'
import { useSelfUpdateStore } from '@renderer-shared/shards/self-update/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useWindowManagerStore } from '@renderer-shared/shards/window-manager/store'
import { MainWindowCloseStrategy } from '@shared/types/modules/app'
import { Hourglass as HourglassIcon, Queued as QueuedIcon, Time as TimeIcon } from '@vicons/carbon'
import {
  WindowMultiple16Filled as WindowMultiple16FilledIcon,
  WindowNew20Filled as WindowNew20FilledIcon
} from '@vicons/fluent'
import {
  DividerShort20Regular as DividerShort20RegularIcon,
  Maximize20Regular as Maximize20RegularIcon
} from '@vicons/fluent'
import {
  CloseOutlined as CloseOutlinedIcon,
  UpgradeFilled as UpgradeFilledIcon
} from '@vicons/material'
import { useIntervalFn } from '@vueuse/core'
import { NButton, NCheckbox, NFlex, NIcon, NModal, NRadio, NRadioGroup } from 'naive-ui'
import { inject, ref, useTemplateRef, watch } from 'vue'

const wm = useInstance<WindowManagerRenderer>('window-manager-renderer')
const wmStore = useWindowManagerStore()

const as = useAppCommonStore()

const appInject = inject('app') as any

const handleShowAboutSettings = async () => {
  appInject.openSettingsModal('about')
}

const rts = useRespawnTimerStore()
const agfs = useAutoGameflowStore()
const wms = useWindowManagerStore()
const sus = useSelfUpdateStore()
const lcs = useLeagueClientStore()

const willAcceptIn = ref(0)
const { pause: pauseAC, resume: resumeAC } = useIntervalFn(
  () => {
    const s = (agfs.willAcceptAt - Date.now()) / 1e3
    willAcceptIn.value = Math.abs(Math.max(s, 0))
  },
  100,
  { immediate: false, immediateCallback: true }
)

watch(
  () => agfs.willAccept,
  (ok) => {
    if (ok) {
      resumeAC()
    } else {
      pauseAC()
    }
  },
  { immediate: true }
)

const willSearchMatchIn = ref(0)
const { pause: pauseSM, resume: resumeSM } = useIntervalFn(
  () => {
    const s = (agfs.willSearchMatchAt - Date.now()) / 1e3
    willSearchMatchIn.value = Math.abs(Math.max(s, 0))
  },
  100,
  { immediate: false, immediateCallback: true }
)

watch(
  () => agfs.willSearchMatch,
  (ok) => {
    if (ok) {
      resumeSM()
    } else {
      pauseSM()
    }
  },
  { immediate: true }
)

const handleShowAuxWindow = () => {
  wm.showAuxWindow()
}

const handleMinimize = async () => {
  await wm.minimizeMainWindow()
}

const handleMaximize = async () => {
  if (wmStore.mainWindowStatus === 'normal') {
    await wm.maximizeMainWindow()
  } else {
    await wm.unmaximizeMainWindow()
  }
}

const isCloseConfirmationModelShow = ref(false)
const closeStrategy = ref<MainWindowCloseStrategy>('minimize-to-tray')
const isRememberCloseStrategy = ref<boolean>(false)

const handleClose = async () => {
  await wm.closeMainWindow()
}

wm.onAskClose(() => {
  isCloseConfirmationModelShow.value = true
})

const handleReallyClose = async () => {
  if (isRememberCloseStrategy.value) {
    await wm.setMainWindowCloseAction(closeStrategy.value)
    await wm.closeMainWindow()
  } else {
    await wm.closeMainWindow(closeStrategy.value)
  }

  isCloseConfirmationModelShow.value = false
}

watch(
  () => isCloseConfirmationModelShow.value,
  (show) => {
    if (show) {
      if (wms.settings.mainWindowCloseAction === 'ask') {
        closeStrategy.value = 'minimize-to-tray'
      } else {
        closeStrategy.value = wms.settings.mainWindowCloseAction
      }

      isRememberCloseStrategy.value = false
    }
  }
)

const titleBarItemsContainer = useTemplateRef('title-bar-items')
const respawnTimerTaskEl = useTemplateRef('respawn-timer-task')
const autoAcceptTaskEl = useTemplateRef('auto-accept-task')
const autoSearchMatchTaskEl = useTemplateRef('auto-search-match-task')
const queueTaskEl = useTemplateRef('queue-task')
const autoUpdateTaskEl = useTemplateRef('auto-update-task')

const respawnTimerTaskShow = useCompleteVisibility(respawnTimerTaskEl, titleBarItemsContainer)
const autoAcceptTaskShow = useCompleteVisibility(autoAcceptTaskEl, titleBarItemsContainer)
const autoSearchMatchTaskShow = useCompleteVisibility(autoSearchMatchTaskEl, titleBarItemsContainer)
const queueTaskShow = useCompleteVisibility(queueTaskEl, titleBarItemsContainer)
const autoUpdateTaskShow = useCompleteVisibility(autoUpdateTaskEl, titleBarItemsContainer)
</script>

<style lang="less" scoped>
.app-title-bar {
  display: flex;
  position: relative;
  height: var(--title-bar-height);
  align-items: center;
  z-index: 100000000; // header must be on top
  -webkit-app-region: drag;
}

.blurred :is(.title, .traffic-buttons) {
  filter: brightness(0.6);
}

.hide {
  visibility: hidden;
}

.icon {
  width: 16px;
  height: 16px;
}

.title-bar-items {
  height: 100%;
  display: flex;
  flex: 1;
  gap: 4px;
  overflow: hidden;
  box-sizing: border-box;
  padding: 4px 0 4px 0;
  margin-left: 4px;

  .title-bar-item {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    flex-shrink: 0;
    border-radius: 4px;
    -webkit-app-region: no-drag;
  }

  .operation {
    transition: all 0.3s;
    cursor: pointer;
    width: 60px;

    &:hover {
      background-color: rgba(255, 255, 255, 0.162);
    }

    &:active {
      filter: brightness(0.6);
    }
  }

  .auto-update {
    width: 116px;
    background-color: rgb(74, 82, 136);
    cursor: pointer;
  }

  .respawn-timer {
    background-color: rgb(15, 71, 21);
  }

  .auto-gameflow-accept {
    background-color: rgb(15, 52, 71);
  }

  .auto-gameflow-search-match {
    background-color: rgb(67, 15, 71);
  }

  .in-login-queue {
    background-color: rgb(31, 39, 69);
  }

  .task-item {
    padding: 0 8px;
    z-index: 2;
  }

  .relative {
    position: relative;
  }

  .progress-mask {
    position: absolute;
    height: 100%;
    width: 0%;
    left: 0;
    background-color: rgba(0, 0, 0, 0.4);
    z-index: 3;
    transition: width 0.3s ease;
  }

  .title-bar-item .text {
    margin-left: 4px;
    font-size: 12px;
    line-height: 12px;
    z-index: 5;
  }

  .title-bar-item .icon {
    font-size: 16px;
    z-index: 5;
  }
}

.title-area {
  display: flex;
  height: 100%;
  justify-content: center;
  align-items: center;

  .disconnected {
    color: rgb(114, 114, 114);
  }

  .connecting {
    color: rgb(255, 255, 255);
  }
}

.title {
  vertical-align: bottom;
  text-align: center;
  transition: all 0.3s;
  font-size: 12px;
  color: rgb(189, 195, 205);
}

.traffic {
  height: 100%;
  display: flex;
  justify-content: flex-end;
  transition: all 0.3s ease;

  .traffic-button {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 45px;
    font-size: 14px;
    transition: all 0.3s;
    -webkit-app-region: no-drag;

    &:active {
      filter: brightness(0.6);
    }
  }

  .traffic-button.minimize {
    &:hover {
      background-color: rgba(255, 255, 255, 0.162);
      color: #fff;
    }
  }

  .traffic-button.maximize {
    &:hover {
      background-color: rgba(255, 255, 255, 0.162);
      color: #fff;
    }
  }

  .traffic-button.close {
    &:hover {
      background-color: rgb(194, 0, 0);
      color: #fff;
    }
  }
}

.close-confirmation-header {
  font-weight: bold;
  font-size: 16px;
}
</style>
