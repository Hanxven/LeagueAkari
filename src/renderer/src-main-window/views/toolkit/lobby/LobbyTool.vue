<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ t('LobbyTool.title') }}</span>
    </template>
    <ControlItem
      class="control-item-margin"
      :label="t('LobbyTool.addBot.label')"
      :label-description="t('LobbyTool.addBot.description')"
      :label-width="260"
    >
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
        <NSelect
          style="width: 140px"
          size="small"
          :consistent-menu-width="false"
          v-model:value="botSettings.championId"
          @update:show="handleLoadAvailableBots"
          :options="availableBotOptions"
        ></NSelect>
        <NSelect
          style="width: 80px"
          size="small"
          :consistent-menu-width="false"
          v-model:value="botSettings.difficulty"
          :options="difficultyOptions"
        ></NSelect>
        <NSelect
          style="width: 100px"
          size="small"
          :consistent-menu-width="false"
          v-model:value="botSettings.team"
          :options="teamOptions"
        ></NSelect>
        <NButton :disabled="lcs.gameflow.phase !== 'Lobby'" @click="handleAddBot" size="small">{{
          t('LobbyTool.addBot.button')
        }}</NButton>
      </div>
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      :label="t('LobbyTool.createIdLobby.label')"
      :label-description="t('LobbyTool.createIdLobby.description')"
      :label-width="260"
    >
      <div style="display: flex; align-items: center; gap: 8px">
        <NSelect
          :placeholder="t('LobbyTool.createIdLobby.selectPlaceholder')"
          style="width: 180px"
          @update:show="handleLoadEligibleQueues"
          size="small"
          filterable
          :consistent-menu-width="false"
          tag
          v-model:value="queueLobbySettings.queueId"
          :options="queueOptions"
        ></NSelect>
        <NButton
          :disabled="
            lcs.connectionState !== 'connected' ||
            queueLobbySettings.queueId === null ||
            Number.isNaN(Number(queueLobbySettings.queueId))
          "
          @click="handleCreateQueueLobby"
          size="small"
          >{{ t('LobbyTool.createIdLobby.button') }}</NButton
        >
      </div>
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      :label="t('LobbyTool.create5x5PracticeLobby.label')"
      :label-width="260"
    >
      <NFlex>
        <NButton
          @click="handleCreatePractice5v5"
          size="small"
          :disabled="lcs.connectionState !== 'connected'"
          :loading="isCreatingPractice5v5"
          >{{ t('LobbyTool.create5x5PracticeLobby.button') }}</NButton
        >
        <NInput
          :status="practice5v5LobbyName.length ? 'success' : 'warning'"
          v-model:value="practice5v5LobbyName"
          @keyup.enter="handleCreatePractice5v5"
          style="width: 180px"
          size="small"
        />
      </NFlex>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { AvailableBot, QueueEligibility } from '@shared/types/league-client/lobby'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NFlex, NInput, NSelect, useMessage, useNotification } from 'naive-ui'
import { computed, reactive, ref, shallowRef } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const lc = useInstance(LeagueClientRenderer)

const notification = useNotification()

const getRandomLobbyName = () => {
  return `AKARI_${(Date.now() % 10000000) + 10000000}`
}

const practice5v5LobbyName = ref(getRandomLobbyName())
const isCreatingPractice5v5 = ref(false)
const handleCreatePractice5v5 = async () => {
  if (isCreatingPractice5v5.value) {
    return
  }

  isCreatingPractice5v5.value = true

  try {
    if (!practice5v5LobbyName.value) {
      practice5v5LobbyName.value = getRandomLobbyName()
    }

    await lc.api.lobby.createPractice5x5(practice5v5LobbyName.value)
    practice5v5LobbyName.value = getRandomLobbyName()
  } catch (error) {
    notification.warning({
      title: () => t('LobbyTool.create5x5PracticeLobby.failedNotification.title'),
      content: () =>
        t('LobbyTool.create5x5PracticeLobby.failedNotification.description', {
          reason: (error as Error).message
        })
    })
  } finally {
    isCreatingPractice5v5.value = false
  }
}

const handleAddBot = async () => {
  if (!botSettings.championId) {
    return
  }
  try {
    await lc.api.lobby.addBot(botSettings.difficulty, botSettings.championId, botSettings.team)
  } catch (error) {
    notification.warning({
      title: () => t('LobbyTool.addBot.failedNotification.title'),
      content: () =>
        t('LobbyTool.addBot.failedNotification.description', {
          reason: (error as Error).message
        })
    })
  }
}

const eligiblePartyQueues = shallowRef<QueueEligibility[]>([])
const eligibleSelfQueues = shallowRef<QueueEligibility[]>([])

