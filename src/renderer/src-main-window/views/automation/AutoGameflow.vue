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
        @update:value="(val) => setAutoAcceptEnabled(val)"
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
        @update:value="(val) => setAutoHonorEnabled(val)"
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
          <NRadio value="prefer-lobby-member" title="优先选择房间内的人员，其次是其他队友"
            >优先预组队成员</NRadio
          >
          <NRadio value="only-lobby-member" title="只选择房间内的人员">仅预组队成员</NRadio>
          <NRadio value="all-member" title="考虑任何人">所有成员</NRadio>
          <NRadio value="opt-out" title="将直接跳过此阶段">永远跳过</NRadio>
        </NFlex>
      </NRadioGroup>
    </ControlItem>
    <div class="divider"></div>
    <ControlItem class="control-item-margin" label="自动回到房间开启">
      <template #labelDescription>
        对局结束时回到房间。可能需要先启用
        <span style="font-weight: 700">自动点赞</span> 以跳过点赞投票阶段
      </template>
      <NSwitch
        :value="autoGameflow.settings.playAgainEnabled"
        @update:value="(val) => setPlayAgainEnabled(val)"
        size="small"
      />
    </ControlItem>
    <div class="divider"></div>
    <ControlItem
      class="control-item-margin"
      label="自动匹配对局"
      label-description="在可匹配对局时，将自动开始匹配对局。如有正在邀请中的玩家，则等待"
    >
      <NSwitch
        :value="autoGameflow.settings.autoSearchMatchEnabled"
        @update:value="(val) => setAutoSearchMatchEnabled(val)"
        size="small"
      />
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="匹配前等待时间 (s)"
      label-description="在可匹配对局时，预留的等待时间，单位为秒"
    >
      <NInputNumber
        style="width: 80px"
        :value="autoGameflow.settings.autoSearchMatchDelaySeconds"
        @update:value="(value) => setAutoSearchMatchDelaySeconds(value || 0)"
        placeholder="秒"
        :min="0"
        :max="20"
        size="tiny"
      />
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import {
  setAutoAcceptDelaySeconds,
  setAutoAcceptEnabled,
  setAutoHonorEnabled,
  setAutoHonorStrategy,
  setAutoSearchMatchDelaySeconds,
  setAutoSearchMatchEnabled,
  setPlayAgainEnabled
} from '@shared/renderer/modules/auto-gameflow'
import { useAutoGameflowStore } from '@shared/renderer/modules/auto-gameflow/store'
import { NCard, NFlex, NInputNumber, NRadio, NRadioGroup, NSwitch } from 'naive-ui'

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
