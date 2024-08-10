<template>
  <NCard size="small">
    <template #header><span class="card-header-title">无尽狂潮</span></template>
    <div v-if="lobby.lobby?.gameConfig.gameMode !== 'STRAWBERRY'" style="font-size: 13px">
      当前未处于无尽狂潮房间中
    </div>
    <template v-else>
      <ControlItem
        class="control-item-margin"
        label="设置为当前英雄"
        label-description="你可以尝试尝试其他英雄"
      >
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
          <NSelect
            style="width: 180px"
            size="tiny"
            v-model:value="currentChampionId"
            filterable
            :filter="(a, b) => isChampionNameMatch(a, b.label as string)"
            :render-label="renderLabel"
            :options="strawberryChampions"
          ></NSelect>
          <NButton
            @click="setChampion"
            size="tiny"
            :loading="isSettingChampion"
            :disabled="!currentChampionId"
            >设置英雄</NButton
          >
        </div>
      </ControlItem>
      <ControlItem class="control-item-margin" label="选择地图" label-description="目前可用的地图">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
          <NSelect
            style="width: 180px"
            size="tiny"
            v-model:value="currentMapUnionId"
            filterable
            :filter="(a, b) => isChampionNameMatch(a, b.label as string)"
            @update:show="doIfNotInitialized"
            :options="mapOptions"
          ></NSelect>
          <NButton
            @click="setMap"
            size="tiny"
            :loading="isSettingMap"
            :disabled="!currentMapUnionId"
            >设置地图</NButton
          >
        </div>
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="设置难度"
        label-description="目前预设的难度包括 [故事]、[困难] 和 [极难], 目前无法设置未解锁的难度等级"
      >
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
          <NSelect
            style="width: 180px"
            size="tiny"
            v-model:value="currentDifficulty"
            filterable
            @update:show="doIfNotInitialized"
            :options="difficultyOptions"
          ></NSelect>
          <NButton
            @click="setDifficulty"
            size="tiny"
            :loading="isSettingDifficulty"
            :disabled="!currentDifficulty"
            >设置难度</NButton
          >
        </div>
      </ControlItem>
    </template>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import { getStrawberryHub } from '@shared/renderer/http-api/game-data'
import {
  getAccountScopeLoadouts,
  setStrawberryDifficulty
} from '@shared/renderer/http-api/loadouts'
import { setPlayerSlotsStrawberry1, setStrawberryMapId } from '@shared/renderer/http-api/lobby'
import { championIconUrl } from '@shared/renderer/modules/game-data'
import { useLcuConnectionStore } from '@shared/renderer/modules/lcu-connection/store'
import { useGameDataStore } from '@shared/renderer/modules/lcu-state-sync/game-data'
import { useLobbyStore } from '@shared/renderer/modules/lcu-state-sync/lobby'
import { AccountScopeLoadouts, ChampionSimple, StrawberryHub } from '@shared/types/lcu/game-data'
import { isChampionNameMatch } from '@shared/utils/string-match'
import { NButton, NCard, NSelect, SelectRenderLabel, useMessage } from 'naive-ui'
import { h, onMounted, shallowRef, watchEffect } from 'vue'
import { computed, ref } from 'vue'

const lobby = useLobbyStore()
const gameData = useGameDataStore()
const lc = useLcuConnectionStore()

let isInitialized = false

watchEffect(() => {
  if (lc.state !== 'connected') {
    isInitialized = false
  }
})

const strawberryMapData = shallowRef<StrawberryHub[] | null>(null)
const accountScopeLoadouts = shallowRef<AccountScopeLoadouts[] | null>(null)

const currentChampionId = ref<number | null>(null)
const isSettingChampion = ref(false)

const message = useMessage()

const doIfNotInitialized = async () => {
  if (isInitialized) {
    return
  }

  try {
    strawberryMapData.value = (await getStrawberryHub()).data
    accountScopeLoadouts.value = (await getAccountScopeLoadouts()).data
    isInitialized = true
  } catch (error) {
    throw error
  }
}

