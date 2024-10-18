<template>
  <NScrollbar style="max-height: 65vh" trigger="none">
    <NCard size="small">
      <template #header><span class="card-header-title">战绩页面</span></template>
      <ControlItem
        class="control-item-margin"
        label="更新页面战绩"
        label-description="在对局结束后，主动刷新所有涉及到本次对局的战绩页面。由于服务器的更新延迟，获取到的战绩仍可能非最新"
        :label-width="320"
      >
        <NSwitch size="small" v-model:value="mhs.settings.refreshTabsAfterGameEnds" />
      </ControlItem>
      <ControlItem class="control-item-margin" label="使用 SGP API" :label-width="320">
        <template #labelDescription>
          <div>战绩页面使用 SGP API 作为数据源</div>
          <template
            v-if="mhs.settings.matchHistoryUseSgpApi && lcs.connectionState === 'connected'"
          >
            <div
              v-if="sgps.availability.sgpServerId"
              style="color: #63e2b7; font-weight: bold; user-select: text"
            >
              当前 SGP Server: {{ sgps.availability.sgpServerId }}
            </div>
            <div v-else style="color: rgb(209, 170, 124); font-weight: bold">
              暂不支持当前服务器使用 SGP API:
              {{ sgps.availability.sgpServerId }}
            </div>
          </template>
        </template>
        <NSwitch size="small" v-model:value="mhs.settings.matchHistoryUseSgpApi" />
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { NCard, NScrollbar, NSwitch } from 'naive-ui'

import { useMatchHistoryTabsStore } from '@main-window/shards/match-history-tabs/store'

const mhs = useMatchHistoryTabsStore()
const sgps = useSgpStore()
const lcs = useLeagueClientStore()
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
</style>
