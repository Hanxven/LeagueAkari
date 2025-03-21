<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ t('EventHubClaimTool.title') }}</span>
    </template>
    <div class="hint">
      <span>{{ t('EventHubClaimTool.hint') }}</span>
    </div>
    <div class="button-group">
      <NButton
        :disabled="isLoading || !selectedEventIds.length || !lcs.isConnected"
        size="small"
        type="primary"
        secondary
        @click="claim"
      >
        <template v-if="selectedEventIds.length">{{
          t('EventHubClaimTool.claimButtonC', { countV: selectedEventIds.length })
        }}</template>
        <template v-else>
          {{ t('EventHubClaimTool.claimButton') }}
        </template>
      </NButton>
      <NButton
        v-show="isClaiming"
        size="small"
        type="warning"
        secondary
        @click="isClaiming = false"
      >
        {{ t('EventHubClaimTool.cancelButton') }}
      </NButton>
      <NButton
        :disabled="isLoading || !lcs.isConnected"
        size="small"
        secondary
        @click="updateClaimableEventHubEvents(true)"
      >
        {{ t('EventHubClaimTool.refreshButton') }}
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
      :data="events"
      :row-key="(row) => row.eventId"
      v-model:checked-row-keys="selectedEventIds"
      :max-height="600"
    ></NDataTable>
  </NCard>
</template>

<script lang="ts" setup>
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { EventHubEvents } from '@shared/types/league-client/event-hub'
import { sleep } from '@shared/utils/sleep'
import { useTranslation } from 'i18next-vue'
import { DataTableColumns, NButton, NCard, NDataTable, useMessage } from 'naive-ui'
import { computed, h, markRaw, ref, shallowRef, watch } from 'vue'

import ClaimableItem from './ClaimableItem.vue'

const REWARD_STATE_UNSELECTED = 'Unselected'

const { t } = useTranslation()

const lc = useInstance(LeagueClientRenderer)
const lcs = useLeagueClientStore()

const message = useMessage()

const isClaiming = ref(false)
const isLoading = ref(false)
const selectedEventIds = ref<string[]>([])
const cachedEventHubRewardGroups = ref<
  Record<
    string,
    {
      rewardGroupId: string
      rewardName: string
      thumbIconPath: string
    }[]
  >
>({})
const events = shallowRef<EventHubEvents[]>([])

const columns = computed<DataTableColumns<EventHubEvents>>(() => [
  {
    type: 'selection'
  },
  {
    title: () => t('EventHubClaimTool.columns.rewardList'),
    key: 'rewardList',
    render: (row) => {
      const items = (cachedEventHubRewardGroups.value[row.eventId] || []).map((reward) => {
        return {
          id: reward.rewardGroupId,
          iconUrl: reward.thumbIconPath,
          name: reward.rewardName
        }
      })

      return h(ClaimableItem, {
        title: row.eventInfo.eventName,
        items
      })
    }
  }
])

const updateClaimableEventHubEvents = async (manually = false) => {
  if (isLoading.value) {
    return
  }

  try {
    isLoading.value = true

    const { data } = await lc.api.eventHub.getEvents()
    events.value = data.filter((event) => event.eventInfo.unclaimedRewardCount)

    selectedEventIds.value = selectedEventIds.value.filter((id) =>
      events.value.some((event) => event.eventId === id)
    )

    if (manually) {
      message.success(() => t('EventHubClaimTool.refreshSuccess'))
    }

    if (!events.value.length) {
      return
    }

    const updateTrackItems = async (eventId: string) => {
      const { data: items1 } = await lc.api.eventHub.getRewardTrackItems(eventId)
      const { data: items2 } = await lc.api.eventHub.getRewardTrackBonusItems(eventId)

      const rewards = [...items1, ...items2]
        .map((item) => item.rewardOptions)
        .flat()
        .filter((reward) => reward.state === REWARD_STATE_UNSELECTED)
        .map((reward) => ({
          rewardGroupId: reward.rewardGroupId,
          rewardName: reward.rewardName,
          thumbIconPath: reward.thumbIconPath
        }))

      cachedEventHubRewardGroups.value[eventId] = markRaw(rewards)
    }

    Promise.allSettled(events.value.map((event) => updateTrackItems(event.eventId)))
  } catch (error: any) {
    message.warning(() => t('EventHubClaimTool.refreshFailed', { reason: error.message }))
  } finally {
    isLoading.value = false
  }
}

const claim = async () => {
  if (isLoading.value || !selectedEventIds.value.length) {
    return
  }

  try {
    isLoading.value = true
    isClaiming.value = true

    for (const eventId of selectedEventIds.value) {
      if (!isClaiming.value) {
        break
      }

      await lc.api.eventHub.postRewardTrackClaimAll(eventId)

      const eventInfo = events.value.find((event) => event.eventId === eventId)

      if (eventInfo) {
        message.success(() =>
          t('EventHubClaimTool.claimed', { item: eventInfo.eventInfo.eventName })
        )
      }
    }
  } catch (error: any) {
    message.warning(() => t('EventHubClaimTool.claimFailed', { reason: error.message }))
  } finally {
    isLoading.value = false
    isClaiming.value = false
  }

  await sleep(2000) // 可能会更新不及时, 这里在后面再刷新一次
  await updateClaimableEventHubEvents().catch(() => {})
}

watch(
  () => lcs.isConnected,
  (isConnected) => {
    if (isConnected) {
      updateClaimableEventHubEvents()
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
