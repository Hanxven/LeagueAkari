<template>
  <NScrollbar style="max-height: 60vh" trigger="none">
    <NCard size="small">
      <template #header><span class="card-header-title">通用</span></template>
      <ControlItem
        class="control-item-margin"
        label="自动切换到对局页面"
        label-description="在进入英雄选择或其他游戏状态时，自动切换到“对局”页面"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="settings.matchHistory.autoRouteOnGameStart"
          @update:value="(val) => setAutoRouteOnGameStart(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="更新页面战绩"
        label-description="在对局结束后，主动刷新所有涉及到本次对局的战绩页面。由于服务器的更新延迟，获取到的战绩仍可能非最新"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="settings.matchHistory.fetchAfterGame"
          @update:value="(val) => setAfterGameFetch(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="拉取详细对局"
        label-description="在请求战绩列表时，也同时加载所有对局的详细信息"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="settings.matchHistory.fetchDetailedGame"
          @update:value="(val) => setFetchDetailedGame(val)"
        />
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">对局分析</span></template>
      <ControlItem
        class="control-item-margin"
        label="对局战绩分析数量"
        label-description="在对局页面中，用于分析每名玩家的战绩拉取对局数量"
        :label-width="320"
      >
        <NInputNumber
          style="width: 100px"
          size="tiny"
          :min="2"
          :max="200"
          :value="settings.matchHistory.matchHistoryLoadCount"
          @update:value="(val) => setMatchHistoryLoadCount(val || 20)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="预组队判定阈值"
        :label-description="`目标玩家群体出现在同一阵营超过 ${settings.matchHistory.preMadeTeamThreshold} 次时，则判定为预组队。不能超过预组队分析样本局数`"
        :label-width="320"
      >
        <NInputNumber
          style="width: 100px"
          size="tiny"
          :min="2"
          :value="settings.matchHistory.preMadeTeamThreshold"
          @update:value="(val) => setPreMadeThreshold(val || 3)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="预组队分析样本局数"
        label-description="为了分析预组队情况而进行的详细对局拉取数量，不能小于预组队判定阈值"
        :label-width="320"
      >
        <NInputNumber
          style="width: 100px"
          size="tiny"
          :min="2"
          :value="settings.matchHistory.teamAnalysisPreloadCount"
          @update:value="(val) => setTeamAnalysisPreloadCount(val || 4)"
        />
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">平均 KDA 简报</span></template>
      <ControlItem
        class="control-item-margin"
        label="启用 KDA 发送"
        :label-description="`在对局中或英雄选择中，使用 PageUp 发送己方队伍数据，使用 PageDown 发送敌方队伍 KDA 数据。英雄选择中发送通过聊天室实现。游戏内发送基于键盘输入模拟实现，因此在发送前，确保游戏内聊天框是关闭状态。统计对局的数量为 ${settings.matchHistory.matchHistoryLoadCount} 场，等同于对局战绩分析数量`"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="settings.matchHistory.sendKdaInGame"
          @update:value="(val) => setSendKdaInGame(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="KDA 发送最低值"
        label-description="仅当需发送对象的 KDA 值大于此值时，才会发送"
        :label-width="320"
      >
        <NInputNumber
          style="width: 100px"
          size="tiny"
          :min="0"
          step="0.1"
          :value="settings.matchHistory.sendKdaThreshold"
          @update:value="(val) => setSendKdaThreshold(val || 0)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="KDA 发送时附带预组队信息"
        label-description="在发送 KDA 数据时，将可能的预组队信息也一并发送"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="settings.matchHistory.sendKdaInGameWithPreMadeTeams"
          @update:value="(val) => setSendKdaInGameWithPreMadeTeams(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="KDA 发送附带免责声明"
        label-description="在发送 KDA 数据时，在最后附带一条免责声明"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="settings.matchHistory.sendKdaInGameWithDisclaimer"
          @update:value="(val) => setSendKdaInGameWithDisclaimer(val)"
        />
      </ControlItem>
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
  setSendKdaInGame,
  setSendKdaInGameWithDisclaimer,
  setSendKdaInGameWithPreMadeTeams,
  setSendKdaThreshold,
  setTeamAnalysisPreloadCount
} from '@renderer/features/match-history'
import { useSettingsStore } from '@renderer/features/stores/settings'

import ControlItem from '../ControlItem.vue'

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
