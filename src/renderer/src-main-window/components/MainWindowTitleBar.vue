<template>
  <div class="app-title-bar" :class="{ blurred: mw.focusState === 'blurred' }">
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
        v-if="au.updateProgressInfo"
        class="title-bar-item task-item auto-update relative"
        :class="{ hide: !autoUpdateTaskShow }"
        :title="
          au.updateProgressInfo.phase === 'waiting-for-restart'
            ? '在程序关闭后执行更新流程'
            : '正在准备更新中'
        "
        @click="() => handleShowAboutSettings()"
        ref="auto-update-task"
      >
        <template v-if="au.updateProgressInfo.phase === 'downloading'">
          <div
            class="progress-mask"
            :style="{ width: `${au.updateProgressInfo.downloadingProgress * 100}%` }"
          ></div>
          <NIcon class="icon"><UpgradeFilledIcon /></NIcon>
          <span class="text"
            >下载更新 {{ (au.updateProgressInfo.downloadingProgress * 100).toFixed() }} %
          </span>
        </template>
        <template v-else-if="au.updateProgressInfo.phase === 'unpacking'">
          <div
            class="progress-mask"
            :style="{ width: `${au.updateProgressInfo.unpackingProgress * 100}%` }"
          ></div>
          <NIcon class="icon"><UpgradeFilledIcon /></NIcon>
          <span class="text"
            >正在解压 {{ (au.updateProgressInfo.unpackingProgress * 100).toFixed() }} %</span
          >
        </template>
        <template v-else-if="au.updateProgressInfo.phase === 'waiting-for-restart'">
          <NIcon class="icon"><UpgradeFilledIcon /></NIcon>
          <span class="text">关闭后更新</span>
        </template>
      </div>
      <div
        v-if="respawnTimer.isDead"
        class="title-bar-item task-item respawn-timer relative"
        :class="{ hide: !respawnTimerTaskShow }"
        title="距离重生时间"
        ref="respawn-timer-task"
      >
        <div
          class="progress-mask"
          :style="{ width: `${100 - (respawnTimer.timeLeft / respawnTimer.totalTime) * 100}%` }"
        ></div>
        <NIcon class="icon"><HourglassIcon /></NIcon>
        <span class="text">距离重生 {{ respawnTimer.timeLeft.toFixed() }} s</span>
      </div>
      <div
        v-if="autoGameflow.willAccept"
        class="title-bar-item auto-gameflow-accept task-item relative"
        :class="{ hide: !autoAcceptTaskShow }"
        title="即将开启自动接受对局"
        ref="auto-accept-task"
      >
        <NIcon class="icon"><TimeIcon /></NIcon>
        <span class="text">接受对局 {{ willAcceptIn.toFixed(1) }} s</span>
      </div>
      <div
        v-if="autoGameflow.willSearchMatch"
        class="title-bar-item auto-gameflow-search-match task-item relative"
        :class="{ hide: !autoSearchMatchTaskShow }"
        title="即将开启自动匹配"
        ref="auto-search-match-task"
      >
        <NIcon class="icon"><TimeIcon /></NIcon>
        <span class="text">开启匹配 {{ willSearchMatchIn.toFixed(1) }} s</span>
      </div>
      <div
        v-if="login.loginQueueState"
        class="title-bar-item in-login-queue task-item relative"
        :class="{ hide: !queueTaskShow }"
        :title="`等待排队登录中 (${login.loginQueueState.approximateWaitTimeSeconds} / ${login.loginQueueState.maxDisplayedWaitTimeSeconds} s, ${login.loginQueueState.estimatedPositionInQueue} / ${login.loginQueueState.maxDisplayedPosition})`"
        ref="queue-task"
      >
        <NIcon class="icon"><QueuedIcon /></NIcon>
        <span class="text" style="display: flex; gap: 6px; align-items: center"
          >排队
          <div>
            <div style="font-size: 9px; line-height: 11px">
              预计 {{ login.loginQueueState.approximateWaitTimeSeconds }} s
            </div>
            <div style="font-size: 9px; line-height: 11px">
              位置 {{ login.loginQueueState.estimatedPositionInQueue }}
            </div>
          </div></span
        >
      </div>
    </div>
    <div class="traffic">
      <div
        v-if="aux.settings.enabled"
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
        :title="mw.windowState === 'normal' ? '最大化' : '还原'"
        class="traffic-button maximize"
        @click="handleMaximize"
      >
        <NIcon
          ><Maximize20RegularIcon v-if="mw.windowState === 'normal'" /><WindowMultiple16FilledIcon
            v-else
          />
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
import { appRendererModule as am } from '@renderer-shared/modules/app'
import { useAppStore } from '@renderer-shared/modules/app/store'
import { useAutoGameflowStore } from '@renderer-shared/modules/auto-gameflow/store'
import { useAutoUpdateStore } from '@renderer-shared/modules/auto-update/store'
import { auxiliaryWindowRendererModule as awm } from '@renderer-shared/modules/auxiliary-window'
import { useAuxiliaryWindowStore } from '@renderer-shared/modules/auxiliary-window/store'
import { useLoginStore } from '@renderer-shared/modules/lcu-state-sync/login'
import { mainWindowRendererModule as mwm } from '@renderer-shared/modules/main-window'
import { useMainWindowStore } from '@renderer-shared/modules/main-window/store'
import { useRespawnTimerStore } from '@renderer-shared/modules/respawn-timer/store'
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

