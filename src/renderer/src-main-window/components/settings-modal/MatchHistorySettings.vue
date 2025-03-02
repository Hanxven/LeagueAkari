<template>
  <NScrollbar style="height: 65vh">
    <NCard size="small">
      <template #header>
        <span class="card-header-title">{{ t('MatchHistorySettings.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('MatchHistorySettings.refreshTabsAfterGameEnds.label')"
        :label-description="t('MatchHistorySettings.refreshTabsAfterGameEnds.description')"
        :label-width="400"
      >
        <NSwitch size="small" v-model:value="mhs.settings.refreshTabsAfterGameEnds" />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('MatchHistorySettings.matchHistoryUseSgpApi.label')"
        :label-width="400"
      >
        <template #labelDescription>
          <div>{{ t('MatchHistorySettings.matchHistoryUseSgpApi.description') }}</div>
          <template
            v-if="mhs.settings.matchHistoryUseSgpApi && lcs.connectionState === 'connected'"
          >
            <div
              v-if="sgps.availability.sgpServerId"
              class="sgp-server-hint-ok"
              style="font-weight: bold; user-select: text"
            >
              {{
                t('MatchHistorySettings.matchHistoryUseSgpApi.current', {
                  server: sgps.availability.sgpServerId
                })
              }}
            </div>
            <div class="sgp-server-hint-not-ok" v-else style="font-weight: bold">
              {{
                t('MatchHistorySettings.matchHistoryUseSgpApi.unsupported', {
                  server: sgps.availability.sgpServerId
                })
              }}
            </div>
          </template>
        </template>
        <NSwitch size="small" v-model:value="mhs.settings.matchHistoryUseSgpApi" />
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{ `特别关心` }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="`持续关注`"
        :label-description="`开启后，将定期更新所关注玩家的信息`"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="pss.settings.enabled"
          @update:value="(val) => ps.setEnabled(val)"
        />
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { PlayerStalkingRenderer } from '@renderer-shared/shards/player-stalking'
import { usePlayerStalkingStore } from '@renderer-shared/shards/player-stalking/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { useTranslation } from 'i18next-vue'
import { NCard, NScrollbar, NSwitch } from 'naive-ui'

import { useMatchHistoryTabsStore } from '@main-window/shards/match-history-tabs/store'

const { t } = useTranslation()

const ps = useInstance<PlayerStalkingRenderer>('player-stalking-renderer')

const mhs = useMatchHistoryTabsStore()
const sgps = useSgpStore()
const lcs = useLeagueClientStore()
const pss = usePlayerStalkingStore()
</script>

<style lang="less" scoped>
[data-theme='dark'] {
  .sgp-server-hint-ok {
    color: #63e2b7;
  }

  .sgp-server-hint-not-ok {
    color: rgb(209, 170, 124);
  }
}

[data-theme='light'] {
  .sgp-server-hint-ok {
    color: rgb(24, 129, 94);
  }

  .sgp-server-hint-not-ok {
    color: rgb(166, 116, 58);
  }
}
</style>
