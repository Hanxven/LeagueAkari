<template>
  <div class="title-bar" :class="{ blurred: aw.focusState === 'blurred' }">
    <div style="flex: 1"></div>
    <div class="title">League Akari</div>
    <div class="traffic">
      <div
        :title="aw.isPinned ? `取消置顶` : `置顶`"
        class="traffic-button pin"
        :class="{ pinned: aw.isPinned }"
        @click="() => handlePin(!aw.isPinned)"
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
import { auxiliaryWindowRendererModule as awm } from '@shared/renderer/modules/auxiliary-window'
import { useAuxiliaryWindowStore } from '@shared/renderer/modules/auxiliary-window/store'
import { PinFilled as PinFilledIcon } from '@vicons/carbon'
import { Close as CloseIcon } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

const aw = useAuxiliaryWindowStore()

const handleClose = () => {
  return awm.hide()
}

const handlePin = (b: boolean) => {
  return awm.setAlwaysOnTop(b)
}
</script>

<style lang="less" scoped>
.title-bar {
  display: flex;
  position: relative;
  height: var(--title-bar-height);
  align-items: center;
  z-index: 10000000;
  -webkit-app-region: drag;
}

.blurred :is(.title, .traffic) {
  filter: brightness(0.8);
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
  transition: all 0.3s ease;

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
      filter: brightness(0.8);
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
@shared/renderer/modules/auxiliary-window@shared/renderer/modules/auxiliary-window/store