<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ t('StrawberryTool.title') }}</span>
    </template>
    <div v-if="lcs.lobby.lobby?.gameConfig.gameMode !== 'STRAWBERRY'" style="font-size: 13px">
      {{ t('StrawberryTool.unavailable') }}
    </div>
    <template v-else>
      <ControlItem
        class="control-item-margin"
        :label="t('StrawberryTool.champion.label')"
        :label-description="t('StrawberryTool.champion.description')"
        :label-width="260"
      >
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
          <NSelect
            style="width: 180px"
            size="small"
            v-model:value="currentChampionId"
            filterable
            :filter="(a, b) => isChampionNameMatch(a, b.label as string)"
            :render-label="renderLabel"
            :options="strawberryChampions"
          ></NSelect>
          <NButton
            @click="setChampion"
            size="small"
            :loading="isSettingChampion"
            :disabled="!currentChampionId"
            >{{ t('StrawberryTool.champion.button') }}</NButton
          >
        </div>
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('StrawberryTool.map.label')"
        :label-description="t('StrawberryTool.map.description')"
        :label-width="260"
      >
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
          <NSelect
            style="width: 180px"
            size="small"
            v-model:value="currentMapUnionId"
            filterable
            :filter="(a, b) => isChampionNameMatch(a, b.label as string)"
            @update:show="doIfNotInitialized"
            :options="mapOptions"
          ></NSelect>
          <NButton
            @click="setMap"
            size="small"
            :loading="isSettingMap"
            :disabled="!currentMapUnionId"
            >{{ t('StrawberryTool.map.button') }}</NButton
          >
        </div>
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('StrawberryTool.difficulty.label')"
        :label-description="t('StrawberryTool.difficulty.description')"
        :label-width="260"
      >
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
          <NSelect
            style="width: 180px"
            size="small"
            v-model:value="currentDifficulty"
            filterable
            @update:show="doIfNotInitialized"
            :options="difficultyOptions"
          ></NSelect>
          <NButton
            @click="setDifficulty"
            size="small"
            :loading="isSettingDifficulty"
            :disabled="!currentDifficulty"
          >
            {{ t('StrawberryTool.difficulty.button') }}</NButton
          >
        </div>
      </ControlItem>
    </template>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import {
  AccountScopeLoadouts,
  ChampionSimple,
  StrawberryHub,
  maybePveChampion
} from '@shared/types/league-client/game-data'
import { isChampionNameMatch } from '@shared/utils/string-match'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NSelect, SelectRenderLabel, useMessage } from 'naive-ui'
import { h, shallowRef, watchEffect } from 'vue'
import { computed, ref } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const lc = useInstance(LeagueClientRenderer)

let isInitialized = false

watchEffect(() => {
  if (lcs.connectionState !== 'connected') {
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
    strawberryMapData.value = (await lc.api.gameData.getStrawberryHub()).data
    accountScopeLoadouts.value = (await lc.api.loadouts.getAccountScopeLoadouts()).data
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
        src: championIconUri(option.value as number),
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

  Object.values(lcs.gameData.champions).forEach((c) => {
    if (maybePveChampion(c.id)) {
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
      label: t('StrawberryTool.champion.modeSpecific'),
      children: strawberryChampions.map((c) => ({
        label: c.name,
        value: c.id,
        champion: c
      }))
    },
    {
      type: 'group',
      label: t('StrawberryTool.champion.other'),
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

    await lc.api.lobby.setPlayerSlotsStrawberry1(
      currentChampionId.value,
      mapId || 1,
      difficulty || 1
    )
    message.success(t('StrawberryTool.requestSent'))
  } catch (error) {
    message.warning(t('StrawberryTool.champion.failedMessage', { reason: (error as any).message }))
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
    await lc.api.lobby.setStrawberryMapId({ contentId, itemId: Number(itemIdRaw) })
    message.success(t('StrawberryTool.requestSent'))
  } catch (error) {
    message.warning(t('StrawberryTool.map.failedMessage', { reason: (error as any).message }))
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
    await lc.api.loadouts.setStrawberryDifficulty(loadoutsContentId, currentDifficulty.value)
    message.success(t('StrawberryTool.requestSent'))
  } catch (error) {
    message.warning(
      t('StrawberryTool.difficulty.failedMessage', { reason: (error as any).message })
    )
  } finally {
    isSettingDifficulty.value = false
  }
}
</script>

<style lang="less" scoped></style>