const renderLabel: SelectRenderLabel = (option) => {
  if (option.type === 'group') {
    return h('span', option.label as string)
  }

  return h(
    'div',
    {
      style: {
        display: 'flex',
        gap: '8px'
      }
    },
    [
      h(LcuImage, {
        src: championIconUrl(option.value as number),
        style: {
          width: '18px',
          height: '18px'
        }
      }),
      h('span', option.label as string)
    ]
  )
}

const strawberryChampions = computed(() => {
  const strawberryChampions: ChampionSimple[] = []
  const otherChampions: ChampionSimple[] = []

  Object.values(gameData.champions).forEach((c) => {
    if (c.id >= 3000 && c.id < 4000) {
      strawberryChampions.push(c)
    } else {
      otherChampions.push(c)
    }
  })

  strawberryChampions.sort((a, b) => a.name.localeCompare(b.name))
  otherChampions.sort((a, b) => a.name.localeCompare(b.name))

  return [
    {
      type: 'group',
      label: '模式英雄',
      children: strawberryChampions.map((c) => ({
        label: c.name,
        value: c.id,
        champion: c
      }))
    },
    {
      type: 'group',
      label: '其他英雄',
      children: otherChampions.map((c) => ({
        label: c.name,
        value: c.id,
        champion: c
      }))
    }
  ]
})

const mapOptions = computed(() => {
  if (strawberryMapData.value === null || strawberryMapData.value.length === 0) {
    return []
  }

  return strawberryMapData.value[0].MapDisplayInfoList.map((m) => ({
    label: m.value.Name,
    value: `${m.value.Map.ContentId},${m.value.Map.ItemId}`
  }))
})

const currentMapUnionId = ref<string | null>(null)
const isSettingMap = ref(false)

const setChampion = async () => {
  if (currentChampionId.value === null) {
    return
  }

  if (isSettingChampion.value) {
    return
  }

  isSettingChampion.value = true

  try {
    let mapId: number | null = null
    let difficulty: number | null = null

    if (currentMapUnionId.value) {
      const [_, itemIdRaw] = currentMapUnionId.value.split(',')
      mapId = Number(itemIdRaw)
    }

    if (currentDifficulty.value) {
      difficulty = currentDifficulty.value
    }

    await setPlayerSlotsStrawberry1(currentChampionId.value, mapId || 1, difficulty || 1)
    message.success('请求已发送')
  } catch (error) {
    message.warning(`尝试设置英雄时发生错误: ${(error as any).message}`)
  } finally {
    isSettingChampion.value = false
  }
}

const setMap = async () => {
  if (currentMapUnionId.value === null) {
    return
  }

  if (isSettingMap.value) {
    return
  }

  isSettingMap.value = true

  try {
    const [contentId, itemIdRaw] = currentMapUnionId.value.split(',')
    await setStrawberryMapId({ contentId, itemId: Number(itemIdRaw) })
    message.success('请求已发送')
  } catch (error) {
    message.warning(`尝试设置地图时发生错误: ${(error as any).message}`)
  } finally {
    isSettingMap.value = false
  }
}

const difficultyOptions = [
  {
    label: '🐰',
    value: 1
  },
  {
    label: '★★',
    value: 2
  },
  {
    label: '★★★',
    value: 3
  }
]

const isSettingDifficulty = ref(false)
const currentDifficulty = ref<number | null>(null)

const setDifficulty = async () => {
  if (
    !currentDifficulty.value ||
    !accountScopeLoadouts.value ||
    accountScopeLoadouts.value.length === 0
  ) {
    return
  }

  if (isSettingDifficulty.value) {
    return
  }

  isSettingDifficulty.value = true

  try {
    const loadoutsContentId = accountScopeLoadouts.value[0].id
    await setStrawberryDifficulty(loadoutsContentId, currentDifficulty.value)
    message.success('请求已发送')
  } catch (error) {
    message.warning(`尝试设置难度时发生错误: ${(error as any).message}`)
  } finally {
    isSettingDifficulty.value = false
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
