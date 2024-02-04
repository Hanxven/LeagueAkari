<template>
  <NScrollbar style="max-height: 60vh" trigger="none">
    <NCard size="small">
      <template #header><span class="card-header-title">基础</span></template>
      <ControlItem
        class="control-item-margin"
        label="自动检查更新"
        label-description="在应用启动时，自动从 Github 拉取最新版本信息"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="settings.app.autoCheckUpdates"
          @update:value="(val: boolean) => setAutoCheckUpdates(val)"
        />
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import { NCard, NScrollbar, NSwitch } from 'naive-ui'

import { setAutoCheckUpdates } from '@renderer/features/app'
import { useSettingsStore } from '@renderer/features/stores/settings'

import ControlItem from '../ControlItem.vue'

const settings = useSettingsStore()
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
</style>
