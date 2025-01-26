<template>
  <NScrollbar style="height: 65vh">
    <NCard size="small">
      <template #header>
        <span class="card-header-title">{{ t('AuxWindowSettings.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('AuxWindowSettings.auxWindowEnabled.label')"
        :label-width="320"
      >
        <template #labelDescription>
          <div>{{ t('AuxWindowSettings.auxWindowEnabled.description') }}</div>
          <div>
            {{ t('AuxWindowSettings.auxWindowEnabled.descriptionPart1')
            }}<NIcon class="inline-icon"><Window24FilledIcon /></NIcon
            >{{ t('AuxWindowSettings.auxWindowEnabled.descriptionPart2') }}
          </div>
        </template>
        <NSwitch
          size="small"
          :value="wms.settings.auxWindowEnabled"
          @update:value="(val) => wm.setAuxWindowEnabled(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('AuxWindowSettings.auxWindowAutoShow.label')"
        :label-description="t('AuxWindowSettings.auxWindowAutoShow.description')"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="wms.settings.auxWindowAutoShow"
          @update:value="(val) => wm.setAuxWindowAutoShow(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('AuxWindowSettings.auxWindowOpacity.label')"
        :label-description="t('AuxWindowSettings.auxWindowOpacity.description')"
        :label-width="320"
      >
        <NSlider
          size=""
          style="width: 120px"
          :min="0.3"
          :max="1"
          :step="0.01"
          :format-tooltip="(v) => `${(v * 100).toFixed()} %`"
          @update:value="(val) => wm.setAuxWindowOpacity(val)"
          :value="wms.settings.auxWindowOpacity"
        ></NSlider>
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('AuxWindowSettings.auxWindowShowSkinSelector.label')"
        :label-description="t('AuxWindowSettings.auxWindowShowSkinSelector.description')"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="wms.settings.auxWindowShowSkinSelector"
          @update:value="(val) => wm.setAuxWindowShowSkinSelector(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('AuxWindowSettings.resetAuxWindowPosition.label')"
        :label-description="t('AuxWindowSettings.resetAuxWindowPosition.description')"
        :label-width="320"
      >
        <NButton size="small" type="warning" secondary @click="() => wm.resetAuxWindowPosition()">{{
          t('AuxWindowSettings.resetAuxWindowPosition.button')
        }}</NButton>
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useWindowManagerStore } from '@renderer-shared/shards/window-manager/store'
import { Window24Filled as Window24FilledIcon } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NIcon, NScrollbar, NSlider, NSwitch } from 'naive-ui'

const { t } = useTranslation()

const wms = useWindowManagerStore()
const wm = useInstance<WindowManagerRenderer>('window-manager-renderer')
</script>

<style lang="less" scoped>
.control-item-margin {
  &:not(:last-child) {
    margin-bottom: 12px;
  }
}

.card-header-title {
  font-weight: bold;
  font-size: 18px;
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
