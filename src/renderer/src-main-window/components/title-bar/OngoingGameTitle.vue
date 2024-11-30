<template>
  <div class="ongoing-game-title">
    <template v-if="ogs.queryStage.phase !== 'unavailable'">
      <LcuImage v-if="intelligence.mapIconUri" :src="intelligence.mapIconUri" class="map-icon" />
      <span class="ongoing-title-map-name" v-if="intelligence.mapName">{{
        intelligence.mapName
      }}</span>
      <span class="dot-separator" v-if="intelligence.mapName && intelligence.teamName">·</span>
      <span class="ongoing-title-side" v-if="intelligence.teamName">
        {{ intelligence.teamName }}</span
      >
      <div class="action-controls">
        <NSelect
          class="order-select"
          size="tiny"
          :consistent-menu-width="false"
          :options="orderOptions"
          v-model:value="ogs.settings.orderPlayerBy"
        />
        <NSelect
          class="queue-tag-select"
          v-if="ogs.settings.matchHistoryUseSgpApi"
          size="tiny"
          :value="ogs.matchHistoryTag"
          :consistent-menu-width="false"
          @update:value="(val) => og.setMatchHistoryTag(val)"
          :options="sgpTagOptions"
        />
        <NTooltip :z-index="TITLE_BAR_TOOLTIP_Z_INDEX">
          <template #trigger>
            <NButton class="refresh-button" secondary circle size="tiny" @click="() => og.reload()">
              <template #icon>
                <NIcon><RefreshIcon /></NIcon>
              </template>
            </NButton>
          </template>
          {{ t('OngoingGameTitle.refresh') }}
        </NTooltip>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useInstance } from '@renderer-shared/shards'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { RefreshRound as RefreshIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NSelect, NTooltip } from 'naive-ui'
import { computed } from 'vue'

const { t } = useTranslation()

const TITLE_BAR_TOOLTIP_Z_INDEX = 75000

const ogs = useOngoingGameStore()
const og = useInstance<OngoingGameRenderer>('ongoing-game-renderer')
const lcs = useLeagueClientStore()

const orderOptions = computed(() => {
  return [
    {
      label: t('OngoingGameTitle.orderOptions.default'),
      value: 'default'
    },
    {
      label: t('OngoingGameTitle.orderOptions.position'),
      value: 'position'
    },
    {
      label: t('OngoingGameTitle.orderOptions.premade-team'),
      value: 'premade-team'
    },
    {
      label: t('OngoingGameTitle.orderOptions.win-rate'),
      value: 'win-rate'
    },
    {
      label: t('OngoingGameTitle.orderOptions.kda'),
      value: 'kda'
    },
    {
      label: t('OngoingGameTitle.orderOptions.akari-score'),
      value: 'akari-score'
    }
  ]
})

const sgpTagOptions = computed(() => {
  return [
    {
      label: t('common.sgpMatchHistoryTags.all'),
      value: 'all'
    },
    {
      label: lcs.gameData.queues[420]?.name || t('common.sgpMatchHistoryTags.q_420', 'q_420'),
      value: `q_420`
    },
    {
      label: lcs.gameData.queues[430]?.name || t('common.sgpMatchHistoryTags.q_430', 'q_430'),
      value: `q_430`
    },
    {
      label: lcs.gameData.queues[440]?.name || t('common.sgpMatchHistoryTags.q_440', 'q_440'),
      value: `q_440`
    },
    {
      label: lcs.gameData.queues[450]?.name || t('common.sgpMatchHistoryTags.q_450', 'q_450'),
      value: `q_450`
    },

    {
      label: lcs.gameData.queues[1700]?.name || t('common.sgpMatchHistoryTags.q_1700', 'q_1700'),
      value: 'q_1700'
    },
    {
      label: lcs.gameData.queues[490]?.name || t('common.sgpMatchHistoryTags.q_490', 'q_490'),
      value: `q_490`
    },
    {
      label: lcs.gameData.queues[1900]?.name || t('common.sgpMatchHistoryTags.q_1900', 'q_1900'),
      value: `q_1900`
    },
    {
      label: lcs.gameData.queues[900]?.name || t('common.sgpMatchHistoryTags.q_900', 'q_900'),
      value: `q_900`
    }
  ]
})

const teamNameMap = computed(() => ({
  100: t('common.teams.100'),
  200: t('common.teams.200'),
  'our-1': t('common.teams.100'),
  'our-2': t('common.teams.200'),
  'their-1': t('common.teams.100'),
  'their-2': t('common.teams.200')
}))

const intelligence = computed(() => {
  const mapName = lcs.gameflow.session?.map.name

  const selfPuuid = lcs.summoner.me?.puuid
  const team = Object.entries(ogs.teams).find(([_teamId, puuids]) =>
    puuids.some((puuid) => puuid === selfPuuid)
  )
  const teamName = team ? teamNameMap.value[team[0]] : undefined

  return {
    mapName,
    teamName,
    mapIconUri: lcs.gameflow.session?.map?.assets?.['game-select-icon-hover']
  }
})
</script>

<style lang="less" scoped>
.ongoing-game-title {
  height: 100%;
  align-items: center;
  display: flex;
  gap: 8px;
  color: #fffd;
}

.order-select {
  width: 160px;
  -webkit-app-region: no-drag;
}

.queue-tag-select {
  width: 160px;
  -webkit-app-region: no-drag;
}

.refresh-button {
  -webkit-app-region: no-drag;
}

.map-icon {
  width: 18px;
  height: 18px;
}

.ongoing-title-map-name {
  font-size: 14px;
  font-weight: bold;
}

.ongoing-title-side {
  font-size: 14px;
  font-weight: bold;
}

.action-controls {
  display: flex;
  gap: 8px;
  height: 100%;
  align-items: center;
  box-sizing: border-box;
  margin-left: auto;
}
</style>
