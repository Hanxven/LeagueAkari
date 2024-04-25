<template>
  <div class="app-title-bar" :class="{ blurred: mw.focusState === 'blurred' }">
    <div class="title-bar-items">
      <div class="title-bar-item operation" @click="emits('openSettings')" title="通用设置">
        <NIcon class="icon"><SettingsIcon /></NIcon>
        <span class="text">设置</span>
      </div>
      <div
        v-if="respawnTimer.isDead"
        class="title-bar-item task-item respawn-timer relative"
        title="距离重生时间"
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
        title="即将开启自动接受对局"
      >
        <NIcon class="icon"><TimeIcon /></NIcon>
        <span class="text">接受对局 {{ willAcceptIn.toFixed(1) }} s</span>
      </div>
      <div
        v-if="autoGameflow.willSearchMatch"
        class="title-bar-item auto-gameflow-search-match task-item relative"
        title="即将开启自动匹配"
      >
        <NIcon class="icon"><TimeIcon /></NIcon>
        <span class="text">开启匹配 {{ willSearchMatchIn.toFixed(1) }} s</span>
      </div>
      <div
        v-if="login.loginQueueState"
        class="title-bar-item in-login-queue task-item relative"
        :title="`等待排队登录中 (${login.loginQueueState.approximateWaitTimeSeconds} / ${login.loginQueueState.maxDisplayedWaitTimeSeconds} s, ${login.loginQueueState.estimatedPositionInQueue} / ${login.loginQueueState.maxDisplayedPosition})`"
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
    <div class="title">League Akari</div>
    <div class="traffic">
      <div title="最小化" class="traffic-button minimize" @click="handleMinimize">
        <NIcon><MinimizeIcon /></NIcon>
      </div>
      <div
        :title="mw.windowState === 'normal' ? '最大化' : '还原'"
        class="traffic-button maximize"
        @click="handleMaximize"
      >
        <NIcon><MaximizeIcon v-if="mw.windowState === 'normal'" /><CarbonIcon v-else /> </NIcon>
      </div>
      <div title="关闭" class="traffic-button close" @click="handleClose">
        <NIcon><CloseIcon /></NIcon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@shared/renderer/features/app/store'
import { useAutoGameflowStore } from '@shared/renderer/features/auto-gameflow/store'
import { useLoginStore } from '@shared/renderer/features/lcu-state-sync/login'
import { useRespawnTimerStore } from '@shared/renderer/features/respawn-timer/store'
import { mainCall } from '@shared/renderer/utils/ipc'
import {
  Carbon as CarbonIcon,
  Hourglass as HourglassIcon,
  Maximize as MaximizeIcon,
  Minimize as MinimizeIcon,
  Queued as QueuedIcon,
  Settings as SettingsIcon,
  Time as TimeIcon
} from '@vicons/carbon'
import { Close as CloseIcon } from '@vicons/ionicons5'
import { useIntervalFn } from '@vueuse/core'
import { NIcon } from 'naive-ui'
import { ref, watch } from 'vue'

import { useMainWindowStore } from '@main-window/features/main-window/store'

const app = useAppStore()
const mw = useMainWindowStore()
const respawnTimer = useRespawnTimerStore()
const autoGameflow = useAutoGameflowStore()
const login = useLoginStore()

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

const handleMinimize = async () => {
  await mainCall('main-window/minimize')
}

const handleMaximize = async () => {
  if (mw.windowState === 'normal') {
    await mainCall('main-window/maximize')
  } else {
    await mainCall('main-window/unmaximize')
  }
}

const handleClose = async () => {
  await mainCall('main-window/close')
}

const emits = defineEmits<{
  (e: 'openSettings'): void
}>()
</script>

<style lang="less" scoped>
.app-title-bar {
  display: flex;
  position: relative;
  height: var(--app-title-bar-height);
  align-items: center;
  background-color: rgb(24, 27, 31);
  z-index: 1000000; // header must be on top
  -webkit-app-region: drag;
}

.icon {
  width: 16px;
  height: 16px;
}

.blurred .title {
  color: rgb(107, 113, 125);
}

.title-bar-items {
  height: 100%;
  display: flex;
  flex: 1;

  .title-bar-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
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
    z-index: 5;
  }

  .title-bar-item .icon {
    font-size: 16px;
    z-index: 5;
  }
}

.title {
  font-size: 12px;
  vertical-align: bottom;
  flex: 1;
  text-align: center;
  transition: all 0.3s;
  color: rgb(189, 195, 205);
}

.traffic {
  height: 100%;
  display: flex;
  flex: 1;
  justify-content: flex-end;

  .traffic-button {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 45px;
    font-size: 12px;
    cursor: pointer;
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
</style>
