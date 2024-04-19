<template>
  <NCard size="small">
    <template #header><span class="card-header-title">自动英雄选择 / 禁用</span></template>
    <ControlItem
      class="control-item-margin"
      label="普通模式开启"
      label-description="在常规的模式中启用。如匹配模式，排位模式等任何非随机英雄的模式"
    >
      <NSwitch
        @update:value="(v) => setNormalModeAutoSelectEnabled(v)"
        :value="autoSelect.settings.normalModeEnabled"
        size="small"
      ></NSwitch>
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="仅限同步自选"
      label-description="仅当模式是同步自选模式时生效。这些模式通常需要所有玩家同时选择英雄"
    >
      <NSwitch
        @update:value="(v) => setOnlySimulMode(v)"
        :value="autoSelect.settings.onlySimulMode"
        size="small"
      ></NSwitch>
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="无视队友预选"
      label-description="开启后将不会考虑队友的预选英雄"
    >
      <NSwitch
        @update:value="(v) => setSelectTeammateIntendedChampion(v)"
        :value="autoSelect.settings.selectTeammateIntendedChampion"
        size="small"
      />
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="随机挑选"
      label-description="在期望列表中随机选择一个英雄，而不是按照列表靠前的顺序"
    >
      <NSwitch
        @update:value="(v) => setSelectRandomly(v)"
        :value="autoSelect.settings.selectRandomly"
        size="small"
      ></NSwitch>
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="提前预选"
      label-description="预选即将自动选用的英雄"
    >
      <NSwitch
        type="pick"
        size="small"
        :value="autoSelect.settings.showIntent"
        @update:value="(val) => setShowIntent(val)"
      />
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="选择策略"
      label-description="立即锁定或只是亮出"
    >
      <NSwitch
        @update:value="(v) => setAutoSelectCompleted(v)"
        :value="autoSelect.settings.completed"
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
        :value="autoSelect.settings.expectedChampions"
        @update:value="(list) => setNormalModeExpectedChampions(list)"
      />
    </ControlItem>
    <div class="divider"></div>
    <ControlItem
      class="control-item-margin"
      label="随机模式开启"
      label-description="随机分配英雄的模式，如极地大乱斗"
    >
      <NSwitch
        @update:value="(v) => setBenchModeAutoSelectEnabled(v)"
        :value="autoSelect.settings.benchModeEnabled"
        size="small"
      ></NSwitch>
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="选用延迟 (s)"
      label-description="目标英雄出现在英雄选择台上的累计时间需达到此值才会执行交换操作，单位为秒"
    >
      <NInputNumber
        style="width: 100px"
        placeholder="秒"
        :min="0"
        size="tiny"
        :value="autoSelect.settings.grabDelaySeconds"
        @update:value="(v) => setGrabDelaySeconds(v || 0)"
      />
    </ControlItem>
    <ControlItem class="control-item-margin" label="期望英雄">
      <OrderedChampionList
        type="pick"
        :value="autoSelect.settings.benchExpectedChampions"
        @update:value="(list) => setBenchModeExpectedChampions(list)"
      />
    </ControlItem>
    <div class="divider"></div>
    <ControlItem
      class="control-item-margin"
      label="自动禁用开启"
      label-description="自动执行英雄的禁用操作"
    >
      <NSwitch
        @update:value="(v) => setAutoBanEnabled(v)"
        :value="autoSelect.settings.banEnabled"
        size="small"
      ></NSwitch>
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="随机禁用"
      label-description="随机选择意向列表中的英雄并禁用，而不是按照列表靠前的顺序"
    >
      <NSwitch
        @update:value="(v) => setBanRandomly(v)"
        :value="autoSelect.settings.banRandomly"
        size="small"
      ></NSwitch>
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="无视队友预选"
      label-description="开启后将不会考虑队友的预选英雄"
    >
      <NSwitch
        @update:value="(v) => setBanTeammateIntendedChampion(v)"
        :value="autoSelect.settings.banTeammateIntendedChampion"
        size="small"
      ></NSwitch>
    </ControlItem>
    <ControlItem class="control-item-margin" label="意向英雄">
      <OrderedChampionList
        :value="autoSelect.settings.bannedChampions"
        type="ban"
        @update:value="(list) => setNormalModeBannedChampions(list)"
      />
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import { NCard, NInputNumber, NSwitch } from 'naive-ui'

import ControlItem from '@renderer/components/ControlItem.vue'
import OrderedChampionList from '@renderer/components/OrderedChampionList.vue'
import {
  setAutoBanEnabled,
  setAutoSelectCompleted,
  setBanRandomly,
  setBanTeammateIntendedChampion,
  setBenchModeAutoSelectEnabled,
  setBenchModeExpectedChampions,
  setGrabDelaySeconds,
  setNormalModeAutoSelectEnabled,
  setNormalModeBannedChampions,
  setNormalModeExpectedChampions,
  setOnlySimulMode,
  setSelectRandomly,
  setSelectTeammateIntendedChampion,
  setShowIntent
} from '@renderer/features/auto-select'
import { useAutoSelectStore } from '@renderer/features/auto-select/store'

// const id = 'view:toolkit:auto-select'

const autoSelect = useAutoSelectStore()

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
