<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ t('SummonerProfile.title') }}</span>
    </template>
    <NModal
      style="width: fit-content"
      preset="card"
      size="small"
      :title="t('SummonerProfile.skinSelectModal.title')"
      v-model:show="isModalShow"
    >
      <div style="display: flex; gap: 4px; margin-bottom: 8px; width: 340px">
        <NSelect
          filterable
          :options="championOptions"
          v-model:value="currentChampionId"
          :render-label="renderLabel"
          size="small"
          :filter="(a, b) => isNameMatch(a, b.label as string, b.value as number)"
        ></NSelect>
        <NButton
          type="primary"
          size="small"
          @click="handleApplyToProfile"
          :disabled="!currentSkinId"
          :loading="isProceeding"
          >{{ t('SummonerProfile.skinSelectModal.button') }}</NButton
        >
      </div>
      <NSelect
        filterable
        style="width: 340px; margin-bottom: 8px"
        :options="skinOptions"
        :render-option="renderOption"
        v-model:value="currentSkinId"
        size="small"
        :filter="(a, b) => isNameMatch(a, b.label as string)"
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
      :label="t('SummonerProfile.profileBackground.label')"
      :label-description="t('SummonerProfile.profileBackground.description')"
      :label-width="260"
    >
      <NButton
        size="small"
        type="primary"
        @click="isModalShow = true"
        :disabled="lcs.connectionState !== 'connected'"
        >{{ t('SummonerProfile.profileBackground.button') }}</NButton
      >
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      :label="t('SummonerProfile.bannerAccent.label')"
      :label-description="t('SummonerProfile.bannerAccent.description')"
      :label-width="260"
    >
      <NButton
        :disabled="lcs.connectionState !== 'connected'"
        @click="handleUpdatePr"
        :loading="isUpdating"
        size="small"
        >{{ t('SummonerProfile.bannerAccent.button') }}</NButton
      >
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      :label-description="
        lcs.summoner.me &&
        lcs.summoner.me.summonerLevel <= MINIMUM_SUMMONER_LEVEL_FOR_PRESTIGE_CREST
          ? t('SummonerProfile.prestigeCrest.descriptionInsufficientLevel', {
              level: lcs.summoner.me.summonerLevel
            })
          : t('SummonerProfile.prestigeCrest.description')
      "
      :label="t('SummonerProfile.prestigeCrest.label')"
      :label-width="260"
    >
      <NButton
        :disabled="lcs.connectionState !== 'connected'"
        @click="handleRemovePrestigeCrest"
        :loading="isRemovingPrestigeCrest"
        size="small"
        >{{ t('SummonerProfile.prestigeCrest.button') }}</NButton
      >
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      :label-description="t('SummonerProfile.token.description')"
      :label="t('SummonerProfile.token.label')"
      :label-width="260"
    >
      <NButton
        :disabled="lcs.connectionState !== 'connected'"
        @click="handleRemoveTokens"
        :loading="isRemovingTokens"
        size="small"
        >{{ t('SummonerProfile.token.button') }}</NButton
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
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { ChampSkin } from '@shared/types/league-client/game-data'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NCard,
  NFlex,
  NModal,
  NSelect,
  NTooltip,
  SelectOption,
  useMessage
} from 'naive-ui'
import { VNode, VNodeChild, computed, h, ref, watch } from 'vue'

import { useChampionNameMatch } from '@main-window/compositions/useChampionNameMatch'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const lc = useInstance(LeagueClientRenderer)

const { match: isNameMatch } = useChampionNameMatch()

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
          label: `${t('SummonerProfile.skinSelectModal.augment')} ${au.contentId}`,
          value: au.contentId
        })
      }
    }

    if (augOptions1.length) {
      augOptions1.unshift({ label: t('SummonerProfile.skinSelectModal.unset'), value: '' })
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
      v.questSkinInfo.tiers.forEach((ti) => {
        if (!skinSet.has(ti.id)) {
          const augOptions2: any[] = []
          if (ti.skinAugments && ti.skinAugments.augments) {
            for (const au of ti.skinAugments.augments) {
              augOptions2.push({
                label: `${t('SummonerProfile.skinSelectModal.augment')} ${au.contentId}`,
                value: au.contentId
              })
            }
          }

          if (augOptions2.length) {
            augOptions2.unshift({ label: t('SummonerProfile.skinSelectModal.unset'), value: '' })
          }

          arr.push({
            label: ti.name,
            value: ti.id,
            url: ti.uncenteredSplashPath || ti.splashPath,
            augments: augOptions2
          })
          skinSet.add(ti.id)
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

const renderLabel = (option: SelectOption) => {
  if (option.type === 'group') {
    return h('span', option.label as string)
  }

  return h(
    'div',
    {
      style: { display: 'flex', alignItems: 'center', gap: '8px' }
    },
    [
      h(LcuImage, {
        src: championIconUri(option.value as number),
        style: { width: '20px', height: '20px' }
      }),
      h('span', option.label as string)
    ]
  )
}

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
    message.success(t('SummonerProfile.commonSuccess'), { duration: 1000 })
  } catch (error) {
    console.warn(error)
    message.warning(t('SummonerProfile.commonFailed'), { duration: 1000 })
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
    message.success(t('SummonerProfile.commonSuccess'))
  } catch (error) {
    message.warning(t('SummonerProfile.commonFailed'))
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
    message.success(t('SummonerProfile.commonSuccess'))
  } catch (error) {
    message.warning(t('SummonerProfile.commonFailed'))
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
    message.success(t('SummonerProfile.commonSuccess'))
  } catch (error) {
    message.warning(t('SummonerProfile.commonFailed'))
    console.warn(error)
  } finally {
    isRemovingTokens.value = false
  }
}
</script>

<style lang="less" scoped></style>
