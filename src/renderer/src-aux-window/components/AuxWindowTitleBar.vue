<template>
  <div class="title-bar" :class="{ blurred: wms.auxWindowFocus === 'blurred' }">
    <div class="text-area">
      <div
        :title="t('AuxWindowTitleBar.indicatorTitle')"
        class="shortcut"
        v-if="!isInIndicatorView"
        @click="handleBackToIndicatorView"
      >
        <NIcon class="shortcut-icon"><ArrowBackIosFilledIcon /></NIcon>
        <span class="shortcut-text">{{ t('AuxWindowTitleBar.indicator') }}</span>
      </div>
      <template v-else>
        <div
          class="shortcut"
          v-for="shortcut of shortcuts"
          :key="shortcut.label"
          :title="shortcut.description"
          @click="() => shortcut.toggle()"
        >
          <span class="shortcut-text">{{ shortcut.label }}</span>
        </div>
      </template>
    </div>
    <div class="traffic">
      <div
        :title="
          wms.settings.auxWindowPinned ? t('AuxWindowTitleBar.unpin') : t('AuxWindowTitleBar.pin')
        "
        class="traffic-button pin"
        :class="{ pinned: wms.settings.auxWindowPinned }"
        @click="() => handlePin(!wms.settings.auxWindowPinned)"
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
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useWindowManagerStore } from '@renderer-shared/shards/window-manager/store'
import { PinFilled as PinFilledIcon } from '@vicons/carbon'
import { DividerShort20Regular as DividerShort20RegularIcon } from '@vicons/fluent'
import { Close as CloseIcon } from '@vicons/ionicons5'
import { ArrowBackIosFilled as ArrowBackIosFilledIcon } from '@vicons/material'
import { NIcon } from 'naive-ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()

const wms = useWindowManagerStore()
const wm = useInstance<WindowManagerRenderer>('window-manager-renderer')

const handleClose = () => {
  return wm.hideAuxWindow()
}

const handleMinimize = () => {
  return wm.minimizeAuxWindow()
}

const handlePin = (b: boolean) => {
  return wm.setAuxWindowPinned(b)
}

const route = useRoute()

const shortcuts = computed(() => {
  return [
    {
      label: t('AuxWindowTitleBar.opgg'),
      description: t('AuxWindowTitleBar.opggTitle'),
      toggle: () => {
        wm.setAuxWindowFunctionality('opgg')
      }
    }
  ]
})

const isInIndicatorView = computed(() => {
  return route.matched.some((record) => record.name === 'indicator')
})

const handleBackToIndicatorView = () => {
  wm.setAuxWindowFunctionality('indicator')
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
  padding: 4px 4px 2px 8px;
  box-sizing: border-box;

  .blurred & {
    filter: brightness(0.8);
  }

  .shortcut {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 76px;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.08);
    -webkit-app-region: none;
    transition: all 0.3s;
    cursor: pointer;
    border-radius: 4px;

    &:hover {
      background-color: rgba(255, 255, 255, 0.15);
    }

    &:active {
      background-color: rgba(255, 255, 255, 0.09);
    }
  }

  .shortcut-icon {
    font-size: 10px;
  }

  .shortcut-text {
    line-height: 12px;
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
