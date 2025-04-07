<template>
  <div class="title-bar" :class="{ blurred: ws.focus === 'blurred' }">
    <div class="title-area">
      <span class="title">League Akari - OP.GG</span>
    </div>
    <div class="traffic">
      <div
        :title="t('OpggWindowTitleBar.repositionToAlignLeagueClientUx')"
        class="traffic-button align"
        @click="handleRepositionToAlignLeagueClientUx"
      >
        <NIcon><ArrowBarToRightIcon /></NIcon>
      </div>
      <div
        :title="ws.settings.pinned ? t('OpggWindowTitleBar.unpin') : t('OpggWindowTitleBar.pin')"
        class="traffic-button pin"
        :class="{ pinned: ws.settings.pinned }"
        @click="() => handlePin(!ws.settings.pinned)"
      >
        <NIcon><PinFilledIcon /></NIcon>
      </div>
      <div
        :title="t('OpggWindowTitleBar.minimize')"
        class="traffic-button minimize"
        @click="handleMinimize"
      >
        <NIcon style="transform: rotate(90deg)"><DividerShort20RegularIcon /></NIcon>
      </div>
      <div :title="t('OpggWindowTitleBar.close')" class="traffic-button close" @click="handleClose">
        <NIcon><CloseIcon /></NIcon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useOpggWindowStore } from '@renderer-shared/shards/window-manager/store'
import { PinFilled as PinFilledIcon } from '@vicons/carbon'
import { DividerShort20Regular as DividerShort20RegularIcon } from '@vicons/fluent'
import { Close as CloseIcon } from '@vicons/ionicons5'
import { ArrowBarToRight as ArrowBarToRightIcon } from '@vicons/tabler'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'

const { t } = useTranslation()

const wm = useInstance(WindowManagerRenderer)
const ws = useOpggWindowStore()

const handleClose = () => {
  return wm.opggWindow.hide()
}

const handleMinimize = () => {
  return wm.opggWindow.minimize()
}

const handlePin = (b: boolean) => {
  return wm.opggWindow.setPinned(b)
}

const handleRepositionToAlignLeagueClientUx = () => {
  wm.opggWindow.repositionToAlignLeagueClientUx()
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

.title-area {
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

  .title {
    font-size: 12px;
    color: #fffd;
  }
}

.blurred :is(.title, .traffic) {
  filter: brightness(0.8);
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

  .traffic-button.align,
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
