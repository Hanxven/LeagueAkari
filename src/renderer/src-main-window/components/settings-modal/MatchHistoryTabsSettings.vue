<template>
  <NScrollbar style="max-height: 65vh">
    <NCard size="small">
      <template #header
        ><span class="card-header-title">{{ t('MatchHistoryTabsSettings.title') }}</span></template
      >
      <ControlItem
        class="control-item-margin"
        :label="t('MatchHistoryTabsSettings.refreshTabsAfterGameEnds.label')"
        :label-description="t('MatchHistoryTabsSettings.refreshTabsAfterGameEnds.description')"
        :label-width="320"
      >
        <NSwitch size="small" v-model:value="mhs.settings.refreshTabsAfterGameEnds" />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('MatchHistoryTabsSettings.matchHistoryUseSgpApi.label')"
        :label-width="320"
      >
        <template #labelDescription>
          <div>{{ t('MatchHistoryTabsSettings.matchHistoryUseSgpApi.description') }}</div>
          <template
            v-if="mhs.settings.matchHistoryUseSgpApi && lcs.connectionState === 'connected'"
          >
            <div
              v-if="sgps.availability.sgpServerId"
              style="color: #63e2b7; font-weight: bold; user-select: text"
            >
              {{
                t('MatchHistoryTabsSettings.matchHistoryUseSgpApi.current', {
                  server: sgps.availability.sgpServerId
                })
              }}
            </div>
            <div v-else style="color: rgb(209, 170, 124); font-weight: bold">
              {{
                t('MatchHistoryTabsSettings.matchHistoryUseSgpApi.unsupported', {
                  server: sgps.availability.sgpServerId
                })
              }}
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
import { useTranslation } from 'i18next-vue'

import { useMatchHistoryTabsStore } from '@main-window/shards/match-history-tabs/store'


const { t } = useTranslation()

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
