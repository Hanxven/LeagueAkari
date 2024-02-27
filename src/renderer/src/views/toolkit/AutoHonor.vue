<template>
  <NCard size="small">
    <template #header><span class="card-header-title">结算自动点赞</span></template>
    <ControlItem
      class="control-item-margin"
      label="开启"
      label-description="在游戏结束时，自动点赞一位队友"
    >
      <NSwitch
        :value="settings.autoHonor.enabled"
        @update:value="(val) => setEnableAutoHonor(val)"
        size="small"
      />
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="点赞选择策略"
      label-description="这将决定具体给哪位玩家点赞"
    >
      <NRadioGroup
        size="small"
        name="radio-group"
        :value="settings.autoHonor.strategy"
        @update:value="(val) => setAutoHonorStrategy(val)"
      >
        <NFlex :size="4">
          <NRadio value="random-all">随机所有队友</NRadio>
          <NRadio value="random-lobby-member">随机预组队成员</NRadio>
          <NRadio value="opt-out">跳过</NRadio>
        </NFlex>
      </NRadioGroup>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import { NCard, NRadio, NRadioGroup, NSwitch, NFlex } from 'naive-ui'

import ControlItem from '@renderer/components/ControlItem.vue'
import { setAutoHonorStrategy, setEnableAutoHonor } from '@renderer/features/auto-honor'
import { useSettingsStore } from '@renderer/features/stores/settings'

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
