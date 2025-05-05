<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper" ref="el">
      <div class="inner-wrapper">
        <NCard size="small">
          <template #header>
            <span class="card-header-title">{{ t('AutoGameflow.title') }}</span>
          </template>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoGameflow.autoAcceptEnabled.label')"
            :label-description="t('AutoGameflow.autoAcceptEnabled.description')"
            :label-width="260"
          >
            <NSwitch
              :value="store.settings.autoAcceptEnabled"
              @update:value="(val) => shard.setAutoAcceptEnabled(val)"
              size="small"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoGameflow.autoAcceptDelaySeconds.label')"
            :label-description="t('AutoGameflow.autoAcceptDelaySeconds.description')"
            :label-width="260"
          >
            <NInputNumber
              style="width: 100px"
              :value="store.settings.autoAcceptDelaySeconds"
              @update:value="(value) => shard.setAutoAcceptDelaySeconds(value || 0)"
              :min="0"
              :max="10"
              size="small"
            />
          </ControlItem>
          <div class="divider"></div>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoGameflow.autoHonorEnabled.label')"
            :label-description="t('AutoGameflow.autoHonorEnabled.description')"
            :label-width="260"
          >
            <NSwitch
              :value="store.settings.autoHonorEnabled"
              @update:value="(val) => shard.setAutoHonorEnabled(val)"
              size="small"
            />
          </ControlItem>
          <div class="divider"></div>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoGameflow.playAgainEnabled.label')"
            :label-width="260"
          >
            <template #labelDescription>
              {{ t('AutoGameflow.playAgainEnabled.description.part1') }}
              <span
                style="font-weight: bold; cursor: pointer"
                @click="() => shard.setAutoHonorEnabled(true)"
              >
                {{ t('AutoGameflow.playAgainEnabled.description.part2') }}</span
              >
              {{ t('AutoGameflow.playAgainEnabled.description.part3') }}
            </template>
            <NSwitch
              :value="store.settings.playAgainEnabled"
              @update:value="(val) => shard.setPlayAgainEnabled(val)"
              size="small"
            />
          </ControlItem>
          <div class="divider"></div>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoGameflow.autoMatchmakingEnabled.label')"
            :label-description="t('AutoGameflow.autoMatchmakingEnabled.description')"
            :label-width="260"
          >
            <NSwitch
              :value="store.settings.autoMatchmakingEnabled"
              @update:value="(val) => shard.setAutoMatchmakingEnabled(val)"
              size="small"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoGameflow.autoMatchmakingMinimumMembers.label')"
            :label-description="
              t('AutoGameflow.autoMatchmakingMinimumMembers.description', {
                members: store.settings.autoMatchmakingMinimumMembers
              })
            "
            :label-width="260"
          >
            <NInputNumber
              :value="store.settings.autoMatchmakingMinimumMembers"
              @update:value="(val) => shard.setAutoMatchmakingMinimumMembers(val || 1)"
              :min="1"
              :max="99"
              size="small"
              style="width: 100px"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoGameflow.autoMatchmakingDelaySeconds.label')"
            :label-description="t('AutoGameflow.autoMatchmakingDelaySeconds.description')"
            :label-width="260"
          >
            <NInputNumber
              style="width: 100px"
              :value="store.settings.autoMatchmakingDelaySeconds"
              @update:value="(value) => shard.setAutoMatchmakingDelaySeconds(value || 0)"
              placeholder="秒"
              :min="0"
              size="small"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoGameflow.autoMatchmakingWaitForInvitees.label')"
            :label-description="t('AutoGameflow.autoMatchmakingWaitForInvitees.description')"
            :label-width="260"
          >
            <NSwitch
              :value="store.settings.autoMatchmakingWaitForInvitees"
              @update:value="(val) => shard.setAutoMatchmakingWaitForInvitees(val)"
              size="small"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoGameflow.autoMatchmakingRematchStrategy.label')"
            :label-description="t('AutoGameflow.autoMatchmakingRematchStrategy.description')"
            :label-width="260"
          >
            <NRadioGroup
              :value="store.settings.autoMatchmakingRematchStrategy"
              @update:value="(s) => shard.setAutoMatchmakingRematchStrategy(s)"
              size="small"
            >
              <NFlex>
                <NRadio value="never">{{
                  t('AutoGameflow.autoMatchmakingRematchStrategy.options.never')
                }}</NRadio>
                <NRadio value="fixed-duration">{{
                  t('AutoGameflow.autoMatchmakingRematchStrategy.options.fixed-duration')
                }}</NRadio>
                <NRadio value="estimated-duration">{{
                  t('AutoGameflow.autoMatchmakingRematchStrategy.options.estimated-duration')
                }}</NRadio>
              </NFlex>
            </NRadioGroup>
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoGameflow.autoMatchmakingRematchFixedDuration.label')"
            :label-description="
              store.settings.autoMatchmakingRematchStrategy !== 'fixed-duration'
                ? t(
                    'AutoGameflow.autoMatchmakingRematchFixedDuration.description.no-fixed-duration'
                  )
                : t('AutoGameflow.autoMatchmakingRematchFixedDuration.description.fixed-duration')
            "
            :disabled="store.settings.autoMatchmakingRematchStrategy !== 'fixed-duration'"
            :label-width="260"
          >
            <NInputNumber
              :disabled="store.settings.autoMatchmakingRematchStrategy !== 'fixed-duration'"
              style="width: 100px"
              :value="store.settings.autoMatchmakingRematchFixedDuration"
              @update:value="(value) => shard.setAutoMatchmakingRematchFixedDuration(value || 2)"
              :min="1"
              size="small"
            />
          </ControlItem>
          <div class="divider"></div>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoGameflow.autoReconnectEnabled.label')"
            :label-description="t('AutoGameflow.autoReconnectEnabled.description')"
            :label-width="260"
          >
            <NSwitch
              :value="store.settings.autoReconnectEnabled"
              @update:value="(val) => shard.setAutoReconnectEnabled(val)"
              size="small"
            />
          </ControlItem>
          <div class="divider"></div>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoGameflow.autoSkipLeaderEnabled.label')"
            :label-description="t('AutoGameflow.autoSkipLeaderEnabled.description')"
            :label-width="260"
          >
            <NSwitch
              :value="store.settings.autoSkipLeaderEnabled"
              @update:value="(val) => shard.setAutoSkipLeaderEnabled(val)"
              size="small"
            />
          </ControlItem>
          <div class="divider"></div>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoGameflow.autoHandleInvitationsEnabled.label')"
            :label-description="t('AutoGameflow.autoHandleInvitationsEnabled.description')"
            :label-width="260"
          >
            <NSwitch
              :value="store.settings.autoHandleInvitationsEnabled"
              @update:value="(val) => shard.setAutoHandleInvitationsEnabled(val)"
              size="small"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoGameflow.rejectInvitationWhenAway.label')"
            :label-description="t('AutoGameflow.rejectInvitationWhenAway.description')"
            :label-width="260"
          >
            <NSwitch
              :value="store.settings.rejectInvitationWhenAway"
              @update:value="(val) => shard.setRejectInvitationWhenAway(val)"
              size="small"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoGameflow.invitationHandlingStrategies.label')"
            :label-description="t('AutoGameflow.invitationHandlingStrategies.description')"
            :label-width="260"
          >
            <NFlex vertical align="flex-start">
              <table>
                <tbody>
                  <tr v-for="s of invitationStrategiesArray" :key="s.queueType">
                    <td
                      style="
                        font-size: 13px;
                        font-weight: bold;
                        text-overflow: ellipsis;
                        overflow: hidden;
                        white-space: nowrap;
                        padding: 4px 16px 4px 0;
                      "
                    >
                      {{ queueTypes[s.queueType]?.label || s.queueType }}
                    </td>
                    <td>
                      <NRadioGroup
                        :value="s.strategy"
                        @update:value="(val) => handleChangeInvitationStrategy(s.queueType, val)"
                      >
                        <NRadio value="accept">{{
                          t('AutoGameflow.invitationHandlingStrategies.options.accept')
                        }}</NRadio>
                        <NRadio value="decline">{{
                          t('AutoGameflow.invitationHandlingStrategies.options.decline')
                        }}</NRadio>
                        <NRadio value="ignore">{{
                          t('AutoGameflow.invitationHandlingStrategies.options.ignore')
                        }}</NRadio>
                      </NRadioGroup>
                    </td>
                  </tr>
                </tbody>
              </table>
              <NPopselect
                :options="queueTypeOptions"
                multiple
                trigger="click"
                :value="invitationStrategiesPopselectArray"
                @update:value="handleChangeInvitationStrategies"
              >
                <NButton size="tiny" type="primary">{{
                  t('AutoGameflow.invitationHandlingStrategies.button')
                }}</NButton>
              </NPopselect>
            </NFlex>
          </ControlItem>
        </NCard>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoGameflowRenderer } from '@renderer-shared/shards/auto-gameflow'
