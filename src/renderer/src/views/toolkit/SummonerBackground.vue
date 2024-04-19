<template>
  <NCard size="small">
    <template #header><span class="card-header-title">生涯背景替换</span></template>
    <NModal
      style="max-width: 560px"
      preset="card"
      size="small"
      title="选择皮肤"
      v-model:show="isModalShow"
    >
      <div style="display: flex; gap: 4px; margin-bottom: 8px; width: 340px">
        <NSelect
          filterable
          :options="championOptions"
          v-model:value="currentChampionId"
          size="tiny"
          :filter="(a, b) => isChampionNameMatch(a, b.label as string)"
        ></NSelect>
        <NButton
          type="primary"
          size="tiny"
          @click="handleApplyToProfile"
          :disabled="!currentSkinId"
          :loading="isProceeding"
          >设置为当前皮肤</NButton
        >
      </div>
      <NSelect
        filterable
        style="width: 340px"
        :options="skinOptions"
        :render-option="renderOption"
        v-model:value="currentSkinId"
        size="tiny"
        :filter="(a, b) => isChampionNameMatch(a, b.label as string)"
      ></NSelect>
    </NModal>
    <ControlItem class="control-item-margin" label="选择" label-description="查找目标英雄或皮肤">
      <NButton size="tiny" @click="isModalShow = true">选择</NButton>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import { ChampSkin } from '@shared/types/lcu/game-data'
import { NButton, NCard, NModal, NSelect, NTooltip, SelectOption, useMessage } from 'naive-ui'
import { VNode, computed, h, ref, watch } from 'vue'

import ControlItem from '@renderer/components/ControlItem.vue'
import LcuImage from '@renderer/components/LcuImage.vue'
import { useGameDataStore } from '@renderer/features/lcu-state-sync/game-data'
import { getChampDetails } from '@renderer/http-api/game-data'
import { setSummonerBackgroundSkin } from '@renderer/http-api/summoner'
import { isChampionNameMatch } from '@shared/utils/string-match'

const gameData = useGameDataStore()

const currentChampionId = ref<number>()
const currentSkinId = ref<number>()
const championOptions = computed(() => {
  const list = Object.values(gameData.champions).reduce((arr, current) => {
    if (current.id === -1) {
      return arr
    }

    arr.push({
      label: current.name,
      value: current.id
    })
    return arr
  }, [] as SelectOption[])

  list.sort((a, b) => (a.label as string).localeCompare(b.label as string, 'zh-Hans-CN'))

  return list
})

const skinList = ref<ChampSkin[]>([])
const skinOptions = computed(() => {
  return skinList.value.map((v) => ({
    label: v.name,
    value: v.id,
    url: v.uncenteredSplashPath || v.splashPath
  }))
})

const renderOption = ({ option, node }: { node: VNode; option: SelectOption }) => {
  return h(
    NTooltip,
    { placement: 'right', delay: 300, animated: false },
    {
      trigger: () => node,
      default: () =>
        h(LcuImage, {
          src: option.url as string,
          cache: false,
          style: {
            height: '160px',
            minWidth: '280px',
            objectFit: 'contain'
          }
        })
    }
  )
}

watch(
  () => currentChampionId.value,
  async (id) => {
    if (!id) {
      return
    }

    const details = (await getChampDetails(id)).data

    if (details.id !== currentChampionId.value) {
      return
    }

    skinList.value = details.skins
    if (details.skins.length) {
      currentSkinId.value = details.skins[0].id
    }
  }
)

const isModalShow = ref(false)
const message = useMessage()
const isProceeding = ref(false)

const handleApplyToProfile = async () => {
  if (!currentSkinId.value || isProceeding.value) {
    return
  }

  isProceeding.value = true

  try {
    await setSummonerBackgroundSkin(currentSkinId.value)
    message.success('成功', { duration: 500 })
  } catch {
    message.warning('无法设置', { duration: 1000 })
  } finally {
    isProceeding.value = false
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
