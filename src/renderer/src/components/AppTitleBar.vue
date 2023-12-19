<template>
  <div class="app-title-bar" :class="{ blurred: appState.focusState === 'blurred' }">
    <div class="operations">
      <div class="operation" @click="emits('openSettings')" title="通用设置">
        <NIcon class="icon"><SettingsIcon /></NIcon>
        <span class="text">设置</span>
      </div>
    </div>
    <div class="title">
      {{ title }}
    </div>
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
  Maximize as MaximizeIcon,
  Minimize as MinimizeIcon,
  Settings as SettingsIcon
} from '@vicons/carbon'
import { Close as CloseIcon } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

import { useTitle } from '@renderer/compositions/useTitle'
import { useAppState } from '@renderer/features/stores/app'
import { call } from '@renderer/ipc'

const appState = useAppState()
const title = useTitle()

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

.blurred {
  color: rgb(168, 168, 168);
}

.operations {
  height: 100%;
  display: flex;
  flex: 1;

  .operation {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 60px;
    cursor: pointer;
    -webkit-app-region: no-drag;
    transition: all 0.3s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.162);
    }

    &:active {
      filter: brightness(0.6);
    }
  }

  .operation .text {
    margin-left: 4px;
    font-size: 12px;
  }

  .operation .icon {
    font-size: 16px;
  }
}

.title {
  font-size: 12px;
  vertical-align: bottom;
  flex: 1;
  text-align: center;
  transition: all 0.3s;
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
    }
  }

  .traffic-button.maximize {
    &:hover {
      background-color: rgba(255, 255, 255, 0.162);
    }
  }

  .traffic-button.close {
    &:hover {
      background-color: rgb(194, 0, 0);
    }
  }
}
</style>
