<template>
  <div class="title-bar" :class="{ blurred: aw.focusState === 'blurred' }">
    <div class="text-area">
      <div class="shortcut" v-if="!isInIndicatorView" @click="handleBackToIndicatorView">
        <NIcon class="shortcut-icon"><ArrowBackIosFilledIcon /></NIcon>
        <span class="shortcut-text">返回</span>
      </div>
      <template v-else>
        <div
          class="shortcut"
          v-for="shortcut of shortcuts"
          :key="shortcut.routeName"
          @click="() => router.replace({ name: shortcut.routeName })"
        >
          <span class="shortcut-text">{{ shortcut.label }}</span>
        </div>
      </template>
    </div>
    <div class="traffic">
      <div
        :title="aw.settings.isPinned ? `取消置顶` : `置顶`"
        class="traffic-button pin"
        :class="{ pinned: aw.settings.isPinned }"
        @click="() => handlePin(!aw.settings.isPinned)"
      >
        <NIcon><PinFilledIcon /></NIcon>
      </div>
      <div title="最小化" class="traffic-button minimize" @click="handleMinimize">
        <NIcon style="transform: rotate(90deg)"><DividerShort20RegularIcon /></NIcon>
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
import { DividerShort20Regular as DividerShort20RegularIcon } from '@vicons/fluent'
import { Close as CloseIcon } from '@vicons/ionicons5'
import { ArrowBackIosFilled as ArrowBackIosFilledIcon } from '@vicons/material'
import { NIcon } from 'naive-ui'
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const aw = useAuxiliaryWindowStore()

const handleClose = () => {
  return awm.hide()
}

const handleMinimize = () => {
  return awm.minimize()
}

const handlePin = (b: boolean) => {
  return awm.setAlwaysOnTop(b)
}

const route = useRoute()
const router = useRouter()

watchEffect(() => {
  console.log(route)
})

const shortcuts = [
  {
    label: 'OP.GG',
    routeName: 'opgg'
  }
]

const isInIndicatorView = computed(() => {
  return route.matched.some((record) => record.name === 'indicator')
})

const handleBackToIndicatorView = () => {
  router.replace({ name: 'indicator' })
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

.text-area {
  display: flex;
  align-items: center;
  height: 100%;
  flex: 1;
  transition: all 0.3s;

  .blurred & {
    filter: brightness(0.8);
  }

  .shortcut {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    width: 64px;
    height: 100%;
    background-color: rgb(41, 41, 41);
    -webkit-app-region: none;
    transition: all 0.3s;
    cursor: pointer;

    &:hover {
      background-color: rgb(86, 86, 86);
    }

    &:active {
      background-color: rgb(102, 102, 102);
    }
  }

  .shortcut-icon {
    font-size: 10px;
  }

  .shortcut-text {
    font-size: 12px;
    font-weight: bold;
  }
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

  .traffic-button.pin,
  .traffic-button.minimize {
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
