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
          :value="coreFunctionality.settings.autoRouteOnGameStart"
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
          :value="coreFunctionality.settings.fetchAfterGame"
          @update:value="(val) => setFetchAfterGame(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="拉取详细对局"
        label-description="在请求页面战绩列表时，也同时加载所有对局的详细信息"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="coreFunctionality.settings.fetchDetailedGame"
          @update:value="(val) => setFetchDetailedGame(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="重生倒计时"
        label-description="在标题栏展示一个距离重生时间的指示器"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="respawnTimer.settings.enabled"
          @update:value="(val) => setEnableRespawnTimer(val)"
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
          :value="coreFunctionality.settings.matchHistoryLoadCount"
          @update:value="(val) => setMatchHistoryLoadCount(val || 20)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="预组队判定阈值"
        :label-description="`目标玩家群体出现在同一阵营超过 ${coreFunctionality.settings.preMadeTeamThreshold} 次时，则判定为预组队。不能超过预组队分析样本局数`"
        :label-width="320"
      >
        <NInputNumber
          style="width: 100px"
          size="tiny"
          :min="2"
          :value="coreFunctionality.settings.preMadeTeamThreshold"
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
          :value="coreFunctionality.settings.teamAnalysisPreloadCount"
          @update:value="(val) => setTeamAnalysisPreloadCount(val || 4)"
        />
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">KDA 简报</span></template>
      <ControlItem
        class="control-item-margin"
        label="启用 KDA 发送"
        :label-description="`在对局中或英雄选择中，使用 PageUp 发送己方队伍数据，使用 PageDown 发送敌方队伍 KDA 数据。英雄选择中通过聊天室发送。游戏内发送基于模拟键盘实现，因此在发送前，确保游戏内聊天框是关闭状态。游戏内发送途中，按住 Shift 可将信息发送到全局。统计对局的数量为 ${coreFunctionality.settings.matchHistoryLoadCount} 场，等同于对局战绩分析数量`"
        :label-width="320"
      >
        <template #labelDescription>
          <span style="font-weight: 700; color: rgb(0, 179, 195)">PageUp</span> - 发送友方 KDA
          简报，<span style="font-weight: 700; color: rgb(0, 179, 195)">PageDown</span> - 发送敌方
          KDA 简报<br />
          在英雄选择中时，将通过聊天室发送。在游戏进行中时，将通过模拟键盘输入发送<br />
          <span style="font-style: italic">🚩 在游戏中发送时，确保聊天框处于关闭状态</span><br />
          <span style="font-style: italic"
            >🚩 在游戏中发送时，可在发送全程按住 Shift 将消息发送到全局</span
          ><br />
          <span style="font-style: italic"
            >KDA 分析局数和 <span style="font-weight: 700">对局战绩分析数量</span> 一致。({{
              coreFunctionality.settings.matchHistoryLoadCount
            }}
            场)</span
          >
        </template>
        <NSwitch
          size="small"
          :value="coreFunctionality.settings.sendKdaInGame"
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
          :value="coreFunctionality.settings.sendKdaThreshold"
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
          :value="coreFunctionality.settings.sendKdaInGameWithPreMadeTeams"
          @update:value="(val) => setSendKdaInGameWithPreMadeTeams(val)"
        />
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import {
  setAutoRouteOnGameStart,
  setFetchAfterGame,
  setFetchDetailedGame,
  setMatchHistoryLoadCount,
  setPreMadeThreshold,
  setSendKdaInGame,
  setSendKdaInGameWithPreMadeTeams,
  setSendKdaThreshold,
  setTeamAnalysisPreloadCount
} from '@shared/renderer/features/core-functionality'
import { useCoreFunctionalityStore } from '@shared/renderer/features/core-functionality/store'
import { setEnableRespawnTimer } from '@shared/renderer/features/respawn-timer'
import { useRespawnTimerStore } from '@shared/renderer/features/respawn-timer/store'
import { NCard, NInputNumber, NScrollbar, NSwitch } from 'naive-ui'

const respawnTimer = useRespawnTimerStore()
const coreFunctionality = useCoreFunctionalityStore()
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
