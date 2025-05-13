<template>
  <div class="traffic-buttons" :class="{ blurred: mws.focus === 'blurred' }">
    <NModal
      style="width: 300px"
      transform-origin="center"
      preset="card"
      v-model:show="isCloseConfirmationModelShow"
      :z-index="10000000"
    >
      <template #header>
        <span class="close-confirmation-header">{{ t('TrafficButtons.modal.title') }}</span>
      </template>
      <NRadioGroup v-model:value="closeStrategy" size="small">
        <NFlex vertical>
          <NRadio value="minimize-to-tray">{{
            t('TrafficButtons.modal.options.minimize-to-tray')
          }}</NRadio>
          <NRadio value="quit">{{ t('TrafficButtons.modal.options.quit') }}</NRadio>
        </NFlex>
      </NRadioGroup>
      <NFlex align="center" justify="space-between" style="margin-top: 12px">
        <NCheckbox
          v-model:checked="isRememberCloseStrategy"
          style="margin-right: auto"
          size="small"
        >
          {{ t('TrafficButtons.modal.remember') }}
        </NCheckbox>
        <NFlex style="gap: 4px">
          <NButton
            style="font-size: 13px"
            size="small"
            @click="isCloseConfirmationModelShow = false"
          >
            {{ t('TrafficButtons.modal.cancel') }}
          </NButton>
          <NButton style="font-size: 13px" size="small" type="primary" @click="handleReallyClose">
            {{ t('TrafficButtons.modal.ok') }}
          </NButton>
        </NFlex>
      </NFlex>
    </NModal>
    <!-- 目前仍存在的绝赞 bug，最小化的时候无法清除 hover 状态 -->
    <!-- 其他 electron 应用中多少也发现了类似的情况 -->
    <div
      :title="t('TrafficButtons.minimize')"
      class="traffic-button minimize"
      @click="handleMinimize"
    >
      <NIcon style="transform: rotate(90deg)"><DividerShort20RegularIcon /></NIcon>
    </div>
    <div
      :title="mws.status === 'normal' ? t('TrafficButtons.maximize') : t('TrafficButtons.restore')"
      class="traffic-button maximize"
      @click="handleMaximize"
    >
      <NIcon>
        <Maximize24FilledIcon v-if="mws.status === 'normal'" />
        <WindowMultiple16FilledIcon v-else />
      </NIcon>
    </div>
    <div :title="t('TrafficButtons.close')" class="traffic-button close" @click="handleClose">
      <NIcon><CloseOutlinedIcon /></NIcon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import {
  MainWindowCloseAction,
  useMainWindowStore
} from '@renderer-shared/shards/window-manager/store'
import { WindowMultiple16Filled as WindowMultiple16FilledIcon } from '@vicons/fluent'
import { DividerShort20Regular as DividerShort20RegularIcon } from '@vicons/fluent'
import { Maximize24Filled as Maximize24FilledIcon } from '@vicons/fluent'
import { CloseOutlined as CloseOutlinedIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NButton, NCheckbox, NFlex, NIcon, NModal, NRadio, NRadioGroup } from 'naive-ui'
import { ref, watch } from 'vue'

const { t } = useTranslation()

// 交通灯按钮
const mws = useMainWindowStore()
const wm = useInstance(WindowManagerRenderer)

const handleMinimize = async () => {
  await wm.mainWindow.minimize()
}

const handleMaximize = async () => {
  if (mws.status === 'normal') {
    await wm.mainWindow.maximize()
  } else {
    await wm.mainWindow.unmaximize()
  }
}

const isCloseConfirmationModelShow = ref(false)
const closeStrategy = ref<MainWindowCloseAction>('minimize-to-tray')
const isRememberCloseStrategy = ref<boolean>(false)

const handleClose = async () => {
  await wm.mainWindow.close()
}

wm.mainWindow.onAskClose(() => {
  isCloseConfirmationModelShow.value = true
})

const handleReallyClose = async () => {
  if (isRememberCloseStrategy.value) {
    await wm.mainWindow.setCloseAction(closeStrategy.value)
    await wm.mainWindow.close()
  } else {
    await wm.mainWindow.close(closeStrategy.value)
  }

  isCloseConfirmationModelShow.value = false
}

watch(
  () => isCloseConfirmationModelShow.value,
  (show) => {
    if (show) {
      closeStrategy.value = 'minimize-to-tray'
      isRememberCloseStrategy.value = false
    }
  }
)
</script>

<style lang="less" scoped>
.traffic-buttons {
  height: 100%;
  display: flex;
  z-index: 10000000;
  -webkit-app-region: no-drag;

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

    // special case for close button
    &.close {
      font-size: 16px;
    }

    &:active {
      filter: brightness(0.85);
    }
  }
}

[data-theme='dark'] {
  .traffic-buttons {
    .traffic-button.minimize {
      &:hover {
        background-color: #fff3;
        color: #fff;
      }
    }

    .traffic-button.maximize {
      &:hover {
        background-color: #fff3;
        color: #fff;
      }
    }

    .traffic-button.close {
      &:hover {
        background-color: #e81123;
        color: #fff;
      }
    }
  }
}

[data-theme='light'] {
  .traffic-buttons {
    .traffic-button.minimize {
      &:hover {
        background-color: rgba(0, 0, 0, 0.162);
        color: #000;
      }
    }

    .traffic-button.maximize {
      &:hover {
        background-color: rgba(0, 0, 0, 0.162);
        color: #000;
      }
    }

    .traffic-button.close {
      &:hover {
        background-color: rgb(194, 0, 0);
        color: #fff;
      }
    }
  }
}
</style>
