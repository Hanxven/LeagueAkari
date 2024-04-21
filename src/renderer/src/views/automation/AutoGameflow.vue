<template>
  <NCard size="small">
    <template #header><span class="card-header-title">游戏流</span></template>
    <ControlItem
      class="control-item-margin"
      label="自动接受对局开启"
      label-description="当匹配到玩家时，自动确认"
    >
      <NSwitch
        :value="autoGameflow.settings.autoAcceptEnabled"
        @update:value="(val) => setEnableAutoAccept(val)"
        size="small"
      />
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="自动接受对局延时 (s)"
      label-description="在可接受时延迟执行接受操作的时间，单位为秒"
    >
      <NInputNumber
        style="width: 80px"
        :value="autoGameflow.settings.autoAcceptDelaySeconds"
        @update:value="(value) => setAutoAcceptDelaySeconds(value || 0)"
        placeholder="秒"
        :min="0"
        :max="10"
        size="tiny"
      />
    </ControlItem>
    <div class="divider"></div>
    <ControlItem
      class="control-item-margin"
      label="自动点赞开启"
      label-description="在游戏结束时，自动点赞一位队友。若不存在可点赞的玩家，将跳过点赞阶段"
    >
      <NSwitch
        :value="autoGameflow.settings.autoHonorEnabled"
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
        :value="autoGameflow.settings.autoHonorStrategy"
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
    <div class="divider"></div>
    <ControlItem class="control-item-margin" label="自动回到房间开启">
      <template #labelDescription>
        对局结束时，在短暂延迟后回到房间。可能需要先启用
        <span style="font-weight: 700">自动点赞</span> 以跳过点赞投票阶段
      </template>
      <NSwitch
        :value="autoGameflow.settings.playAgainEnabled"
        @update:value="(val) => setPlayAgainEnabled(val)"
        size="small"
      />
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import { NCard, NFlex, NInputNumber, NRadio, NRadioGroup, NSwitch } from 'naive-ui'

import ControlItem from '@renderer/components/ControlItem.vue'
import {
  setAutoAcceptDelaySeconds,
  setAutoHonorStrategy,
  setEnableAutoAccept,
  setEnableAutoHonor,
  setPlayAgainEnabled
} from '@renderer/features/auto-gameflow'
import { useAutoGameflowStore } from '@renderer/features/auto-gameflow/store'

const autoGameflow = useAutoGameflowStore()
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

.divider {
  margin-top: 12px;
  margin-bottom: 12px;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.084);
}
</style>
