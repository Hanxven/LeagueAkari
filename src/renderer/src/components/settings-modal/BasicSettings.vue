<template>
  <NScrollbar style="max-height: 60vh" trigger="none">
    <NCard size="small">
      <template #header><span class="card-header-title">基础</span></template>
      <div class="control-line">
        <div class="label" title="在检测到客户端进程时，尝试自动连接">尝试自动连接</div>
        <div class="control">
          <NSwitch
            size="small"
            :value="settings.app.autoConnect"
            @update:value="(val: boolean) => setAutoConnect(val)"
          />
        </div>
      </div>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import { NCard, NScrollbar, NSwitch } from 'naive-ui'

import { setAutoConnect } from '@renderer/features/app'
import { useSettingsStore } from '@renderer/features/stores/settings'

const settings = useSettingsStore()
</script>

<style lang="less" scoped>
.card-header-title {
  font-weight: bold;
}

.control-line {
  display: flex;
  align-items: center;
  font-size: 13px;
  height: 30px;

  &:not(:last-child) {
    margin-bottom: 16px;
  }

  .label {
    width: 130px;
  }

  // .control {
  // }

  .input-number {
    width: 120px;
  }
}
</style>
