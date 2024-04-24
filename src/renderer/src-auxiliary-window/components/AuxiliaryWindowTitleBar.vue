<template>
  <div class="title-bar" :class="{ blurred: app.focusState === 'blurred' }">
    <div style="flex: 1"></div>
    <div class="title">League Akari</div>
    <div class="traffic">
      <div
        title="置顶"
        class="traffic-button pin"
        :class="{ pinned: app.isPinned }"
        @click="() => handlePin(!app.isPinned)"
      >
        <NIcon><PinFilledIcon /></NIcon>
      </div>
      <div title="关闭" class="traffic-button close" @click="handleClose">
        <NIcon><CloseIcon /></NIcon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@auxiliary-window/features/app/store'
import { mainCall } from '@shared/renderer-utils/ipc'
import { PinFilled as PinFilledIcon } from '@vicons/carbon'
import { Close as CloseIcon } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

const app = useAppStore()

const handleClose = () => {
  mainCall('auxiliary-window/hide')
}

const handlePin = (b: boolean) => {
  mainCall('auxiliary-window/set-always-on-top', b)
}
</script>

<style lang="less" scoped>
.title-bar {
  display: flex;
  position: relative;
  height: var(--app-title-bar-height);
  align-items: center;
  z-index: 1000000; // header must be on top
  -webkit-app-region: drag;
}

.blurred .title {
  color: rgb(107, 113, 125);
}

.title {
  font-size: 10px;
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

  .traffic-button.close {
    &:hover {
      background-color: rgb(194, 0, 0);
      color: #fff;
    }
  }

  .traffic-button.pin {
    &.pinned {
      background-color: rgba(102, 102, 102, 0.15);
    }

    &:hover {
      background-color: rgb(102, 102, 102);
      color: #fff;
    }
  }
}
</style>
