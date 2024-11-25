<template>
  <div class="ongoing-game-title">
    <template v-if="ogs.queryStage.phase !== 'unavailable'">
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { RefreshRound as RefreshIcon } from '@vicons/material'
import { NButton, NIcon, NSelect, NTooltip } from 'naive-ui'
import { computed } from 'vue'
import { useTranslation } from 'i18next-vue'


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
</script>

<style lang="less" scoped>
.ongoing-game-title {
  height: 100%;
  align-items: center;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.sort-player-by-select {
  width: 120px;
  -webkit-app-region: no-drag;
}

.order-select {
  width: 120px;
  -webkit-app-region: no-drag;
}

.queue-tag-select {
  width: 160px;
  -webkit-app-region: no-drag;
}

.refresh-button {
  -webkit-app-region: no-drag;
}
</style>
