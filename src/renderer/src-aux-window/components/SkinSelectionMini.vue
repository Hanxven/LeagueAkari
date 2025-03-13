<template>
  <NCard
    size="small"
    v-if="aws.settings.showSkinSelector && lcs.champSelect.currentChampion && skinOptions.length"
  >
    <NFlex align="center" class="control-item" style="gap: 4px">
      <NSelect
        size="tiny"
        :render-label="renderLabel"
        :render-tag="renderTag"
        style="flex: 1"
        v-model:value="currentSkinId"
        :placeholder="
          t('SkinSelectionMini.skins', {
            countV: skinOptions.length
          })
        "
        :options="skinOptions"
      />
      <NButton
        :loading="isSettingSkin"
        type="primary"
        size="tiny"
        secondary
        @click="handleSetSkin"
        >{{ t('SkinSelectionMini.button') }}</NButton
      >
    </NFlex>
  </NCard>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useAuxWindowStore } from '@renderer-shared/shards/window-manager/store'
import { CarouselSkins } from '@shared/types/league-client/champ-select'
import { ChampDetails } from '@shared/types/league-client/game-data'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NCard,
  NFlex,
  NSelect,
  SelectRenderLabel,
  SelectRenderTag,
  useMessage
} from 'naive-ui'
import { computed, h, ref, shallowRef, watch } from 'vue'

const { t } = useTranslation()

const aws = useAuxWindowStore()
const lcs = useLeagueClientStore()

const lc = useInstance(LeagueClientRenderer)

const currentSkinId = ref<number>()
const isSettingSkin = ref(false)

const renderLabel: SelectRenderLabel = (option) => {
  return h(
    NFlex,
    {
      align: 'center',
      justify: 'center',
      wrap: false,
      style: { padding: '2px 4px' }
    },
    () => [
      h(LcuImage, {
        src: option.isChild ? (option.chromaPreviewUrl as string) : (option.previewUrl as string),
        cache: false,
        style: {
          height: '20px',
          width: '36px',
          objectFit: 'contain',
          borderRadius: '2px'
        }
      }),
      h(
        'div',
        {
          style: {
            fontSize: '12px',
            overflow: 'hidden',
            whiteSpace: 'no-wrap',
            textOverflow: 'ellipsis'
          },
          title: option.label as string
        },
        option.label as string
      )
    ]
  )
}

const renderTag: SelectRenderTag = ({ option }) => {
  return h('span', { style: 'font-size: 12px;' }, option.label as string)
}

const carouselSkins = shallowRef<CarouselSkins[]>([])
const championDetails = shallowRef<ChampDetails | null>(null)

const championSkinNameMap = computed(() => {
  if (!championDetails.value) {
    return {}
  }

  const skins = championDetails.value.skins

  const map: Record<number, string> = {}

  for (const s of skins) {
    map[s.id] = s.name

    if (s.chromas) {
      for (const c of s.chromas) {
        map[c.id] = c.name
      }
    }
  }

  return map
})

const skinOptions = computed(() => {
  const flattedSkins: {
    label: string
    value: number
    previewUrl: string
    chromaPreviewUrl: string
    isChild: boolean
  }[] = []

  for (const skin of carouselSkins.value) {
    if (!skin.unlocked) {
      continue
    }

    if (!skin.disabled) {
      flattedSkins.push({
        label: championSkinNameMap.value[skin.id] || skin.name,
        value: skin.id,
        previewUrl: skin.splashPath,
        chromaPreviewUrl: '',
        isChild: false
      })
    }

    for (const child of skin.childSkins) {
      if (!child.disabled && child.unlocked) {
        flattedSkins.push({
          label: championSkinNameMap.value[child.id] || child.name,
          value: child.id,
          previewUrl: child.splashPath,
          chromaPreviewUrl: child.chromaPreviewPath,
          isChild: true
        })
      }
    }
  }

  return flattedSkins
})

watch(
  () => lcs.champSelect.currentChampion,
  async (c) => {
    if (!c) {
      carouselSkins.value = []
      championDetails.value = null
      return
    }

    currentSkinId.value = undefined

    try {
      const list = (await lc.api.champSelect.getCarouselSkins()).data
      carouselSkins.value = list

      if (list.length) {
        currentSkinId.value = list[0].id
      }

      const cm = (await lc.api.gameData.getChampDetails(c)).data
      championDetails.value = cm
    } catch (error) {}
  },
  { immediate: true }
)

const message = useMessage()

const handleSetSkin = async () => {
  if (!currentSkinId.value || isSettingSkin.value) {
    return
  }

  isSettingSkin.value = true

  try {
    await lc.api.champSelect.setSkin(currentSkinId.value)
    message.success(t('SkinSelectionMini.success'))
  } catch (error) {
    message.warning(t('SkinSelectionMini.failed'))
  } finally {
    isSettingSkin.value = false
  }
}
</script>

<style scoped lang="less">
.outer {
  display: flex;
  align-items: center;
  justify-content: center;
}

.operations {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.btns {
  display: flex;
  gap: 4px;
}

.champions {
  display: grid;
  grid-template-columns: repeat(5, auto);
  gap: 4px;
}

.champion-image {
  width: 24px;
  height: 24px;
  border-radius: 2px;
  cursor: pointer;
}

.champion-image-invalid {
  cursor: not-allowed;
  filter: grayscale(1);
}

.champion-image-placeholder {
  width: 24px;
  height: 24px;
  box-sizing: border-box;
  border: 1px solid rgb(72, 72, 72);
  border-radius: 2px;
}
</style>
