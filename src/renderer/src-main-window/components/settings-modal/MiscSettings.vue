<template>
  <NScrollbar style="max-height: 65vh" trigger="none">
    <NCard size="small">
      <template #header><span class="card-header-title">重生倒计时</span></template>
      <ControlItem
        class="control-item-margin"
        label="启用"
        label-description="在标题栏展示一个距离重生剩余时间的指示器"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="rts.settings.enabled"
          @update:value="(val) => rt.setEnabled(val)"
        />
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { RespawnTimerRenderer } from '@renderer-shared/shards/respawn-timer'
import { useRespawnTimerStore } from '@renderer-shared/shards/respawn-timer/store'
import { NCard, NScrollbar, NSwitch } from 'naive-ui'

const rts = useRespawnTimerStore()
const rt = useInstance<RespawnTimerRenderer>('respawn-timer-renderer')
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
</style>
