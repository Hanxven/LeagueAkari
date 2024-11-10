<template>
  <NCard size="small">
    <template #header><span class="card-header-title">召唤师 Profile</span></template>
    <NModal
      style="width: fit-content;"
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
          size="small"
          :filter="(a, b) => isChampionNameMatch(a, b.label as string)"
        ></NSelect>
        <NButton
          type="primary"
          size="small"
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
        size="small"
        :filter="(a, b) => isChampionNameMatch(a, b.label as string)"
      ></NSelect>
      <NSelect
        filterable
        style="width: 340px"
        v-if="currentAugmentOptions.length >= 1"
        :options="currentAugmentOptions"
        v-model:value="currentAugmentId"
        size="small"
      ></NSelect>
    </NModal>
    <ControlItem
      class="control-item-margin"
      label="选择召唤师背景"
      label-description="查找目标英雄或皮肤"
      :label-width="200"
    >
      <NButton
        size="small"
        type="primary"
        @click="isModalShow = true"
        :disabled="lcs.connectionState !== 'connected'"
        >选择</NButton
      >
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="切换为上赛季旗帜"
      label-description="切换为上赛季旗帜，可能会导致旗帜消失"
      :label-width="200"
    >
      <NButton
        :disabled="lcs.connectionState !== 'connected'"
        @click="handleUpdatePr"
        :loading="isUpdating"
        size="small"
        >执行</NButton
      >
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      :label-description="
        lcs.summoner.me &&
        lcs.summoner.me.summonerLevel <= MINIMUM_SUMMONER_LEVEL_FOR_PRESTIGE_CREST
          ? `卸下头像框 (召唤师等级需大于等于 525, 当前等级为 ${lcs.summoner.me.summonerLevel})`
          : '卸下头像框'
      "
      label="卸下头像框"
      :label-width="200"
    >
      <NButton
        :disabled="lcs.connectionState !== 'connected'"
        @click="handleRemovePrestigeCrest"
        :loading="isRemovingPrestigeCrest"
        size="small"
        >执行</NButton
      >
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label-description="卸下所有勋章"
      label="卸下所有勋章"
      :label-width="200"
    >
      <NButton
        :disabled="lcs.connectionState !== 'connected'"
        @click="handleRemoveTokens"
        :loading="isRemovingTokens"
        size="small"
        >执行</NButton
      >
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { ChampSkin } from '@shared/types/league-client/game-data'
import { isChampionNameMatch } from '@shared/utils/string-match'
import { NButton, NCard, NModal, NSelect, NTooltip, SelectOption, useMessage } from 'naive-ui'
import { VNode, computed, h, ref, watch } from 'vue'

const lcs = useLeagueClientStore()
const lc = useInstance<LeagueClientRenderer>('league-client-renderer')

const currentChampionId = ref<number>()
const currentSkinId = ref<number>()
const currentAugmentId = ref<string>()
const championOptions = computed(() => {
  const list = Object.values(lcs.gameData.champions).reduce((arr, current) => {
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
    { placement: 'right', delay: 300, animated: true, raw: true },
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

    const details = (await lc.api.gameData.getChampDetails(id)).data

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
    await lc.api.summoner.setSummonerBackgroundSkin(currentSkinId.value)
    if (currentAugmentId.value !== undefined) {
      await lc.api.summoner.setSummonerBackgroundAugments(currentAugmentId.value)
    }
    message.success('成功', { duration: 1000 })
  } catch (error) {
    console.warn(error)
    message.warning('无法设置', { duration: 1000 })
  } finally {
    isProceeding.value = false
  }
}

const BANNER_ACCENT_A = '2'

const isUpdating = ref(false)
const handleUpdatePr = async () => {
  if (isUpdating.value) {
    return
  }

  try {
    isUpdating.value = true
    await lc.api.challenges.updatePlayerPreferences({ bannerAccent: BANNER_ACCENT_A })
    message.success('请求成功')
  } catch (error) {
    message.warning('无法执行')
    console.warn(error)
  } finally {
    isUpdating.value = false
  }
}

const FIXED_PRESTIGE_CREST = 22
const MINIMUM_SUMMONER_LEVEL_FOR_PRESTIGE_CREST = 525
const isRemovingPrestigeCrest = ref(false)
// Copied from Seraphine: https://github.com/Zzaphkiel/Seraphine
const handleRemovePrestigeCrest = async () => {
  if (isRemovingPrestigeCrest.value) {
    return
  }

  try {
    isRemovingPrestigeCrest.value = true
    const current = await lc.api.regalia.getRegalia()
    await lc.api.regalia.updateRegalia({
      preferredCrestType: 'prestige',
      preferredBannerType: current.data.bannerType,
      selectedPrestigeCrest: FIXED_PRESTIGE_CREST
    })
    message.success('请求成功')
  } catch (error) {
    message.warning('无法执行')
    console.warn(error)
  } finally {
    isRemovingPrestigeCrest.value = false
  }
}

const isRemovingTokens = ref(false)
// Copied from Seraphine: https://github.com/Zzaphkiel/Seraphine
const handleRemoveTokens = async () => {
  if (isRemovingTokens.value) {
    return
  }

  try {
    isRemovingTokens.value = true
    await lc.api.challenges.updatePlayerPreferences({
      challengeIds: [],
      bannerAccent: (await lc.api.chat.getMe()).data.lol?.bannerIdSelected
    })
    message.success('请求成功')
  } catch (error) {
    message.warning('无法执行')
    console.warn(error)
  } finally {
    isRemovingTokens.value = false
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
