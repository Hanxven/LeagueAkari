<template>
  <NCard size="small">
    <template #header><span class="card-header-title">房间工具</span></template>
    <ControlItem
      class="control-item-margin"
      label="添加人机"
      label-description="在当前自定义或训练房间中添加人机"
    >
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
        <NSelect
          style="width: 140px"
          size="tiny"
          v-model:value="botSettings.championId"
          @update:show="handleLoadAvailableBots"
          :options="availableBotOptions"
        ></NSelect>
        <NSelect
          style="width: 80px"
          size="tiny"
          v-model:value="botSettings.difficulty"
          :options="difficultyOptions"
        ></NSelect>
        <NSelect
          style="width: 100px"
          size="tiny"
          v-model:value="botSettings.team"
          :options="teamOptions"
        ></NSelect>
        <NButton :disabled="gameflow.phase !== 'Lobby'" @click="handleAddBot" size="tiny"
          >添加</NButton
        >
      </div>
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="创建队列房间"
      label-description="创建一个指定队列 ID 的房间，受制于服务器是否开启目标队列"
    >
      <div style="display: flex; align-items: center; gap: 8px">
        <NSelect
          placeholder="选择或指定 ID"
          style="width: 180px"
          size="tiny"
          filterable
          tag
          v-model:value="queueLobbySettings.queueId"
          :options="queueOptions"
        ></NSelect>
        <NButton
          :disabled="
            queueLobbySettings.queueId === null || Number.isNaN(Number(queueLobbySettings.queueId))
          "
          @click="handleCreateQueueLobby"
          size="tiny"
          >创建</NButton
        >
      </div>
    </ControlItem>
    <ControlItem class="control-item-margin" label="创建 5v5 训练房间">
      <NFlex>
        <NButton @click="handleCreatePractice5v5" size="tiny">创建</NButton>
        <NInput
          :status="practice5v5LobbyName.length ? 'success' : 'warning'"
          v-model:value="practice5v5LobbyName"
          style="width: 180px"
          size="tiny"
        />
      </NFlex>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import {
  addBot,
  createPractice5x5,
  createQueueLobby,
  getAvailableBots
} from '@shared/renderer/http-api/lobby'
import { useGameDataStore } from '@shared/renderer/modules/lcu-state-sync/game-data'
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync/gameflow'
import { laNotification } from '@shared/renderer/notification'
import { AvailableBot } from '@shared/types/lcu/lobby'
import { NButton, NCard, NFlex, NInput, NSelect, useMessage } from 'naive-ui'
import { computed, reactive, ref, shallowRef } from 'vue'

const gameflow = useGameflowStore()
const gameData = useGameDataStore()

const getRandomLobbyName = () => {
  return `AKARI_${(Date.now() % 10000000) + 10000000}`
}

const practice5v5LobbyName = ref(getRandomLobbyName())

const handleCreatePractice5v5 = async () => {
  try {
    if (!practice5v5LobbyName.value) {
      practice5v5LobbyName.value = getRandomLobbyName()
    }

    await createPractice5x5(practice5v5LobbyName.value)
    practice5v5LobbyName.value = getRandomLobbyName()
  } catch (error) {
    laNotification.warn('房间工具', '尝试创建房间失败', error)
  }
}

const handleAddBot = async () => {
  if (!botSettings.championId) {
    return
  }
  try {
    await addBot(botSettings.difficulty, botSettings.championId, botSettings.team)
  } catch (error) {
    laNotification.warn('房间工具', '尝试添加人机失败', error)
  }
}

const queueOptions = computed(() => {
  if (gameData.queues === null) {
    return []
  }

  return Object.keys(gameData.queues).map((k) => {
    return {
      value: Number(k),
      label: `${gameData.queues[k].name} (${k})`
    }
  })
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

const difficultyOptions = [
  {
    value: 'RSINTRO',
    label: '新手'
  },
  {
    value: 'RSBEGINNER',
    label: '中等'
  },
  {
    value: 'RSINTERMEDIATE',
    label: '一般'
  }
]

const positionOptions = [
  {
    value: 'TOP',
    label: '上单'
  },
  {
    value: 'JUNGLE',
    label: '打野'
  },
  {
    value: 'MIDDLE',
    label: '中单'
  },
  {
    value: 'BOTTOM',
    label: '下路'
  },
  {
    value: 'UTILITY',
    label: '辅助'
  }
]

const teamOptions = [
  {
    value: '100',
    label: '蓝色方'
  },
  {
    value: '200',
    label: '红色方'
  }
]

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
    await createQueueLobby(queueLobbySettings.queueId)
  } catch (error) {
    laNotification.warn('房间工具', '尝试创建队列房间失败，队列可能未开放', error)
  }
}

// 每次启动只提示一次
let acknowledged = false
const message = useMessage()
const handleLoadAvailableBots = async (show: boolean) => {
  if (show) {
    try {
      const bots = (await getAvailableBots()).data
      availableBots.value = bots

      if (!acknowledged && bots.length === 0) {
        message.info('为了获取自定义人机列表，你需要进入一次自定义房间', {
          closable: true,
          duration: 5000
        })
        acknowledged = true
      }
    } catch (error) {
      laNotification.warn('房间工具', '尝试加载可用人机列表失败', error)
    }
  }
}
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
</style>