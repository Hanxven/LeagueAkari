<template>
  <NCard size="small">
    <template #header><span class="card-header-title">自动英雄选择</span></template>
    <div class="line" style="display: flex; gap: 16px; margin-bottom: 8px">
      <div>
        <div class="control-line control-line-long" title="任何拥有主动英雄选择的队列，包括匹配队列、排位队列等">
          <span class="label">普通模式开启</span>
          <NSwitch
            @update:value="(v) => setNormalModeAutoSelectEnabled(v)"
            :value="settings.autoSelect.normalModeEnabled"
            size="small"
          ></NSwitch>
        </div>
        <div class="control-line control-line-long" title="仅限同步自选模式，如匹配模式。排位队列等顺序自选队列不应用自动选择">
          <span class="label">仅限同步自选模式</span>
          <NSwitch
            @update:value="(v) => setOnlySimulMode(v)"
            :value="settings.autoSelect.onlySimulMode"
            size="small"
          ></NSwitch>
        </div>
        <div class="control-line control-line-long" title="不会回避队友预选的英雄">
          <span class="label">无视队友预选</span>
          <NSwitch
            @update:value="(v) => setSelectTeammateIntendedChampion(v)"
            :value="settings.autoSelect.selectTeammateIntendedChampion"
            size="small"
          />
        </div>
      </div>
      <div class="vertical-divider" title="朴实无华的竖向分割线"></div>
      <div>
        <div class="control-line control-line-short" title="随机选择一个意向列表中的英雄，而不是按照列表顺序">
          <span class="label">随机挑选</span>
          <NSwitch
            @update:value="(v) => setSelectRandomly(v)"
            :value="settings.autoSelect.selectRandomly"
            size="small"
          ></NSwitch>
        </div>
        <div class="control-line control-line-short">
          <span class="label">选择策略</span>
          <NSwitch
            @update:value="(v) => setAutoSelectCompleted(v)"
            :value="settings.autoSelect.completed"
            size="small"
            :rail-style="completeStrategy"
          >
            <template #checked>锁定</template>
            <template #unchecked>亮出</template></NSwitch
          >
        </div>
      </div>
    </div>
    <div class="control-line control-line-long" title="提供一个意向列表，选择操作将参考此列表">
      <span class="label">意向英雄</span>
      <OrderedChampionList
        :value="settings.autoSelect.expectedChampions"
        @update:value="(list) => setNormalModeExpectedChampions(list)"
      />
    </div>
    <div class="divider"></div>
    <div class="control-line" title="带有英雄选择台的队列，如极地大乱斗">
      <span class="label">随机模式开启</span>
      <NSwitch
        @update:value="(v) => setBenchModeAutoSelectEnabled(v)"
        :value="settings.autoSelect.benchModeEnabled"
        size="small"
      ></NSwitch>
    </div>
    <div class="control-line" title="目标英雄出现在英雄选择台上需满足的累计时间">
      <span class="label">抢选延迟 (秒)</span>
      <NInputNumber
        style="width: 100px"
        placeholder="秒"
        :min="0"
        size="tiny"
        :value="settings.autoSelect.grabDelay"
        @update:value="(v) => setGrabDelay(v || 0)"
      />
    </div>
    <div class="control-line" title="提供一个意向列表，选择操作将参考此列表">
      <span class="label">意向英雄</span>
      <OrderedChampionList
        :value="settings.autoSelect.benchExpectedChampions"
        @update:value="(list) => setBenchModeExpectedChampions(list)"
      />
    </div>
    <div class="control-line" title="在当前聊天室中打印即将进行的选择或取消操作，仅自己可见">
      <span class="label">反馈在聊天室</span>
      <NSwitch
        @update:value="(v) => setBenchActionNotifyInChat(v)"
        :value="settings.autoSelect.benchActionNotifyInChat"
        size="small"
      ></NSwitch>
    </div>
    <div class="divider"></div>
    <div class="control-line">
      <span class="label">自动 ban 开启</span>
      <NSwitch
        @update:value="(v) => setAutoBanEnabled(v)"
        :value="settings.autoSelect.banEnabled"
        size="small"
      ></NSwitch>
    </div>
    <div class="control-line" title="提供一个意向列表，禁用操作将参考此列表">
      <span class="label">意向禁用英雄</span>
      <OrderedChampionList
        :value="settings.autoSelect.bannedChampions"
        @update:value="(list) => setNormalModeBannedChampions(list)"
      />
    </div>
    <div class="control-line" title="随机禁用一个意向列表中的英雄，而不是按照列表顺序">
      <span class="label">随机禁用</span>
      <NSwitch
        @update:value="(v) => setBanRandomly(v)"
        :value="settings.autoSelect.banRandomly"
        size="small"
      ></NSwitch>
    </div>
    <div class="control-line" title="禁用英雄时是否考虑队友预选位">
      <span class="label">无视队友预选</span>
      <NSwitch
        @update:value="(v) => setBanTeammateIntendedChampion(v)"
        :value="settings.autoSelect.banTeammateIntendedChampion"
        size="small"
      ></NSwitch>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { NCard, NInputNumber, NSwitch, NTooltip } from 'naive-ui'

import OrderedChampionList from '@renderer/components/OrderedChampionList.vue'
import {
  setAutoBanEnabled,
  setAutoSelectCompleted,
  setBanRandomly,
  setBanTeammateIntendedChampion,
  setBenchActionNotifyInChat,
  setBenchModeAutoSelectEnabled,
  setBenchModeExpectedChampions,
  setGrabDelay,
  setNormalModeAutoSelectEnabled,
  setNormalModeBannedChampions,
  setNormalModeExpectedChampions,
  setOnlySimulMode,
  setSelectRandomly,
  setSelectTeammateIntendedChampion
} from '@renderer/features/auto-select'
import { useGameDataStore } from '@renderer/features/stores/lcu/game-data'
import { useSettingsStore } from '@renderer/features/stores/settings'

// const id = 'view:toolkit:auto-select'

const settings = useSettingsStore()
const gameData = useGameDataStore()

const completeStrategy = ({ checked }: { checked: boolean }) => {
  if (checked) {
    return { 'background-color': 'rgb(42,100,125)', 'font-size': '12px' }
  } else {
    return { 'background-color': 'rgb(42,148,125)', 'font-size': '12px' }
  }
}
</script>

<style lang="less" scoped>
@import './style.less';

.divider {
  margin-top: 12px;
  margin-bottom: 12px;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.084);
}

.vertical-divider {
  margin-left: 24px;
  margin-right: 24px;
  width: 1px;
  height: 88px;
  align-self: center;
  background-color: rgba(255, 255, 255, 0.084);
}

.control-line-long {
  --label-width: 120px;
}

.control-line-short {
  --label-width: 68px;
}
</style>
