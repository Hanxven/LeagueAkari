<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ '事件中心' }}</span>
    </template>
    <div class="button-group">
      <NButton
        :disabled="isLoading || !selectedEventIds.length || !lcs.isConnected"
        size="small"
        type="primary"
        secondary
        @click="claim"
      >
        <template v-if="selectedEventIds.length">领取选中 ({{ selectedEventIds.length }})</template>
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
        @click="updateClaimableEventHubEvents(true)"
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
import { computed, h, markRaw, onMounted, ref, shallowRef, watch } from 'vue'

import RewardItem from './RewardItem.vue'

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
    title: '事件名称',
    key: 'eventInfo.eventName'
  },
  {
    title: '可领取数量',
    key: 'eventInfo.unclaimedRewardCount'
  },
  {
    title: '可领取物品',
    key: 'rewardList',
    render: (row) => {
      if (cachedEventHubRewardGroups.value[row.eventId]) {
        return h(
          'div',
          {
            style: {
              display: 'flex',
              gap: '4px',
              flexWrap: 'wrap'
            }
          },
          cachedEventHubRewardGroups.value[row.eventId].map((reward) => {
            return h(RewardItem, {
              iconUrl: reward.thumbIconPath,
              name: reward.rewardName
            })
          })
        )
      } else {
        return h('div', '-')
      }
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
    selectedEventIds.value = []

    if (manually) {
      message.success(() => '已刷新')
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
    message.warning(() => t('Toolkit.misc.error', { reason: error.message }))
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
        message.success(() => `领取了 ${eventInfo.eventInfo.eventName}`)
      }
    }
  } catch (error: any) {
    message.warning(() => t('Toolkit.misc.error', { reason: error.message }))
  } finally {
    isLoading.value = false
    isClaiming.value = false
  }

  await sleep(500) // 可能会更新不及时, 这里在后面再刷新一次
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

.event-hub-item {
  display: flex;
  align-items: center;
  height: 48px;
  background-color: #0002;
}
</style>
