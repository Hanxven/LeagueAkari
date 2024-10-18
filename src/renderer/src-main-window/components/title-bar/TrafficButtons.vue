<template>
  <div class="traffic-buttons" :class="{ blurred: wms.mainWindowFocus === 'blurred' }">
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
    <div title="最小化" class="traffic-button minimize" @click="handleMinimize">
      <NIcon style="transform: rotate(90deg)"><DividerShort20RegularIcon /></NIcon>
    </div>
    <div
      :title="wms.mainWindowStatus === 'normal' ? '最大化' : '还原'"
      class="traffic-button maximize"
      @click="handleMaximize"
    >
      <NIcon
        ><Maximize20RegularIcon
          v-if="wms.mainWindowStatus === 'normal'"
        /><WindowMultiple16FilledIcon v-else />
      </NIcon>
    </div>
    <div title="关闭" class="traffic-button close" @click="handleClose">
      <NIcon><CloseOutlinedIcon /></NIcon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useWindowManagerStore } from '@renderer-shared/shards/window-manager/store'
import { MainWindowCloseStrategy } from '@shared/types/modules/app'
import { WindowMultiple16Filled as WindowMultiple16FilledIcon } from '@vicons/fluent'
import {
  DividerShort20Regular as DividerShort20RegularIcon,
  Maximize20Regular as Maximize20RegularIcon
} from '@vicons/fluent'
import { CloseOutlined as CloseOutlinedIcon } from '@vicons/material'
import { NButton, NCheckbox, NFlex, NIcon, NModal, NRadio, NRadioGroup } from 'naive-ui'
import { ref } from 'vue'

// 交通灯按钮
const wms = useWindowManagerStore()
const wm = useInstance<WindowManagerRenderer>('window-manager-renderer')

const handleMinimize = async () => {
  await wm.minimizeMainWindow()
}

const handleMaximize = async () => {
  if (wms.mainWindowStatus === 'normal') {
    await wm.maximizeMainWindow()
  } else {
    await wm.unmaximizeMainWindow()
  }
}

const isCloseConfirmationModelShow = ref(false)
const closeStrategy = ref<MainWindowCloseStrategy>('minimize-to-tray')
const isRememberCloseStrategy = ref<boolean>(false)

const handleClose = async () => {
  await wm.closeMainWindow()
}

wm.onAskClose(() => {
  isCloseConfirmationModelShow.value = true
})

const handleReallyClose = async () => {
  if (isRememberCloseStrategy.value) {
    await wm.setMainWindowCloseAction(closeStrategy.value)
    await wm.closeMainWindow()
  } else {
    await wm.closeMainWindow(closeStrategy.value)
  }

  isCloseConfirmationModelShow.value = false
}
</script>

<style lang="less" scoped>
.traffic-buttons {
  height: 100%;
  display: flex;

  &.blurred {
    filter: brightness(0.8);
  }

  .traffic-button {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 48px;
    font-size: 14px;
    transition: all 0.3s;
    -webkit-app-region: no-drag;

    &:active {
      filter: brightness(0.85);
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