const handleLoadEligibleQueues = async (show: boolean) => {
  if (show && lcs.connectionState === 'connected') {
    try {
      const { data: d1 } = await lc.api.lobby.getEligiblePartyQueues()
      const { data: d2 } = await lc.api.lobby.getEligibleSelfQueues()

      eligiblePartyQueues.value = d1
      eligibleSelfQueues.value = d2
    } catch (error) {
      notification.warning({
        title: () => t('LobbyTool.loadEligibleQueuesFailedNotification.title'),
        content: () =>
          t('LobbyTool.loadEligibleQueuesFailedNotification.description', {
            reason: (error as Error).message
          })
      })
    }
  }
}

const queueOptions = computed(() => {
  if (lcs.gameData.queues === null) {
    return []
  }

  const eligiblePartyMap = new Map(eligiblePartyQueues.value.map((q) => [q.queueId, q]))
  const eligibleSelfMap = new Map(eligibleSelfQueues.value.map((q) => [q.queueId, q]))

  const availableQueues: number[] = []
  const unavailableQueues: number[] = []

  for (const v of Object.values(lcs.gameData.queues)) {
    if (eligiblePartyMap.has(v.id) && eligibleSelfMap.has(v.id)) {
      availableQueues.push(v.id)
    } else {
      unavailableQueues.push(v.id)
    }
  }

  const options: any[] = []

  if (availableQueues.length > 0) {
    options.push({
      key: 'akari',
      label: t('LobbyTool.queueOptions.available'),
      type: 'group',
      children: availableQueues.map((k) => ({
        value: k,
        label: `${lcs.gameData.queues[k].name} (${k})`
      }))
    })
  }

  if (unavailableQueues.length > 0) {
    options.push({
      key: 'kyoko',
      label: t('LobbyTool.queueOptions.unavailable'),
      type: 'group',
      children: unavailableQueues.map((k) => ({
        value: k,
        label: `${lcs.gameData.queues[k].name} (${k})`
      }))
    })
  }

  return options
})

const availableBots = shallowRef<AvailableBot[] | null>(null)

const availableBotOptions = computed(() => {
  if (availableBots.value === null) {
    return []
  }

  const sorted = availableBots.value.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))

  // TODO 分组
  return sorted
    .filter((b) => b.id !== 0)
    .map((b) => ({
      value: b.id,
      label: b.name
    }))
})

const difficultyOptions = computed(() => {
  return [
    {
      value: 'RSINTRO',
      label: t('LobbyTool.difficultyOptions.RSINTRO')
    },
    {
      value: 'RSBEGINNER',
      label: t('LobbyTool.difficultyOptions.RSBEGINNER')
    },
    {
      value: 'RSINTERMEDIATE',
      label: t('LobbyTool.difficultyOptions.RSINTERMEDIATE')
    }
  ]
})

const positionOptions = computed(() => {
  return [
    {
      value: 'TOP',
      label: t('common.lanes.TOP')
    },
    {
      value: 'JUNGLE',
      label: t('common.lanes.JUNGLE')
    },
    {
      value: 'MIDDLE',
      label: t('common.lanes.MIDDLE')
    },
    {
      value: 'BOTTOM',
      label: t('common.lanes.BOTTOM')
    },
    {
      value: 'UTILITY',
      label: t('common.lanes.UTILITY')
    }
  ]
})

const teamOptions = computed(() => {
  return [
    {
      value: '100',
      label: t('common.teams.100')
    },
    {
      value: '200',
      label: t('common.teams.200')
    }
  ]
})

const botSettings = reactive({
  difficulty: 'RSINTERMEDIATE',
  team: '100' as '100' | '200',
  championId: null
})

const queueLobbySettings = reactive({
  queueId: null as number | null
})

const handleCreateQueueLobby = async () => {
  if (!queueLobbySettings.queueId) {
    return
  }

  try {
    await lc.api.lobby.createQueueLobby(queueLobbySettings.queueId)
  } catch (error) {
    notification.warning({
      title: () => t('LobbyTool.createIdLobby.failedNotification.title'),
      content: () =>
        t('LobbyTool.createIdLobby.failedNotification.description', {
          reason: (error as Error).message
        })
    })
  }
}

// 每次启动只提示一次
let acknowledged = false
const message = useMessage()
const handleLoadAvailableBots = async (show: boolean) => {
  if (show && lcs.connectionState === 'connected') {
    try {
      const bots = (await lc.api.lobby.getAvailableBots()).data
      availableBots.value = bots

      if (!acknowledged && bots.length === 0) {
        message.info(t('LobbyTool.loadBots.firstUseNote'), {
          closable: true,
          duration: 5000
        })
        acknowledged = true
      }
    } catch (error) {
      notification.warning({
        title: () => t('LobbyTool.loadBots.failedNotification.title'),
        content: () =>
          t('LobbyTool.loadBots.failedNotification.description', {
            reason: (error as Error).message
          })
      })
    }
  }
}
</script>

<style lang="less" scoped></style>
