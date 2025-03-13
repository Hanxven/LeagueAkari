<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ t('FakeRanked.title') }}</span>
    </template>
    <ControlItem
      class="control-item-margin"
      :label="t('FakeRanked.set.label')"
      :label-description="t('FakeRanked.set.description')"
      :label-width="260"
    >
      <NButton
        size="small"
        type="primary"
        :disabled="lcs.connectionState !== 'connected'"
        @click="() => handleSet()"
        >{{ t('FakeRanked.set.button') }}</NButton
      >
    </ControlItem>
    <ControlItem class="control-item-margin" :label="t('FakeRanked.queue')" :label-width="260">
      <NSelect
        :options="queueOptions"
        style="width: 180px"
        v-model:value="state.queue"
        size="small"
      ></NSelect>
    </ControlItem>
    <ControlItem class="control-item-margin" :label="t('FakeRanked.tier')" :label-width="260">
      <NSelect
        :options="tierOptions"
        style="width: 180px"
        v-model:value="state.tier"
        size="small"
      ></NSelect>
    </ControlItem>
    <ControlItem class="control-item-margin" :label="t('FakeRanked.division')" :label-width="260">
      <NSelect
        :options="divisionOptions"
        :disabled="
          state.tier === 'MASTER' || state.tier === 'GRANDMASTER' || state.tier === 'CHALLENGER'
        "
        style="width: 180px"
        v-model:value="state.division"
        size="small"
      ></NSelect>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NSelect, useMessage, useNotification } from 'naive-ui'
import { computed, reactive } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const lc = useInstance(LeagueClientRenderer)

const notification = useNotification()

const state = reactive({
  queue: 'RANKED_SOLO_5x5',
  tier: 'CHALLENGER',
  division: 'I'
})

const message = useMessage()

const handleSet = async () => {
  try {
    await lc.api.chat.changeRanked(
      state.queue,
      state.tier,
      state.tier === 'MASTER' || state.tier === 'GRANDMASTER' || state.tier === 'CHALLENGER'
        ? undefined
        : state.division
    )
    message.success(t('FakeRanked.commonSuccess'), { duration: 1000 })
  } catch (error) {
    notification.warning({
      title: () => t('FakeRanked.set.failedNotification.title'),
      content: () =>
        t('FakeRanked.set.failedNotification.description', {
          reason: (error as Error).message
        })
    })
  }
}

const tierOptions = computed(() => {
  return [
    {
      label: t('common.tiers.IRON'),
      value: 'IRON'
    },
    {
      label: t('common.tiers.BRONZE'),
      value: 'BRONZE'
    },
    {
      label: t('common.tiers.SILVER'),
      value: 'SILVER'
    },
    {
      label: t('common.tiers.GOLD'),
      value: 'GOLD'
    },
    {
      label: t('common.tiers.PLATINUM'),
      value: 'PLATINUM'
    },
    {
      label: t('common.tiers.EMERALD'),
      value: 'EMERALD'
    },
    {
      label: t('common.tiers.DIAMOND'),
      value: 'DIAMOND'
    },
    {
      label: t('common.tiers.MASTER'),
      value: 'MASTER'
    },
    {
      label: t('common.tiers.GRANDMASTER'),
      value: 'GRANDMASTER'
    },
    {
      label: t('common.tiers.CHALLENGER'),
      value: 'CHALLENGER'
    }
  ]
})

const divisionOptions = [
  {
    label: 'I',
    value: 'I'
  },
  {
    label: 'II',
    value: 'II'
  },
  {
    label: 'III',
    value: 'III'
  },
  {
    label: 'IV',
    value: 'IV'
  }
]

const queueOptions = computed(() => {
  return [
    {
      label: t('common.queueTypes.RANKED_SOLO_5x5'),
      value: 'RANKED_SOLO_5x5'
    },
    {
      label: t('common.queueTypes.RANKED_FLEX_SR'),
      value: 'RANKED_FLEX_SR'
    },
    {
      label: t('common.queueTypes.RANKED_TFT'),
      value: 'RANKED_TFT'
    },
    {
      label: t('common.queueTypes.RANKED_FLEX_TT'),
      value: 'RANKED_FLEX_TT'
    },
    {
      label: t('common.queueTypes.CHERRY'),
      value: 'CHERRY'
    },
    {
      label: t('common.queueTypes.RANKED_TFT_TURBO'),
      value: 'RANKED_TFT_TURBO'
    },
    {
      label: t('common.queueTypes.RANKED_TFT_DOUBLE_UP'),
      value: 'RANKED_TFT_DOUBLE_UP'
    }
  ]
})
</script>

<style lang="less" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
