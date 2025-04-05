<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ t('RewardClaimTool.title') }}</span>
    </template>
    <div class="hint">
      <span>{{ t('RewardClaimTool.hint') }}</span>
    </div>
    <div class="button-group">
      <NButton
        :disabled="isLoading || !selectedGrantIds.length || !lcs.isConnected"
        size="small"
        type="primary"
        secondary
        @click="claim"
      >
        <template v-if="selectedGrantIds.length">
          {{ t('RewardClaimTool.claimButtonC', { countV: selectedGrantIds.length }) }}
        </template>
        <template v-else>
          {{ t('RewardClaimTool.claimButton') }}
        </template>
      </NButton>
      <NButton
        v-show="isClaiming"
        size="small"
        type="warning"
        secondary
        @click="isClaiming = false"
      >
        {{ t('RewardClaimTool.cancelButton') }}
      </NButton>
      <NButton
        :disabled="isLoading || !lcs.isConnected"
        size="small"
        secondary
        @click="updateClaimableRewardGrants(true)"
      >
        {{ t('RewardClaimTool.refreshButton') }}
      </NButton>
    </div>
    <NDataTable
      :theme-overrides="{
        thColor: '#0005',
        tdColor: '#0004'
      }"
      :loading="isLoading"
      size="small"
      :columns="columns"
      :data="grants"
      :row-key="(row) => row.info.id"
      v-model:checked-row-keys="selectedGrantIds"
      :max-height="600"
    ></NDataTable>
  </NCard>
</template>

<script lang="ts" setup>
import { useActivated } from '@renderer-shared/compositions/useActivated'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { RewardsGrant } from '@shared/types/league-client/rewards'
import { ChoiceMaker } from '@shared/utils/choice-maker'
import { useTranslation } from 'i18next-vue'
import { DataTableColumns, NButton, NCard, NDataTable, useMessage } from 'naive-ui'
import { computed, h, ref, shallowRef, watch } from 'vue'

import ClaimableItem from './ClaimableItem.vue'

const TARGET_REWARD_GRANT_STATUS = 'PENDING_SELECTION'

const { t } = useTranslation()

const lc = useInstance(LeagueClientRenderer)
const lcs = useLeagueClientStore()

const message = useMessage()

const isLoading = ref(false)
const isClaiming = ref(false)
const selectedGrantIds = ref<string[]>([])
const grants = shallowRef<RewardsGrant[]>([])

const isActivated = useActivated()

const columns = computed<DataTableColumns<RewardsGrant>>(() => [
  {
    type: 'selection'
  },

  {
    title: () => t('RewardClaimTool.columns.rewardList'),
    key: 'rewardList',
    render: (row) => {
      const items = row.rewardGroup.rewards.map((reward) => {
        return {
          id: reward.id,
          iconUrl: reward.media.iconUrl,
          name: reward.localizations.title
        }
      })

      return h(ClaimableItem, {
        items,
        title: row.rewardGroup.localizations.title
      })
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

    selectedGrantIds.value = selectedGrantIds.value.filter((id) =>
      data.some((grant) => grant.info.id === id)
    )

    if (manually) {
      message.success(() => t('RewardClaimTool.refreshSuccess'))
    }
  } catch (error: any) {
    message.warning(() => t('RewardClaimTool.refreshFailed', { reason: error.message }))
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

        message.success(() =>
          t('RewardClaimTool.claimed', {
            item: chosen.map((c) => c.localizations.title).join(', ')
          })
        )
      }
    }
  } catch (error: any) {
    message.warning(() => t('RewardClaimTool.claimFailed', { reason: error.message }))
  } finally {
    isLoading.value = false
    isClaiming.value = false
  }
}

lc.onLcuEventVue<RewardsGrant[]>('/lol-rewards/v1/grants', ({ data }) => {
  grants.value = data.filter((grant) => grant.info.status === TARGET_REWARD_GRANT_STATUS)
  selectedGrantIds.value = selectedGrantIds.value.filter((id) =>
    grants.value.some((grant) => grant.info.id === id)
  )
})

const shouldReload = computed(() => {
  return isActivated.value && lcs.isConnected
})

watch(
  () => shouldReload.value,
  (should) => {
    if (should) {
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

.hint {
  color: #fff8;
  font-style: italic;
  font-size: 13px;
  margin-bottom: 12px;
}
</style>
