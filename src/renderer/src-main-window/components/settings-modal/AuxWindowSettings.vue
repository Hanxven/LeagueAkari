<template>
  <NScrollbar style="height: 65vh">
    <NCard size="small">
      <template #header>
        <span class="card-header-title">{{ t('AuxWindowSettings.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('AuxWindowSettings.enabled.label')"
        :label-width="400"
      >
        <template #labelDescription>
          <div>{{ t('AuxWindowSettings.enabled.description') }}</div>
          <div>
            {{ t('AuxWindowSettings.enabled.descriptionPart1')
            }}<NIcon class="inline-icon"><Window24FilledIcon /></NIcon
            >{{ t('AuxWindowSettings.enabled.descriptionPart2') }}
          </div>
        </template>
        <NSwitch
          size="small"
          :value="aws.settings.enabled"
          @update:value="(val) => wm.auxWindow.setEnabled(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('AuxWindowSettings.autoShow.label')"
        :label-description="t('AuxWindowSettings.autoShow.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="aws.settings.autoShow"
          @update:value="(val) => wm.auxWindow.setAutoShow(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('AuxWindowSettings.opacity.label')"
        :label-description="t('AuxWindowSettings.opacity.description')"
        :label-width="400"
      >
        <NSlider
          size=""
          style="width: 120px"
          :min="0.3"
          :max="1"
          :step="0.01"
          :format-tooltip="(v) => `${(v * 100).toFixed()} %`"
          @update:value="(val) => wm.auxWindow.setOpacity(val)"
          :value="aws.settings.opacity"
        ></NSlider>
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('AuxWindowSettings.showSkinSelector.label')"
        :label-description="t('AuxWindowSettings.showSkinSelector.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="aws.settings.showSkinSelector"
          @update:value="(val) => wm.auxWindow.setShowSkinSelector(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('AuxWindowSettings.resetWindowPosition.label')"
        :label-description="t('AuxWindowSettings.resetWindowPosition.description')"
        :label-width="400"
      >
        <NButton
          size="small"
          type="warning"
          secondary
          @click="() => wm.auxWindow.resetPosition()"
          >{{ t('AuxWindowSettings.resetWindowPosition.button') }}</NButton
        >
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useAuxWindowStore } from '@renderer-shared/shards/window-manager/store'
import { Window24Filled as Window24FilledIcon } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NIcon, NScrollbar, NSlider, NSwitch } from 'naive-ui'

const { t } = useTranslation()

const aws = useAuxWindowStore()
const wm = useInstance<WindowManagerRenderer>('window-manager-renderer')
</script>

<style lang="less" scoped>
.control-item-margin {
  &:not(:last-child) {
    margin-bottom: 12px;
  }
}

.card-header-title.disabled {
  color: rgba(255, 255, 255, 0.35);
}

.inline-icon {
  font-size: 16px;
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
