<template>
  <NScrollbar style="max-height: 60vh" trigger="none">
    <NCard size="small">
      <template #header><span class="card-header-title">通用</span></template>
      <div class="control-line">
        <div class="label" title="在进入游戏状态时，自动切换到对局页面">自动切换到对局页面</div>
        <div class="control">
          <NSwitch
            size="small"
            :value="settings.matchHistory.autoRouteOnGameStart"
            @update:value="(val) => setAutoRouteOnGameStart(val)"
          />
        </div>
      </div>
      <div class="control-line">
        <div class="label" title="在对局结束后，刷新与该局相关人员相关页面的战绩">更新页面战绩</div>
        <div class="control">
          <NSwitch
            size="small"
            :value="settings.matchHistory.fetchAfterGame"
            @update:value="(val) => setAfterGameFetch(val)"
          />
        </div>
      </div>
      <div class="control-line">
        <div
          class="label"
          title="在请求战绩列表的同时，也会立即拉取所有详细对局，短时间内的大量请求可能导致触发服务器限制"
        >
          拉取详细对局
        </div>
        <div class="control">
          <NSwitch
            size="small"
            :value="settings.matchHistory.fetchDetailedGame"
            @update:value="(val) => setFetchDetailedGame(val)"
          />
        </div>
      </div>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">对局分析</span></template>
      <div class="control-line">
        <div class="label" title="加载每位玩家战绩数量的页面大小">战绩分析数量</div>
        <div class="control">
          <NInputNumber
            style="width: 100px"
            size="tiny"
            :min="2"
            :max="200"
            :value="settings.matchHistory.matchHistoryLoadCount"
            @update:value="(val) => setMatchHistoryLoadCount(val || 20)"
          />
        </div>
      </div>
      <div class="control-line">
        <div class="label" title="在预组队次数超过一定量时，判定为预组队成员">预组队判定阈值</div>
        <div class="control">
          <NInputNumber
            style="width: 100px"
            size="tiny"
            :min="2"
            :value="settings.matchHistory.preMadeTeamThreshold"
            @update:value="(val) => setPreMadeThreshold(val || 3)"
          />
        </div>
      </div>
      <div class="control-line">
        <div class="label" title="加载每位玩家的近期战绩的详细对局信息数量">预组队分析样本局数</div>
        <div class="control">
          <NInputNumber
            style="width: 100px"
            size="tiny"
            :min="2"
            :value="settings.matchHistory.teamAnalysisPreloadCount"
            @update:value="(val) => setTeamAnalysisPreloadCount(val || 4)"
          />
        </div>
      </div>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import { NCard, NInputNumber, NScrollbar, NSwitch } from 'naive-ui'

import {
  setAfterGameFetch,
  setAutoRouteOnGameStart,
  setFetchDetailedGame,
  setMatchHistoryLoadCount,
  setPreMadeThreshold,
  setTeamAnalysisPreloadCount
} from '@renderer/features/match-history'
import { useSettingsStore } from '@renderer/features/stores/settings'

const settings = useSettingsStore()
</script>

<style lang="less" scoped>
.card-header-title {
  font-weight: bold;
}

.control-line {
  display: flex;
  align-items: center;
  font-size: 13px;
  height: 30px;

  &:not(:last-child) {
    margin-bottom: 16px;
  }

  .label {
    width: 130px;
  }

  // .control {
  // }

  .input-number {
    width: 120px;
  }
}
</style>
