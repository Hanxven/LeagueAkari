<template>
  <NCard size="small">
    <template #header><span class="card-header-title">自动英雄选择 / 英雄禁用</span></template>
    <ControlItem
      class="control-item-margin"
      label="普通模式开启"
      label-description="在常规的模式中启用。如匹配模式，排位模式等任何非随机英雄的模式"
    >
      <NSwitch
        @update:value="(v) => asm.setNormalModeEnabled(v)"
        :value="as.settings.normalModeEnabled"
        size="small"
      ></NSwitch>
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="仅限同步自选模式启用"
      label-description="仅当模式是同步自选模式时生效。这些模式通常需要所有玩家同时选择英雄"
    >
      <NSwitch
        @update:value="(v) => asm.setOnlySimulMode(v)"
        :value="as.settings.onlySimulMode"
        size="small"
      ></NSwitch>
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="无视队友预选"
      label-description="开启后将不会考虑队友的预选英雄，反之会避免与队友的选择冲突"
    >
      <NSwitch
        @update:value="(v) => asm.setSelectTeammateIntendedChampion(v)"
        :value="as.settings.selectTeammateIntendedChampion"
        size="small"
      />
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="提前预选"
      label-description="预选即将自动选用的英雄"
    >
      <NSwitch
        type="pick"
        size="small"
        :value="as.settings.showIntent"
        @update:value="(val) => asm.setShowIntent(val)"
      />
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="选择策略"
      label-description="立即锁定或只是亮出"
    >
      <NSwitch
        @update:value="(v) => asm.setCompleted(v)"
        :value="as.settings.completed"
        size="small"
        :rail-style="completeStrategy"
      >
        <template #checked>锁定</template>
        <template #unchecked>亮出</template></NSwitch
      >
    </ControlItem>
    <ControlItem class="control-item-margin" label="意向英雄">
      <OrderedChampionList
        type="pick"
        :value="as.settings.expectedChampions"
        @update:value="(list) => asm.setExpectedChampions(list)"
      />
    </ControlItem>
    <div class="divider"></div>
    <ControlItem
      class="control-item-margin"
      label="随机模式开启"
      label-description="随机分配英雄的模式，如极地大乱斗"
    >
      <NSwitch
        @update:value="(v) => asm.setBenchModeEnabled(v)"
        :value="as.settings.benchModeEnabled"
        size="small"
      ></NSwitch>
    </ControlItem>
    <ControlItem class="control-item-margin" label="选用延迟 (s)">
      <template #labelDescription>
        目标英雄出现在英雄选择台上的累计时间需达到此值才会执行交换操作，单位为秒
        <NTooltip>
          <template #trigger
            ><span style="text-decoration: underline; font-weight: 700">(?)</span></template
          >
          <div style="font-size: 12px; max-width: 300px">
            当英雄出现在英雄选择台上时，会针对该英雄进行计时。只有其在英雄选择台上的累计时间满足设定值时，则执行自动选择，这可以避免“秒抢”的发生。
          </div>
        </NTooltip>
      </template>
      <NInputNumber
        style="width: 100px"
        placeholder="秒"
        :min="0"
        size="tiny"
        :value="as.settings.grabDelaySeconds"
        @update:value="(v) => asm.setGrabDelaySeconds(v || 0)"
      />
    </ControlItem>
    <ControlItem class="control-item-margin" label="期望英雄">
      <OrderedChampionList
        type="pick"
        :value="as.settings.benchExpectedChampions"
        @update:value="(list) => asm.setBenchExpectedChampions(list)"
      />
    </ControlItem>
    <div class="divider"></div>
    <ControlItem
      class="control-item-margin"
      label="自动禁用开启"
      label-description="自动执行英雄的禁用操作"
    >
      <NSwitch
        @update:value="(v) => asm.setBanEnabled(v)"
        :value="as.settings.banEnabled"
        size="small"
      ></NSwitch>
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="无视队友预选"
      label-description="开启后将不会考虑队友的预选英雄"
    >
      <NSwitch
        @update:value="(v) => asm.setBanTeammateIntendedChampion(v)"
        :value="as.settings.banTeammateIntendedChampion"
        size="small"
      ></NSwitch>
    </ControlItem>
    <ControlItem class="control-item-margin" label="意向英雄">
      <OrderedChampionList
        :value="as.settings.bannedChampions"
        allow-empty
        type="ban"
        @update:value="(list) => asm.setBannedChampions(list)"
      />
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import { autoSelectRendererModule as asm } from '@shared/renderer/modules/auto-select'
import { useAutoSelectStore } from '@shared/renderer/modules/auto-select/store'
import { NCard, NInputNumber, NSwitch, NTooltip } from 'naive-ui'

import OrderedChampionList from '@main-window/components/OrderedChampionList.vue'

const as = useAutoSelectStore()

const completeStrategy = ({ checked }: { checked: boolean }) => {
  if (checked) {
    return { 'background-color': 'rgb(42,100,125)', 'font-size': '12px' }
  } else {
    return { 'background-color': 'rgb(42,148,125)', 'font-size': '12px' }
  }
}
</script>

<style lang="less" scoped>
.divider {
  margin-top: 12px;
  margin-bottom: 12px;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.084);
}

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
@shared/renderer/modules/auto-select@shared/renderer/modules/auto-select/store