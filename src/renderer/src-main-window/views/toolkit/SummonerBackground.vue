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
        style="width: 340px; margin-bottom: 8px"
        :options="skinOptions"
        :render-option="renderOption"
        v-model:value="currentSkinId"
        size="tiny"
        :filter="(a, b) => isChampionNameMatch(a, b.label as string)"
      ></NSelect>
      <NSelect
        filterable
        style="width: 340px"
        v-if="currentAugmentOptions.length >= 1"
        :options="currentAugmentOptions"
        v-model:value="currentAugmentId"
        size="tiny"
      ></NSelect>
    </NModal>
    <ControlItem class="control-item-margin" label="选择" label-description="查找目标英雄或皮肤">
      <NButton size="tiny" type="primary" @click="isModalShow = true">选择</NButton>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import { getChampDetails } from '@shared/renderer/http-api/game-data'
import {
  setSummonerBackgroundAugments,
  setSummonerBackgroundSkin
} from '@shared/renderer/http-api/summoner'
import { useGameDataStore } from '@shared/renderer/modules/lcu-state-sync/game-data'
import { ChampSkin } from '@shared/types/lcu/game-data'
import { isChampionNameMatch } from '@shared/utils/string-match'
import { NButton, NCard, NModal, NSelect, NTooltip, SelectOption, useMessage } from 'naive-ui'
import { VNode, computed, h, ref, watch } from 'vue'

const gameData = useGameDataStore()

const currentChampionId = ref<number>()
const currentSkinId = ref<number>()
const currentAugmentId = ref<string>()
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
  const arr: {
    label: string
    value: number
    url: string
    augments?: { label: string; value: string }[]
  }[] = []

  const skinSet = new Set<number>()
  skinList.value.forEach((v) => {
    const augOptions1: any[] = []
    if (v.skinAugments && v.skinAugments.augments) {
      for (const au of v.skinAugments.augments) {
        augOptions1.push({
          label: `装饰 ${au.contentId}`,
          value: au.contentId
        })
      }
    }

    if (augOptions1.length) {
      augOptions1.unshift({ label: '不设置', value: '' })
    }

    arr.push({
      label: v.name,
      value: v.id,
      url: v.uncenteredSplashPath || v.splashPath,
      augments: augOptions1
    })

    skinSet.add(v.id)

    // 收集任务皮肤特殊挂件
    if (v.questSkinInfo && v.questSkinInfo.tiers) {
      v.questSkinInfo.tiers.forEach((t) => {
        if (!skinSet.has(t.id)) {
          const augOptions2: any[] = []
          if (t.skinAugments && t.skinAugments.augments) {
            for (const au of t.skinAugments.augments) {
              augOptions2.push({
                label: `装饰 ${au.contentId}`,
                value: au.contentId
              })
            }
          }

          if (augOptions2.length) {
            augOptions2.unshift({ label: '不设置', value: '' })
          }

          arr.push({
            label: t.name,
            value: t.id,
            url: t.uncenteredSplashPath || t.splashPath,
            augments: augOptions2
          })
          skinSet.add(t.id)
        }
      })
    }
  })

  return arr
})

const currentAugmentOptions = computed(() => {
  if (!currentSkinId.value) {
    return []
  }

  const s = skinOptions.value.find((s) => s.value === currentSkinId.value)

  return s?.augments || []
})

const renderOption = ({ option, node }: { node: VNode; option: SelectOption }) => {
  return h(
    NTooltip,
    { placement: 'right', delay: 300, animated: true, raw: true,  },
    {
      trigger: () => node,
      default: () =>
        h(
          'div',
          {
            style: {
              height: '160px',
              overflow: 'hidden',
              borderRadius: '4px',
              boxShadow: '0 0 4px rgba(0, 0, 0, 0.1)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }
          },
          h(LcuImage, {
            src: option.url as string,
            cache: false,
            style: {
              height: '100%',
              minWidth: '280px',
              objectFit: 'cover',
              overflow: 'hidden'
            }
          })
        )
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
      currentAugmentId.value = undefined
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
    if (currentAugmentId.value !== undefined) {
      await setSummonerBackgroundAugments(currentAugmentId.value)
    }
    message.success('成功', { duration: 1000 })
  } catch (error) {
    console.warn(error)
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
