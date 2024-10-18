<template>
  <div class="common-buttons" :class="{ blurred: wms.mainWindowFocus === 'blurred' }">
    <NTooltip :z-index="TITLE_BAR_TOOLTIP_Z_INDEX">
      <template #trigger>
        <div class="common-button-outer">
          <div class="common-button-inner">
            <NIcon><NotificationIcon /></NIcon>
          </div>
        </div>
      </template>
      通知
    </NTooltip>
    <NTooltip :z-index="TITLE_BAR_TOOLTIP_Z_INDEX">
      <template #trigger>
        <div class="common-button-outer" @click="handleOpenSettingsModal">
          <div class="common-button-inner">
            <NIcon><SettingsIcon /></NIcon>
          </div>
        </div>
      </template>
      设置
    </NTooltip>
    <NTooltip :z-index="TITLE_BAR_TOOLTIP_Z_INDEX" v-if="wms.settings.auxWindowEnabled">
      <template #trigger>
        <div class="common-button-outer" @click="handleShowAuxWindow">
          <div class="common-button-inner">
            <NIcon><WindowMultiple16FilledIcon /></NIcon>
          </div>
        </div>
      </template>
      小窗口
    </NTooltip>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useWindowManagerStore } from '@renderer-shared/shards/window-manager/store'
import { Notification as NotificationIcon, Settings as SettingsIcon } from '@vicons/carbon'
import { WindowMultiple16Filled as WindowMultiple16FilledIcon } from '@vicons/fluent'
import { NIcon, NTooltip } from 'naive-ui'
import { inject } from 'vue'

const wms = useWindowManagerStore()
const wm = useInstance<WindowManagerRenderer>('window-manager-renderer')

const { openSettingsModal } = inject('app') as any

const TITLE_BAR_TOOLTIP_Z_INDEX = 75000

const handleShowAuxWindow = () => {
  wm.showAuxWindow()
}

const handleOpenSettingsModal = () => {
  openSettingsModal()
}
</script>

<style lang="less" scoped>
.common-buttons {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-around;

  &.blurred {
    filter: brightness(0.8);
  }

  .common-button-outer {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 100%;
    cursor: pointer;
    -webkit-app-region: no-drag;
  }

  .common-button-outer:hover .common-button-inner {
    background-color: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 1);
  }

  .common-button-outer:active .common-button-inner {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .common-button-inner {
    padding: 4px;
    border-radius: 2px;
    transition:
      background-color 0.3s,
      color 0.3s;
    color: rgba(255, 255, 255, 0.86);
    font-size: 16px;

    i {
      display: block;
    }
  }
}
</style>
