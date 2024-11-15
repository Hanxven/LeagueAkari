<template>
  <div class="ongoing-game-title">
    <template v-if="ogs.queryStage.phase !== 'unavailable'">
      <NSelect
        class="order-select"
        size="tiny"
        :options="orderOptions"
        v-model:value="ogs.settings.orderPlayerBy"
      />
      <NSelect
        class="queue-tag-select"
        size="tiny"
        :value="ogs.matchHistoryTag"
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
        刷新对局页面
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

const TITLE_BAR_TOOLTIP_Z_INDEX = 75000

const ogs = useOngoingGameStore()
const og = useInstance<OngoingGameRenderer>('ongoing-game-renderer')
const lcs = useLeagueClientStore()

const orderOptions = [
  {
    label: '楼层顺序',
    value: 'default'
  },
  {
    label: '胜率降序',
    value: 'win-rate'
  },
  {
    label: 'KDA 降序',
    value: 'kda'
  },
  {
    label: '评分降序',
    value: 'akari-score'
  }
]

const sgpTagOptions = computed(() => {
  return [
    {
      label: '全部队列',
      value: 'all'
    },
    {
      label: lcs.gameData.queues[420]?.name || 'Ranked Solo/Duo',
      value: `q_420`
    },
    {
      label: lcs.gameData.queues[430]?.name || 'Normal',
      value: `q_430`
    },
    {
      label: lcs.gameData.queues[440]?.name || 'Ranked Flex',
      value: `q_440`
    },
    {
      label: lcs.gameData.queues[450]?.name || 'ARAM',
      value: `q_450`
    },

    {
      label: lcs.gameData.queues[1700]?.name || 'ARENA',
      value: 'q_1700'
    },
    {
      label: lcs.gameData.queues[490]?.name || 'Quickplay',
      value: `q_490`
    },
    {
      label: lcs.gameData.queues[1900]?.name || 'URF',
      value: `q_1900`
    },
    {
      label: lcs.gameData.queues[900]?.name || 'ARURF',
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
