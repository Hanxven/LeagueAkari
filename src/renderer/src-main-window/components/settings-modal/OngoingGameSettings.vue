<template>
  <NScrollbar style="height: 65vh">
    <NCard size="small">
      <template #header>
        <span class="card-header-title">{{ t('OngoingGameSettings.titleCommon') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('OngoingGameSettings.enabled.label')"
        :label-description="t('OngoingGameSettings.enabled.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="ogs.settings.enabled"
          @update:value="(val) => og.setEnabled(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('OngoingGameSettings.autoRouteWhenGameStarts.label')"
        :label-description="t('OngoingGameSettings.autoRouteWhenGameStarts.description')"
        :label-width="400"
      >
        <NSwitch size="small" v-model:value="ogs.frontendSettings.autoRouteWhenGameStarts" />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('OngoingGameSettings.matchHistoryLoadCount.label')"
        :label-description="t('OngoingGameSettings.matchHistoryLoadCount.description')"
        :label-width="400"
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
        :label-width="400"
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
        :label-width="400"
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
        :label-width="400"
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
        :label-width="400"
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
        :label-width="400"
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
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{ t('OngoingGameSettings.titlePlayerCard') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label-width="400"
        :label="t('OngoingGameSettings.showChampionUsage.label')"
        :label-description="t('OngoingGameSettings.showChampionUsage.description')"
      >
        <NRadioGroup v-model:value="ogs.frontendSettings.showChampionUsage">
          <NRadio value="none">
            {{ t('OngoingGameSettings.showChampionUsage.options.none') }}</NRadio
          >
          <NRadio value="recent">{{
            t('OngoingGameSettings.showChampionUsage.options.recent')
          }}</NRadio>
          <NRadio value="mastery">{{
            t('OngoingGameSettings.showChampionUsage.options.mastery')
          }}</NRadio>
        </NRadioGroup>
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label-width="400"
        :label="t('OngoingGameSettings.showMatchHistoryItemBorder.label')"
        :label-description="t('OngoingGameSettings.showMatchHistoryItemBorder.description')"
      >
        <NSwitch size="small" v-model:value="ogs.frontendSettings.showMatchHistoryItemBorder" />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label-width="400"
        :label="t('OngoingGameSettings.playerCardTags.label')"
        align="start"
        :label-description="t('OngoingGameSettings.playerCardTags.description')"
      >
        <NFlex vertical align="start">
          <NCheckbox v-model:checked="ogs.frontendSettings.playerCardTags.showPremadeTeamTag">
            {{ t('OngoingGameSettings.playerCardTags.tags.showPremadeTeamTag.label') }}
          </NCheckbox>
          <NCheckbox v-model:checked="ogs.frontendSettings.playerCardTags.showWinningStreakTag">
            {{ t('OngoingGameSettings.playerCardTags.tags.showWinningStreakTag.label') }}
          </NCheckbox>
          <NCheckbox v-model:checked="ogs.frontendSettings.playerCardTags.showLosingStreakTag">
            {{ t('OngoingGameSettings.playerCardTags.tags.showLosingStreakTag.label') }}
          </NCheckbox>
          <NCheckbox v-model:checked="ogs.frontendSettings.playerCardTags.showSoloKillsTag">
            {{
              t('OngoingGameSettings.playerCardTags.tags.showSoloKillsTag.label', {
                countV: ogs.settings.gameTimelineLoadCount
              })
            }}
          </NCheckbox>
          <NCheckbox v-model:checked="ogs.frontendSettings.playerCardTags.showSoloDeathsTag">
            {{
              t('OngoingGameSettings.playerCardTags.tags.showSoloDeathsTag.label', {
                countV: ogs.settings.gameTimelineLoadCount
              })
            }}
          </NCheckbox>
          <NCheckbox v-model:checked="ogs.frontendSettings.playerCardTags.showAverageTeamDamageTag">
            {{ t('OngoingGameSettings.playerCardTags.tags.showAverageTeamDamageTag.label') }}
          </NCheckbox>
          <NCheckbox
            v-model:checked="ogs.frontendSettings.playerCardTags.showAverageTeamDamageTakenTag"
          >
            {{ t('OngoingGameSettings.playerCardTags.tags.showAverageTeamDamageTakenTag.label') }}
          </NCheckbox>
          <NCheckbox
            v-model:checked="ogs.frontendSettings.playerCardTags.showSuspiciousFlashPositionTag"
          >
            {{ t('OngoingGameSettings.playerCardTags.tags.showSuspiciousFlashPositionTag.label') }}
          </NCheckbox>
          <NCheckbox v-model:checked="ogs.frontendSettings.playerCardTags.showAverageTeamGoldTag">
            {{ t('OngoingGameSettings.playerCardTags.tags.showAverageTeamGoldTag.label') }}
          </NCheckbox>
          <NCheckbox
            v-model:checked="ogs.frontendSettings.playerCardTags.showAverageDamageGoldEfficiencyTag"
          >
            {{
              t('OngoingGameSettings.playerCardTags.tags.showAverageDamageGoldEfficiencyTag.label')
            }}
          </NCheckbox>
          <NCheckbox v-model:checked="ogs.frontendSettings.playerCardTags.showGreatPerformanceTag">
            {{ t('OngoingGameSettings.playerCardTags.tags.showGreatPerformanceTag.label') }}
          </NCheckbox>
          <NCheckbox v-model:checked="ogs.frontendSettings.playerCardTags.showMetTag">
            {{ t('OngoingGameSettings.playerCardTags.tags.showMetTag.label') }}
          </NCheckbox>
          <NCheckbox v-model:checked="ogs.frontendSettings.playerCardTags.showTaggedTag">
            {{ t('OngoingGameSettings.playerCardTags.tags.showTaggedTag.label') }}
          </NCheckbox>
          <NCheckbox v-model:checked="ogs.frontendSettings.playerCardTags.showSelfTag">
            {{ t('OngoingGameSettings.playerCardTags.tags.showSelfTag.label') }}
          </NCheckbox>
          <NCheckbox v-model:checked="ogs.frontendSettings.playerCardTags.showWinRateTeamTag">
            {{ t('OngoingGameSettings.playerCardTags.tags.showWinRateTeamTag.label') }}
          </NCheckbox>
          <NCheckbox v-model:checked="ogs.frontendSettings.playerCardTags.showPrivacyTag">
            {{ t('OngoingGameSettings.playerCardTags.tags.showPrivacyTag.label') }}
          </NCheckbox>
          <NCheckbox
            v-model:checked="ogs.frontendSettings.playerCardTags.showAverageEnemyMissingPingsTag"
          >
            {{ t('OngoingGameSettings.playerCardTags.tags.showAverageEnemyMissingPingsTag.label') }}
          </NCheckbox>
          <NCheckbox
            v-model:checked="ogs.frontendSettings.playerCardTags.showAverageVisionScoreTag"
          >
            {{ t('OngoingGameSettings.playerCardTags.tags.showAverageVisionScoreTag.label') }}
          </NCheckbox>
          <NCheckbox
            v-if="as.settings.isInKyokoMode"
            v-model:checked="ogs.frontendSettings.playerCardTags.showAkariScoreTag"
          >
            {{ t('OngoingGameSettings.playerCardTags.tags.showAkariScoreTag.label') }}
          </NCheckbox>
        </NFlex>
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { useTranslation } from 'i18next-vue'
import {
  NCard,
  NCheckbox,
  NFlex,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NScrollbar,
  NSwitch
} from 'naive-ui'

const { t } = useTranslation()

const as = useAppCommonStore()
const ogs = useOngoingGameStore()
const og = useInstance(OngoingGameRenderer)
const sgps = useSgpStore()
</script>

<style lang="less" scoped>
.unsupported-sgp-server {
  color: rgb(230, 114, 41);
  font-weight: bold;
}
</style>
