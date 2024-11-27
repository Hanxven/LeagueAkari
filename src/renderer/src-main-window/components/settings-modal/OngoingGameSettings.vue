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
        :label="t('OngoingGameSettings.gameTimelineLoadCount.label')"
        :label-description="
          t('OngoingGameSettings.gameTimelineLoadCount.description', {
            countV: ogs.settings.gameTimelineLoadCount
          })
        "
        :label-width="320"
      >
        <NInputNumber
          style="width: 100px"
          size="small"
          :min="0"
          :value="ogs.settings.gameTimelineLoadCount"
          @update:value="(val) => og.setGameTimelineLoadCount(val || 0)"
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
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { useTranslation } from 'i18next-vue'
import { NCard, NInputNumber, NRadio, NRadioGroup, NScrollbar, NSwitch } from 'naive-ui'

const { t } = useTranslation()

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
