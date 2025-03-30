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
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import {
  MainWindowCloseAction,
  useMainWindowStore
} from '@renderer-shared/shards/window-manager/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NCheckbox, NFlex, NModal, NRadio, NRadioGroup } from 'naive-ui'
import { ref, watch } from 'vue'

const { t } = useTranslation()

// 交通灯按钮
const mws = useMainWindowStore()
const wm = useInstance(WindowManagerRenderer)

const isCloseConfirmationModelShow = ref(false)
const closeStrategy = ref<MainWindowCloseAction>('minimize-to-tray')
const isRememberCloseStrategy = ref<boolean>(false)

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
  --zoom-factor: 1; // 目前逻辑上锁定恒定为 1

  height: 100%;
  display: flex;
  z-index: 10000000;
  min-width: calc(138px / var(--zoom-factor, 1));

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
}

[data-theme='dark'] {
  .traffic-buttons {
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
