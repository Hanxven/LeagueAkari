<template>
  <div class="ongoing-game-title">
    <template v-if="ogs.queryStage.phase !== 'unavailable'">
      <NSelect class="queue-tag-select" size="tiny"></NSelect>
      <NSelect class="queue-tag-select" size="tiny"></NSelect>
      <NTooltip :z-index="TITLE_BAR_TOOLTIP_Z_INDEX">
        <template #trigger>
          <NButton class="refresh-button" secondary circle size="tiny">
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
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { RefreshRound as RefreshIcon } from '@vicons/material'
import { NButton, NIcon, NSelect, NTooltip } from 'naive-ui'

const TITLE_BAR_TOOLTIP_Z_INDEX = 75000

const ogs = useOngoingGameStore()
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

.queue-tag-select {
  width: 120px;
  -webkit-app-region: no-drag;
}

.refresh-button {
  -webkit-app-region: no-drag;
}
</style>
