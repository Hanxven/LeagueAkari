<template>
  <NScrollbar class="outer-wrapper" ref="el">
    <div class="inner-wrapper">
      <NCard size="small">
        <template #header><span class="card-header-title">游戏流</span></template>
        <ControlItem
          class="control-item-margin"
          label="自动接受对局开启"
          label-description="当匹配到玩家时，自动确认"
        >
          <NSwitch
            :value="agf.settings.autoAcceptEnabled"
            @update:value="(val) => am.setAutoAcceptEnabled(val)"
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
            :value="agf.settings.autoAcceptDelaySeconds"
            @update:value="(value) => am.setAutoAcceptDelaySeconds(value || 0)"
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
            :value="agf.settings.autoHonorEnabled"
            @update:value="(val) => am.setAutoHonorEnabled(val)"
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
            :value="agf.settings.autoHonorStrategy"
            @update:value="(val) => am.setAutoHonorStrategy(val)"
          >
            <NFlex :size="4">
              <NRadio value="prefer-lobby-member" title="优先选择房间内的人员，其次是其他队友"
                >优先预组队成员</NRadio
              >
              <NRadio value="only-lobby-member" title="只选择房间内的人员">仅预组队成员</NRadio>
              <NRadio value="all-member" title="考虑所有队友">所有队友</NRadio>
              <NRadio value="all-member-including-opponent" title="考虑本局游戏所有玩家 (包括对手)"
                >所有玩家</NRadio
              >
              <NRadio value="opt-out" title="将直接跳过此阶段">永远跳过</NRadio>
            </NFlex>
          </NRadioGroup>
        </ControlItem>
        <div class="divider"></div>
        <ControlItem class="control-item-margin" label="自动回到房间">
          <template #labelDescription>
            对局结束时回到房间。可能需要先启用
            <span style="font-weight: 700">自动点赞</span> 以跳过点赞投票阶段
          </template>
          <NSwitch
            :value="agf.settings.playAgainEnabled"
            @update:value="(val) => am.setPlayAgainEnabled(val)"
            size="small"
          />
        </ControlItem>
        <div class="divider"></div>
        <ControlItem
          class="control-item-margin"
          label="自动匹配对局"
          label-description="在可匹配对局时，将自动开始匹配对局"
        >
          <NSwitch
            :value="agf.settings.autoSearchMatchEnabled"
            @update:value="(val) => am.setAutoSearchMatchEnabled(val)"
            size="small"
          />
        </ControlItem>
        <ControlItem
          class="control-item-margin"
          label="最低人数"
          :label-description="`自动开始匹配需满足人数达到 ${agf.settings.autoSearchMatchMinimumMembers} 人`"
        >
          <NInputNumber
            :value="agf.settings.autoSearchMatchMinimumMembers"
            @update:value="(val) => am.setAutoSearchMatchMinimumMembers(val || 1)"
            :min="1"
            :max="99"
            size="tiny"
            style="width: 80px"
          />
        </ControlItem>
        <ControlItem
          class="control-item-margin"
          label="等待邀请中成员"
          label-description="自动开启匹配将等待所有被邀请的玩家做出回应"
        >
          <NSwitch
            :value="agf.settings.autoSearchMatchWaitForInvitees"
            @update:value="(val) => am.setAutoSearchMatchWaitForInvitees(val)"
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
            :value="agf.settings.autoSearchMatchDelaySeconds"
            @update:value="(value) => am.setAutoSearchMatchDelaySeconds(value || 0)"
            placeholder="秒"
            :min="0"
            :max="20"
            size="tiny"
          />
        </ControlItem>
        <ControlItem
          class="control-item-margin"
          label="停止匹配策略"
          label-description="在某些情况下，自动停止匹配状态。当自动匹配开启时，将会重新开始匹配"
        >
          <NRadioGroup
            :value="agf.settings.autoSearchMatchRematchStrategy"
            @update:value="(s) => am.setAutoSearchMatchRematchStrategy(s)"
            size="small"
          >
            <NFlex>
              <NRadio value="never" title="永远不停止">永不</NRadio>
              <NRadio value="fixed-duration" title="超过指定时间后立即停止">固定时间</NRadio>
              <NRadio value="estimated-duration" title="超过系统队列预估时间后立即停止"
                >超过队列预估时间</NRadio
              >
            </NFlex>
          </NRadioGroup>
        </ControlItem>
        <ControlItem
          class="control-item-margin"
          label="退出匹配时间 (s)"
          :label-description="
            agf.settings.autoSearchMatchRematchStrategy !== 'fixed-duration'
              ? `该选项仅当停止匹配策略为固定时间时生效`
              : `在超过该时间后，将停止匹配，单位为秒`
          "
          :disabled="agf.settings.autoSearchMatchRematchStrategy !== 'fixed-duration'"
        >
          <NInputNumber
            :disabled="agf.settings.autoSearchMatchRematchStrategy !== 'fixed-duration'"
            style="width: 80px"
            :value="agf.settings.autoSearchMatchRematchFixedDuration"
            @update:value="(value) => am.setAutoSearchMatchRematchFixedDuration(value || 2)"
            placeholder="秒"
            :min="1"
            size="tiny"
          />
        </ControlItem>
      </NCard>
    </div>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import { autoGameflowRendererModule as am } from '@shared/renderer/modules/auto-gameflow'
import { useAutoGameflowStore } from '@shared/renderer/modules/auto-gameflow/store'
import { NCard, NFlex, NInputNumber, NRadio, NRadioGroup, NSwitch, NScrollbar } from 'naive-ui'
const agf = useAutoGameflowStore()

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

.outer-wrapper {
  position: relative;
  height: 100%;
  max-width: 100%;
}

.inner-wrapper {
  padding: 24px;
  margin: 0 auto;
  max-width: 800px;

  :deep(.n-card) {
    background-color: transparent;
  }
}
</style>
