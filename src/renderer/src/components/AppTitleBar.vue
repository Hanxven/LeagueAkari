<template>
  <div class="app-title-bar" :class="{ blurred: appState.focusState === 'blurred' }">
    <div class="title-bar-items">
      <div class="title-bar-item operation" @click="emits('openSettings')" title="通用设置">
        <NIcon class="icon"><SettingsIcon /></NIcon>
        <span class="text">设置</span>
      </div>
      <div v-if="respawnTimer.isDead" class="title-bar-item display relative" title="距离重生时间">
        <div
          class="progress-mask"
          :style="{ width: `${100 - (respawnTimer.timeLeft / respawnTimer.totalTime) * 100}%` }"
        ></div>
        <NIcon class="icon"><HourglassIcon /></NIcon>
        <span class="text">距离重生 {{ respawnTimer.timeLeft.toFixed() }} s</span>
      </div>
    </div>
    <div class="title">League Akari</div>
    <div class="traffic">
      <div title="最小化" class="traffic-button minimize" @click="handleMinimize">
        <NIcon><MinimizeIcon /></NIcon>
      </div>
      <div
        :title="appState.windowState === 'normal' ? '最大化' : '还原'"
        class="traffic-button maximize"
        @click="handleMaximize"
      >
        <NIcon
          ><MaximizeIcon v-if="appState.windowState === 'normal'" /><CarbonIcon v-else />
        </NIcon>
      </div>
      <div title="关闭" class="traffic-button close" @click="handleClose">
        <NIcon><CloseIcon /></NIcon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Carbon as CarbonIcon,
  Hourglass as HourglassIcon,
  Maximize as MaximizeIcon,
  Minimize as MinimizeIcon,
  Settings as SettingsIcon
} from '@vicons/carbon'
import { Close as CloseIcon } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

import { useAppState } from '@renderer/features/stores/app'
import { useRespawnTimerStore } from '@renderer/features/stores/respawn-timer'
import { call } from '@renderer/ipc'

const appState = useAppState()
const respawnTimer = useRespawnTimerStore()

const handleMinimize = async () => {
  await call('minimize')
}

const handleMaximize = async () => {
  if (appState.windowState === 'normal') {
    await call('maximize')
  } else {
    await call('unmaximize')
  }
}

const handleClose = async () => {
  await call('close')
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

  .display {
    padding: 0 8px;
    background-color: rgb(15, 71, 21);
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
  color: rgb(157, 165, 180);
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