const app = useAppStore()

const appInject = inject('app') as any

const handleShowAboutSettings = async () => {
  appInject.openSettingsModal('about')
}

const mw = useMainWindowStore()
const respawnTimer = useRespawnTimerStore()
const autoGameflow = useAutoGameflowStore()
const login = useLoginStore()
const aux = useAuxiliaryWindowStore()
const au = useAutoUpdateStore()

const willAcceptIn = ref(0)
const { pause: pauseAC, resume: resumeAC } = useIntervalFn(
  () => {
    const s = (autoGameflow.willAcceptAt - Date.now()) / 1e3
    willAcceptIn.value = Math.abs(Math.max(s, 0))
  },
  100,
  { immediate: false, immediateCallback: true }
)

watch(
  () => autoGameflow.willAccept,
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
    const s = (autoGameflow.willSearchMatchAt - Date.now()) / 1e3
    willSearchMatchIn.value = Math.abs(Math.max(s, 0))
  },
  100,
  { immediate: false, immediateCallback: true }
)

watch(
  () => autoGameflow.willSearchMatch,
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
  awm.show()
}

const handleMinimize = async () => {
  await mwm.minimize()
}

const handleMaximize = async () => {
  if (mw.windowState === 'normal') {
    await mwm.maximize()
  } else {
    await mwm.unmaximize()
  }
}

const isCloseConfirmationModelShow = ref(false)
const closeStrategy = ref<MainWindowCloseStrategy>('minimize-to-tray')
const isRememberCloseStrategy = ref<boolean>(false)

const handleClose = async () => {
  await mwm.close()
}

mwm.onAskClose(() => {
  isCloseConfirmationModelShow.value = true
})

const handleReallyClose = async () => {
  if (isRememberCloseStrategy.value) {
    await am.setCloseStrategy(closeStrategy.value)
    await mwm.close()
  } else {
    await mwm.close(closeStrategy.value)
  }

  isCloseConfirmationModelShow.value = false
}

watch(
  () => isCloseConfirmationModelShow.value,
  (show) => {
    if (show) {
      if (app.settings.closeStrategy === 'unset') {
        closeStrategy.value = 'minimize-to-tray'
      } else {
        closeStrategy.value = app.settings.closeStrategy
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

.blurred :is(.title, .traffic) {
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
