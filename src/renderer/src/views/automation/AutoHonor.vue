<template>
  <NCard size="small">
    <template #header><span class="card-header-title">结算时点赞</span></template>
    <ControlItem
      class="control-item-margin"
      label="开启"
      label-description="在游戏结束时，自动点赞一位队友。若不存在可点赞的玩家，将跳过点赞阶段"
    >
      <NSwitch
        :value="autoHonor.settings.enabled"
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
        :value="autoHonor.settings.strategy"
        @update:value="(val) => setAutoHonorStrategy(val)"
      >
        <NFlex :size="4">
          <NRadio value="prefer-lobby-member">优先预组队成员</NRadio>
          <NRadio value="only-lobby-member">仅预组队成员</NRadio>
          <NRadio value="all-member">所有成员</NRadio>
          <NRadio value="opt-out">永远跳过</NRadio>
        </NFlex>
      </NRadioGroup>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import { NCard, NFlex, NRadio, NRadioGroup, NSwitch } from 'naive-ui'

import ControlItem from '@renderer/components/ControlItem.vue'
import { setAutoHonorStrategy, setEnableAutoHonor } from '@renderer/features/auto-honor'
import { useAutoHonorStore } from '@renderer/features/auto-honor/store'

const autoHonor = useAutoHonorStore()
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
