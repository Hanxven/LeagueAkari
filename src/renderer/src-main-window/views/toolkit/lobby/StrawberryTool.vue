<template>
  <NCard size="small">
    <template #header><span class="card-header-title">无尽狂潮</span></template>
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
          :disabled="gameflow.session?.gameData.queue.type !== 'STRAWBERRY'"
          @click="setChampion"
          size="tiny"
          :loading="isSetting"
          >设置</NButton
        >
      </div>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import { setPlayerSlotsStrawberry1 } from '@shared/renderer/http-api/lobby'
import { championIcon } from '@shared/renderer/modules/game-data'
import { useGameDataStore } from '@shared/renderer/modules/lcu-state-sync/game-data'
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync/gameflow'
import { ChampionSimple } from '@shared/types/lcu/game-data'
import { isChampionNameMatch } from '@shared/utils/string-match'
import { NButton, NCard, NSelect, SelectRenderLabel, useMessage } from 'naive-ui'
import { h } from 'vue'
import { computed, ref } from 'vue'

const gameflow = useGameflowStore()
const gameData = useGameDataStore()

const currentChampionId = ref<number | null>(null)
const isSetting = ref(false)

const message = useMessage()

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
        src: championIcon(option.value as number),
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

const setChampion = async () => {
  if (currentChampionId.value === null) {
    return
  }

  if (isSetting.value) {
    return
  }

  isSetting.value = true

  try {
    await setPlayerSlotsStrawberry1(currentChampionId.value)
    message.success('请求已发送')
  } catch (error) {
    message.warning(`尝试设置英雄时发生错误: ${(error as any).message}`)
  } finally {
    isSetting.value = false
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
