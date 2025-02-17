<template>
  <NScrollbar style="height: 65vh">
    <NCard size="small">
      <template #header>
        <span class="card-header-title">{{ t('OpggWindowSettings.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('OpggWindowSettings.enabled.label')"
        :label-width="400"
      >
        <template #labelDescription>
          <div>{{ t('OpggWindowSettings.enabled.description') }}</div>
          <div>
            {{ t('OpggWindowSettings.enabled.descriptionPart1') }}<OpggIcon class="inline-icon" />{{
              t('OpggWindowSettings.enabled.descriptionPart2')
            }}
          </div>
        </template>
        <NSwitch
          size="small"
          :value="ows.settings.enabled"
          @update:value="(val) => wm.opggWindow.setEnabled(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('OpggWindowSettings.autoShow.label')"
        :label-description="t('OpggWindowSettings.autoShow.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="ows.settings.autoShow"
          @update:value="(val) => wm.opggWindow.setAutoShow(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('OpggWindowSettings.opacity.label')"
        :label-description="t('OpggWindowSettings.opacity.description')"
        :label-width="400"
      >
        <NSlider
          size=""
          style="width: 120px"
          :min="0.3"
          :max="1"
          :step="0.01"
          :format-tooltip="(v) => `${(v * 100).toFixed()} %`"
          @update:value="(val) => wm.opggWindow.setOpacity(val)"
          :value="ows.settings.opacity"
        ></NSlider>
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('OpggWindowSettings.resetWindowPosition.label')"
        :label-description="t('OpggWindowSettings.resetWindowPosition.description')"
        :label-width="400"
      >
        <NButton
          size="small"
          type="warning"
          secondary
          @click="() => wm.opggWindow.resetPosition()"
          >{{ t('OpggWindowSettings.resetWindowPosition.button') }}</NButton
        >
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import OpggIcon from '@renderer-shared/assets/icon/OpggIcon.vue'
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useOpggWindowStore } from '@renderer-shared/shards/window-manager/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NScrollbar, NSlider, NSwitch } from 'naive-ui'

const { t } = useTranslation()

const ows = useOpggWindowStore()
const wm = useInstance<WindowManagerRenderer>('window-manager-renderer')
</script>

<style lang="less" scoped>
.inline-icon {
  width: 16px;
  height: 16px;
  vertical-align: middle;
}

[data-theme='dark'] {
  .inline-icon {
    color: #fff;
  }
}

[data-theme='light'] {
  .inline-icon {
    color: #000;
  }
}
</style>
