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
          :value="app.settings.autoCheckUpdates"
          @update:value="(val: boolean) => setAutoCheckUpdates(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="自动连接"
        label-description="存在唯一的客户端时，则自动连接该客户端"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="app.settings.autoConnect"
          @update:value="(val: boolean) => setAutoConnect(val)"
        />
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import { setAutoCheckUpdates, setAutoConnect } from '@shared/renderer/features/app'
import { useAppStore } from '@shared/renderer/features/app/store'
import { NCard, NScrollbar, NSwitch } from 'naive-ui'

const app = useAppStore()
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
