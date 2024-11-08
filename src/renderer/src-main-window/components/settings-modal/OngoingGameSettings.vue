<template>
  <NScrollbar style="max-height: 65vh" trigger="none">
    <NCard size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">配置项</span></template>
      <ControlItem
        class="control-item-margin"
        label="启用"
        label-description="在进入英雄选择中或对局时，将进行对局分析"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="ogs.settings.enabled"
          @update:value="(val) => og.setEnabled(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="对局战绩分析数量"
        label-description="在对局页面中，用于分析每名玩家的战绩拉取对局数量"
        :label-width="320"
      >
        <NInputNumber
          style="width: 100px"
          size="small"
          :min="2"
          :max="200"
          :value="ogs.settings.matchHistoryLoadCount"
          @update:value="(val) => og.setMatchHistoryLoadCount(val || 20)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="预组队判定阈值"
        :label-description="`目标玩家群体出现在同一阵营超过 ${ogs.settings.premadeTeamThreshold} 次时，则判定为预组队`"
        :label-width="320"
      >
        <NInputNumber
          style="width: 100px"
          size="small"
          :min="2"
          :value="ogs.settings.premadeTeamThreshold"
          @update:value="(val) => og.setPremadeTeamThreshold(val || 3)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="对局中请求并发数"
        label-description="在对局分析中，所进行的所有网络请求总并发数限制。它并不会限制其他模块的请求并发数"
        :label-width="320"
      >
        <NInputNumber
          style="width: 100px"
          size="small"
          :min="1"
          :value="ogs.settings.concurrency"
          @update:value="(val) => og.setConcurrency(val || 10)"
        />
      </ControlItem>
      <ControlItem class="control-item-margin" label="使用 SGP API" :label-width="320">
        <template #labelDescription>
          <div>对局分析优先使用 SGP API 查询对局，若当前 SGP API 不可用，则使用 LCU API</div>
          <div
            class="unsupported-sgp-server"
            v-if="sgps.availability.region && !sgps.availability.serversSupported.matchHistory"
          >
            League Akari 暂不支持当前服务器: {{ sgps.availability.sgpServerId }}
          </div>
        </template>
        <NSwitch
          size="small"
          :min="1"
          :value="ogs.settings.matchHistoryUseSgpApi"
          @update:value="(val) => og.setMatchHistoryUseSgpApi(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="队列筛选偏好"
        label-description="使用 SGP API 时，加载战绩时的队列筛选偏好"
        :label-width="320"
      >
        <NRadioGroup
          :value="ogs.settings.matchHistoryTagPreference"
          @update:value="(val) => og.setMatchHistoryTagPreference(val)"
        >
          <NRadio
            value="all"
            :title="`请求战绩页时不添加限定条件，将拉取近期 ${ogs.settings.matchHistoryLoadCount} 场战绩`"
          >
            所有模式</NRadio
          >
          <NRadio
            value="current"
            title="按照当前的请求查询战绩页，若非支持筛选的队列，则退化到 '所有模式'"
            >当前模式</NRadio
          >
        </NRadioGroup>
      </ControlItem>
    </NCard>
    <!-- <NCard size="small" style="margin-top: 8px">
      <template #header
        ><span class="card-header-title" :class="{ disabled: !app.isAdministrator }">{{
          app.isAdministrator ? 'KDA 简报' : 'KDA 简报 (需要管理员权限)'
        }}</span></template
      >
      <ControlItem
        :disabled="!app.isAdministrator"
        class="control-item-margin"
        label="启用 KDA 发送"
        :label-description="`在对局中或英雄选择中，使用 PageUp 发送己方队伍数据，使用 PageDown 发送敌方队伍 KDA 数据。英雄选择中通过聊天室发送。游戏内发送基于模拟键盘实现，因此在发送前，确保游戏内聊天框是关闭状态。游戏内发送途中，按住 Shift 可将信息发送到全局。统计对局的数量为 ${cf.settings.matchHistoryLoadCount} 场，等同于对局战绩分析数量`"
        :label-width="320"
      >
        <template #labelDescription="{ disabled }">
          <div :style="{ filter: disabled ? 'brightness(0.6)' : 'unset' }">
            <span style="font-weight: bold; color: rgb(0, 179, 195)">PageUp</span> - 发送友方 KDA
            简报，<span style="font-weight: bold; color: rgb(0, 179, 195)">PageDown</span> -
            发送敌方 KDA 简报<br />
            在英雄选择中时，将通过聊天室发送。在游戏进行中时，将通过模拟键盘输入发送<br />
            <span style="font-style: italic">🚩 在游戏中发送时，确保聊天框处于关闭状态</span><br />
            <span style="font-style: italic"
              >🚩 在游戏中发送时，可在发送全程按住 Shift 将消息发送到全局</span
            ><br />
            <span style="font-style: italic"
              >KDA 分析局数和 <span style="font-weight: bold">对局战绩分析数量</span> 一致。({{
                ogs.settings.matchHistoryLoadCount
              }}
              场)</span
            >
          </div>
        </template>
        <NSwitch
          :disabled="!app.isAdministrator"
          size="small"
          :value="ogs.settings.sendKdaInGame"
          @update:value="(val) => cfm.setSendKdaInGame(val)"
        />
      </ControlItem> -->
    <!-- <ControlItem
        :disabled="!app.isAdministrator"
        class="control-item-margin"
        label="KDA 发送最低值"
        label-description="仅当需发送对象的 KDA 值大于此值时，才会发送"
        :label-width="320"
      >
        <NInputNumber
          :disabled="!app.isAdministrator"
          style="width: 100px"
          size="small"
          :min="0"
          step="0.1"
          :value="cf.settings.sendKdaThreshold"
          @update:value="(val) => cfm.setSendKdaThreshold(val || 0)"
        />
      </ControlItem>
      <ControlItem
        :disabled="!app.isAdministrator"
        class="control-item-margin"
        label="KDA 发送时附带预组队信息"
        label-description="在发送 KDA 数据时，将可能的预组队信息也一并发送"
        :label-width="320"
      >
        <NSwitch
          :disabled="!app.isAdministrator"
          size="small"
          :value="cf.settings.sendKdaInGameWithPreMadeTeams"
          @update:value="(val) => cfm.setSendKdaInGameWithPreMadeTeams(val)"
        />
      </ControlItem> -->
    <!-- <ControlItem
        v-if="cf.ongoingTeams"
        :disabled="!app.isAdministrator"
        class="control-item-margin"
        label="仅发送这些玩家"
        label-description="KDA 简报仅发送以下玩家的数据"
        :label-width="320"
      >
        <div
          v-for="(playerPuuids, team) of cf.ongoingTeams"
          :key="team"
          style="display: flex; flex-wrap: wrap; margin-bottom: 4px"
        >
          <NCheckbox
            size="small"
            v-for="puuid of playerPuuids"
            :key="puuid"
            :checked="cf.sendList[puuid]"
            @update:checked="(val) => cfm.setSendPlayer(puuid, val)"
            >{{
              summonerName(
                summoners[puuid]?.gameName || summoners[puuid]?.displayName,
                summoners[puuid]?.tagLine,
                puuid.slice(0, 6)
              )
            }}</NCheckbox
          >
        </div>
      </ControlItem> -->
    <!-- </NCard> -->
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { NCard, NInputNumber, NRadio, NRadioGroup, NScrollbar, NSwitch } from 'naive-ui'

const ogs = useOngoingGameStore()
const og = useInstance<OngoingGameRenderer>('ongoing-game-renderer')
const sgps = useSgpStore()
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

.card-header-title.disabled {
  color: rgba(255, 255, 255, 0.35);
}

.unsupported-sgp-server {
  color: rgb(230, 114, 41);
  font-weight: bold;
}
</style>
