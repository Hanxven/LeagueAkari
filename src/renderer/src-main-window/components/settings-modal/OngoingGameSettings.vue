<template>
  <NScrollbar style="max-height: 65vh">
    <NCard size="small" style="margin-top: 8px">
      <template #header
        ><span class="card-header-title">{{ t('OngoingGameSettings.title') }}</span></template
      >
      <ControlItem
        class="control-item-margin"
        :label="t('OngoingGameSettings.enabled.label')"
        :label-description="t('OngoingGameSettings.enabled.description')"
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
        :label="t('OngoingGameSettings.matchHistoryLoadCount.label')"
        :label-description="t('OngoingGameSettings.matchHistoryLoadCount.description')"
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
        :label="t('OngoingGameSettings.premadeTeamThreshold.label')"
        :label-description="
          t('OngoingGameSettings.premadeTeamThreshold.description', {
            threshold: ogs.settings.premadeTeamThreshold
          })
        "
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
        :label="t('OngoingGameSettings.concurrency.label')"
        :label-description="t('OngoingGameSettings.concurrency.description')"
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
      <ControlItem
        class="control-item-margin"
        :label="t('OngoingGameSettings.matchHistoryUseSgpApi.label')"
        :label-width="320"
      >
        <template #labelDescription>
          <div>{{ t('OngoingGameSettings.matchHistoryUseSgpApi.description') }}</div>
          <div
            class="unsupported-sgp-server"
            v-if="sgps.availability.region && !sgps.availability.serversSupported.matchHistory"
          >
            {{
              t('OngoingGameSettings.matchHistoryUseSgpApi.unsupported', {
                server: sgps.availability.region
              })
            }}
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
        :label="t('OngoingGameSettings.matchHistoryTagPreference.label')"
        :label-description="t('OngoingGameSettings.matchHistoryTagPreference.description')"
        :label-width="320"
      >
        <NRadioGroup
          :value="ogs.settings.matchHistoryTagPreference"
          @update:value="(val) => og.setMatchHistoryTagPreference(val)"
        >
          <NRadio value="all">
            {{ t('OngoingGameSettings.matchHistoryTagPreference.options.all') }}</NRadio
          >
          <NRadio value="current">{{
            t('OngoingGameSettings.matchHistoryTagPreference.options.current')
          }}</NRadio>
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
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