import { useAutoGameflowStore } from '@renderer-shared/shards/auto-gameflow/store'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NCard,
  NFlex,
  NInputNumber,
  NPopselect,
  NRadio,
  NRadioGroup,
  NScrollbar,
  NSwitch
} from 'naive-ui'
import { computed } from 'vue'

const store = useAutoGameflowStore()
const shard = useInstance(AutoGameflowRenderer)

const invitationStrategiesPopselectArray = computed(() => {
  return Object.keys(store.settings.invitationHandlingStrategies)
})

const handleChangeInvitationStrategies = (value: string[]) => {
  const newStrategies: Record<string, string> = {}

  for (const strategy of value) {
    if (store.settings.invitationHandlingStrategies[strategy]) {
      newStrategies[strategy] = store.settings.invitationHandlingStrategies[strategy]
    } else {
      newStrategies[strategy] = 'ignore'
    }
  }

  shard.setInvitationHandlingStrategies(newStrategies)
}

const { t } = useTranslation()

const queueTypes = computed(() => {
  return {
    '<DEFAULT>': {
      label: t('AutoGameflow.invitationHandlingStrategies.queueTypes.default'),
      order: 0
    },
    RANKED_SOLO_5x5: {
      label: t('common.queueTypes.RANKED_SOLO_5x5'),
      order: 100
    },
    RANKED_FLEX_SR: {
      label: t('common.queueTypes.RANKED_FLEX_SR'),
      order: 110
    },
    NORMAL: {
      label: t('common.queueTypes.NORMAL'),
      order: 200
    },
    ARAM_UNRANKED_5x5: {
      label: t('common.queueTypes.ARAM_UNRANKED_5x5'),
      order: 300
    },
    CHERRY: {
      label: t('common.queueTypes.CHERRY'),
      order: 400
    },
    URF: {
      label: t('common.queueTypes.URF'),
      order: 500
    },
    NORMAL_TFT: {
      label: t('common.queueTypes.NORMAL_TFT'),
      order: 600
    },
    RANKED_TFT: {
      label: t('common.queueTypes.RANKED_TFT'),
      order: 610
    },
    RANKED_TFT_TURBO: {
      label: t('common.queueTypes.RANKED_TFT_TURBO'),
      order: 620
    },
    RANKED_TFT_DOUBLE_UP: {
      label: t('common.queueTypes.RANKED_TFT_DOUBLE_UP'),
      order: 630
    }
  }
})

const invitationStrategiesArray = computed(() => {
  return Object.entries(store.settings.invitationHandlingStrategies)
    .map(([queueType, strategy]) => {
      return {
        queueType,
        strategy
      }
    })
    .toSorted((a, b) => {
      const aQueueTypeOrder = queueTypes[a.queueType] ? queueTypes[a.queueType].order : 0
      const bQueueTypeOrder = queueTypes[b.queueType] ? queueTypes[b.queueType].order : 0

      return aQueueTypeOrder - bQueueTypeOrder
    })
})

const queueTypeOptions = computed(() => {
  return Object.keys(queueTypes.value)
    .map((key) => {
      return {
        value: key,
        label: queueTypes.value[key].label
      }
    })
    .toSorted((a, b) => {
      return queueTypes.value[a.value].order - queueTypes.value[b.value].order
    })
})

const handleChangeInvitationStrategy = (queueType: string, strategy: string) => {
  const newObj = { ...store.settings.invitationHandlingStrategies }
  newObj[queueType] = strategy
  shard.setInvitationHandlingStrategies(newObj)
}
</script>

<style lang="less" scoped>
@import './automation-styles.less';

.divider {
  margin-top: 12px;
  margin-bottom: 12px;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.084);
}
</style>
