<template>
  <NCard size="small">
    <template #header><span class="card-header-title">自动接受对局</span></template>
    <ControlItem class="control-item-margin" label="开启">
      <div style="display: flex; align-items: center; gap: 8px">
        <NSwitch
          :value="autoAccept.settings.enabled"
          @update:value="handleSetAutoAccept"
          size="small"
        />
        <NButton v-if="autoAccept.willAutoAccept" @click="cancelAutoAccept" size="tiny"
          >取消本次自动接受 ({{ (remainingTime / 1e3).toFixed(2) }}s)</NButton
        >
      </div>
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="延时 (s)"
      label-description="在可接受时延迟执行接受操作的时间。单位为秒，可以设置非整数的值"
    >
      <NInputNumber
        style="width: 80px"
        :value="autoAccept.settings.delaySeconds"
        @update:value="(value) => setDelaySeconds(value || 0)"
        placeholder="秒"
        :min="0"
        :max="10"
        size="tiny"
      />
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { NButton, NCard, NInputNumber, NSwitch } from 'naive-ui'
import { ref, watch } from 'vue'

import ControlItem from '@renderer/components/ControlItem.vue'
import {
  cancelAutoAccept,
  setDelaySeconds,
  setEnableAutoAccept
} from '@renderer/features/auto-accept'
import { useAutoAcceptStore } from '@renderer/features/auto-accept/store'

const autoAccept = useAutoAcceptStore()

const remainingTime = ref(0)
const { pause, resume } = useIntervalFn(
  () => {
    // ms
    remainingTime.value = Math.max(autoAccept.willAutoAcceptAt - Date.now(), 0)
  },
  100,
  { immediate: false, immediateCallback: true }
)

watch(
  () => autoAccept.willAutoAccept,
  (w) => (w ? resume() : pause()),
  { immediate: true }
)

const handleSetAutoAccept = (v: boolean) => {
  setEnableAutoAccept(v)
}
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
