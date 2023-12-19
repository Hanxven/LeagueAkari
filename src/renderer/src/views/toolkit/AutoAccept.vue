<template>
  <NCard size="small">
    <template #header><span class="card-header-title">自动接受对局</span></template>
    <div class="control-line">
      <span class="label">开启</span>
      <div style="display: flex; align-items: center; gap: 8px">
        <NSwitch
          :value="settings.autoAccept.enabled"
          @update:value="handleSetAutoAccept"
          size="small"
        />
        <NButton v-if="autoAccept.willAutoAccept" @click="cancelAutoAccept" size="tiny"
          >取消本次自动接受 ({{ (remainingTime / 1e3).toFixed(2) }}s)</NButton
        >
      </div>
    </div>
    <div class="control-line">
      <span class="label">延时 (秒)</span>
      <NInputNumber
        style="width: 80px"
        :value="settings.autoAccept.delaySeconds"
        @update:value="(value) => setDelaySeconds(value || 0)"
        placeholder="秒"
        :min="0"
        :max="10"
        size="tiny"
      />
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { NButton, NCard, NInputNumber, NSwitch } from 'naive-ui'
import { ref, watch } from 'vue'

import {
  cancelAutoAccept,
  disableAutoAccept,
  enableAutoAccept,
  setDelaySeconds
} from '@renderer/features/auto-accept'
import { useAutoAcceptStore } from '@renderer/features/stores/auto-accept'
import { useSettingsStore } from '@renderer/features/stores/settings'

const autoAccept = useAutoAcceptStore()
const settings = useSettingsStore()

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
  if (v) {
    enableAutoAccept()
  } else {
    disableAutoAccept()
  }
}
</script>

<style lang="less" scoped>
@import './style.less';
</style>
