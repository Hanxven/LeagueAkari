<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ t('MissionClaimTool.title') }}</span>
    </template>
    <div class="hint">
      <span>{{ t('MissionClaimTool.hint') }}</span>
    </div>
    <div class="button-group">
      <NButton
        :disabled="isLoading || !selectedMissionIds.length || !lcs.isConnected"
        size="small"
        type="primary"
        secondary
        @click="claim"
      >
        <template v-if="selectedMissionIds.length">{{
          t('MissionClaimTool.claimButtonC', { countV: selectedMissionIds.length })
        }}</template>
        <template v-else>
          {{ t('MissionClaimTool.claimButton') }}
        </template>
      </NButton>
      <NButton
        v-show="isClaiming"
        size="small"
        type="warning"
        secondary
        @click="isClaiming = false"
      >
        {{ t('MissionClaimTool.cancelButton') }}
      </NButton>
      <NButton
        :disabled="isLoading || !lcs.isConnected"
        size="small"
        secondary
        @click="updateClaimableMissions(true)"
      >
        {{ t('MissionClaimTool.refreshButton') }}
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
      :data="missions"
      :row-key="(row) => row.id"
      v-model:checked-row-keys="selectedMissionIds"
      :max-height="600"
    ></NDataTable>
  </NCard>
</template>

<script setup lang="ts">
import { useActivated } from '@renderer-shared/compositions/useActivated'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { Mission } from '@shared/types/league-client/missions'
import { ChoiceMaker } from '@shared/utils/choice-maker'
import { useTranslation } from 'i18next-vue'
import { DataTableColumns, NButton, NCard, NDataTable, useMessage } from 'naive-ui'
import { computed, h, ref, shallowRef, watch } from 'vue'

import ClaimableItem from './ClaimableItem.vue'

// 虽然是 SELECT_REWARDS, 但很多任务只是一个前置触发器
// 实际上的奖励领取是再此任务完成后, 自动触发的另一个任务
const TARGET_MISSION_STATUS = 'SELECT_REWARDS'

const { t } = useTranslation()

const lc = useInstance(LeagueClientRenderer)
const lcs = useLeagueClientStore()

const message = useMessage()

const isClaiming = ref(false)
const isLoading = ref(false)

const isActivated = useActivated()

const columns = computed<DataTableColumns<Mission>>(() => [
  {
    type: 'selection'
  },
  {
    title: () => t('MissionClaimTool.columns.rewardList'),
    key: 'rewardList',
    render: (row) => {
      const items = row.rewards.map((reward) => {
        return {
          id: reward.rewardGroup,
          iconUrl: reward.iconUrl,
          name: reward.description
        }
      })

      return h(ClaimableItem, {
        items,
        title: row.internalName
      })
    }
  }
])

const missions = shallowRef<Mission[]>([])
const selectedMissionIds = ref<string[]>([])

const updateClaimableMissions = async (manually = false) => {
  if (isLoading.value) {
    return
  }

  try {
    isLoading.value = true

    const { data } = await lc.api.missions.getMissions()
    missions.value = data.filter((mission) => mission.status === TARGET_MISSION_STATUS)

    selectedMissionIds.value = selectedMissionIds.value.filter((id) =>
      missions.value.some((mission) => mission.id === id)
    )

    if (manually) {
      message.success(() => t('MissionClaimTool.refreshSuccess'))
    }

    if (!missions.value.length) {
      return
    }
  } catch (error: any) {
    message.warning(() => t('MissionClaimTool.refreshFailed', { reason: error.message }))
  } finally {
    isLoading.value = false
  }
}

const claim = async () => {
  if (isLoading.value || !selectedMissionIds.value.length) {
    return
  }

  try {
    isLoading.value = true
    isClaiming.value = true

    for (const missionId of selectedMissionIds.value) {
      if (!isClaiming.value) {
        break
      }

      const mission = missions.value.find((mission) => mission.id === missionId)

      if (mission) {
        const rewards = mission.rewards

        const cm = new ChoiceMaker(Array(rewards.length).fill(1), rewards)
        const chosen = cm.choose(mission.rewardStrategy?.selectMaxGroupCount || 1)

        await lc.api.missions.putPlayerMission(mission.id, {
          rewardGroups: chosen.map((c) => c.rewardGroup)
        })

        message.success(() =>
          t('RewardClaimTool.claimed', {
            item: chosen.map((c) => c.description).join(', ')
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

lc.onLcuEventVue<Mission[]>('/lol-missions/v1/missions', ({ data }) => {
  missions.value = data.filter((mission) => mission.status === TARGET_MISSION_STATUS)
  selectedMissionIds.value = selectedMissionIds.value.filter((id) =>
    missions.value.some((mission) => mission.id === id)
  )
})

const shouldReload = computed(() => {
  return isActivated.value && lcs.isConnected
})

watch(
  () => shouldReload.value,
  (should) => {
    if (should) {
      updateClaimableMissions()
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
