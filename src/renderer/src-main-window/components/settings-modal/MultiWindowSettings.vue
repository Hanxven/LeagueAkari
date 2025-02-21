<template>
  <NScrollbar style="height: 65vh">
    <NCard size="small">
      <template #header>
        <span class="card-header-title">{{ t('MultiWindowSettings.auxWindow.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('MultiWindowSettings.auxWindow.enabled.label')"
        :label-width="400"
      >
        <template #labelDescription>
          <div>{{ t('MultiWindowSettings.auxWindow.enabled.description') }}</div>
          <div>
            {{ t('MultiWindowSettings.auxWindow.enabled.descriptionPart1')
            }}<NIcon class="inline-icon"><Window24FilledIcon /></NIcon
            >{{ t('MultiWindowSettings.auxWindow.enabled.descriptionPart2') }}
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
        :label="t('MultiWindowSettings.auxWindow.autoShow.label')"
        :label-description="t('MultiWindowSettings.auxWindow.autoShow.description')"
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
        :label="t('MultiWindowSettings.auxWindow.opacity.label')"
        :label-description="t('MultiWindowSettings.auxWindow.opacity.description')"
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
        :label="t('MultiWindowSettings.auxWindow.showSkinSelector.label')"
        :label-description="t('MultiWindowSettings.auxWindow.showSkinSelector.description')"
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
        :label="t('MultiWindowSettings.auxWindow.resetWindowPosition.label')"
        :label-description="t('MultiWindowSettings.auxWindow.resetWindowPosition.description')"
        :label-width="400"
      >
        <NButton
          size="small"
          type="warning"
          secondary
          @click="() => wm.auxWindow.resetPosition()"
          >{{ t('MultiWindowSettings.auxWindow.resetWindowPosition.button') }}</NButton
        >
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{ t('MultiWindowSettings.opggWindow.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('MultiWindowSettings.opggWindow.enabled.label')"
        :label-width="400"
      >
        <template #labelDescription>
          <div>{{ t('MultiWindowSettings.opggWindow.enabled.description') }}</div>
          <div>
            {{ t('MultiWindowSettings.opggWindow.enabled.descriptionPart1') }}<OpggIcon class="inline-icon" />{{
              t('MultiWindowSettings.opggWindow.enabled.descriptionPart2')
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
        :label="t('MultiWindowSettings.opggWindow.autoShow.label')"
        :label-description="t('MultiWindowSettings.opggWindow.autoShow.description')"
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
        :label="t('MultiWindowSettings.opggWindow.opacity.label')"
        :label-description="t('MultiWindowSettings.opggWindow.opacity.description')"
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
        :label="t('MultiWindowSettings.opggWindow.resetWindowPosition.label')"
        :label-description="t('MultiWindowSettings.opggWindow.resetWindowPosition.description')"
        :label-width="400"
      >
        <NButton
          size="small"
          type="warning"
          secondary
          @click="() => wm.opggWindow.resetPosition()"
          >{{ t('MultiWindowSettings.opggWindow.resetWindowPosition.button') }}</NButton
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
import { useAuxWindowStore, useOpggWindowStore } from '@renderer-shared/shards/window-manager/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NScrollbar, NSlider, NSwitch } from 'naive-ui'

const { t } = useTranslation()

const aws = useAuxWindowStore()
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
