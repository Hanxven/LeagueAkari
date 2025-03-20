<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ '领取' }}</span>
    </template>
    <div class="button-group">
      <NButton
        :disabled="isLoading || !selectedGrantIds.length || !lcs.isConnected"
        size="small"
        type="primary"
        secondary
        @click="claim"
      >
        <template v-if="selectedGrantIds.length">领取选中 ({{ selectedGrantIds.length }})</template>
        <template v-else>领取选中</template>
      </NButton>
      <NButton
        v-show="isClaiming"
        size="small"
        type="warning"
        secondary
        @click="isClaiming = false"
      >
        取消
      </NButton>
      <NButton
        :disabled="isLoading || !lcs.isConnected"
        size="small"
        secondary
        @click="updateClaimableRewardGrants(true)"
      >
        刷新
      </NButton>
    </div>
    <NDataTable
      :theme-overrides="{
        thColor: '#0005',
        tdColor: '#0004'
      }"
      :loading="isLoading"
      size="small"
      :single-line="false"
      :columns="columns"
      :data="grants"
      :row-key="(row) => row.info.id"
      v-model:checked-row-keys="selectedGrantIds"
      :max-height="600"
    ></NDataTable>
  </NCard>
</template>

<script lang="ts" setup>
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { RewardsGrant } from '@shared/types/league-client/rewards'
import { ChoiceMaker } from '@shared/utils/choice-maker'
import { sleep } from '@shared/utils/sleep'
import { useTranslation } from 'i18next-vue'
import { DataTableColumns, NButton, NCard, NDataTable, useMessage } from 'naive-ui'
import { computed, h, ref, shallowRef, watch } from 'vue'

import RewardItem from './RewardItem.vue'

const TARGET_REWARD_GRANT_STATUS = 'PENDING_SELECTION'

const { t } = useTranslation()

const lc = useInstance(LeagueClientRenderer)
const lcs = useLeagueClientStore()

const message = useMessage()

const isLoading = ref(false)
const isClaiming = ref(false)
const selectedGrantIds = ref<string[]>([])
const grants = shallowRef<RewardsGrant[]>([])

const columns = computed<DataTableColumns<RewardsGrant>>(() => [
  {
    type: 'selection'
  },
  {
    title: '奖励名称',
    key: 'rewardGroup.localizations.title'
  },
  {
    title: '可领取物品',
    key: 'rewardList',
    render: (row) => {
      return h(
        'div',
        { class: 'reward-list' },
        row.rewardGroup.rewards.map((reward) => {
          return h(RewardItem, {
            iconUrl: reward.media.iconUrl,
            name: reward.localizations.title
          })
        })
      )
    }
  }
])

const updateClaimableRewardGrants = async (manually = false) => {
  if (isLoading.value) {
    return
  }

  try {
    isLoading.value = true

    const { data } = await lc.api.rewards.getGrants(TARGET_REWARD_GRANT_STATUS)
    grants.value = data
    selectedGrantIds.value = []

    if (manually) {
      message.success(() => '已刷新')
    }
  } catch (error: any) {
    message.warning(() => t('Toolkit.misc.error', { reason: error.message }))
  } finally {
    isLoading.value = false
  }
}

const claim = async () => {
  if (isLoading.value || !selectedGrantIds.value.length) {
    return
  }

  try {
    isLoading.value = true
    isClaiming.value = true

    for (const grantId of selectedGrantIds.value) {
      if (!isClaiming.value) {
        break
      }

      const grant = grants.value.find((grant) => grant.info.id === grantId)

      if (grant) {
        const rewards = grant.rewardGroup.rewards

        const cm = new ChoiceMaker(Array(rewards.length).fill(1), rewards)
        const chosen = cm.choose(
          grant.rewardGroup.selectionStrategyConfig?.maxSelectionsAllowed || 1
        )

        await lc.api.rewards.postGrantSelection(grant.info.id, {
          grantId: grant.info.id,
          rewardGroupId: grant.rewardGroup.id,
          selections: chosen.map((c) => c.id)
        })

        message.success(() => `领取了 ${chosen.map((c) => c.localizations.title).join(', ')}`)
      }
    }
  } catch (error: any) {
    message.warning(() => t('Toolkit.misc.error', { reason: error.message }))
  } finally {
    isLoading.value = false
    isClaiming.value = false
  }

  await sleep(500)
  await updateClaimableRewardGrants().catch(() => {})
}

watch(
  () => lcs.isConnected,
  (isConnected) => {
    if (isConnected) {
      updateClaimableRewardGrants()
    }
  },
  { immediate: true }
)
</script>

<style lang="less" scoped>
.button-group {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.event-hub-item {
  display: flex;
  align-items: center;
  height: 48px;
  background-color: #0002;
}
</style>
