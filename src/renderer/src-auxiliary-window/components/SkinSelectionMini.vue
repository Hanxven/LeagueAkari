<template>
  <NCard size="small" v-if="cs.currentChampion">
    <NFlex align="center" class="control-item" style="gap: 2px">
      <NSelect
        :render-option="renderOption"
        size="tiny"
        style="flex: 1"
        v-model:value="currentSkinId"
        :options="skinOptions"
      />
      <NButton type="primary" secondary @click="handleSetSkin">设置</NButton>
    </NFlex>
  </NCard>
</template>

<script setup lang="ts">
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import { getCarouselSkins, setSkin } from '@shared/renderer/http-api/champ-select'
import { getChampDetails } from '@shared/renderer/http-api/game-data'
import { useChampSelectStore } from '@shared/renderer/modules/lcu-state-sync/champ-select'
import { CarouselSkins } from '@shared/types/lcu/champ-select'
import { ChampDetails } from '@shared/types/lcu/game-data'
import { NButton, NCard, NFlex, NSelect, NTooltip, SelectOption, useMessage } from 'naive-ui'
import { VNode, computed, h, ref, shallowRef, watch } from 'vue'

const cs = useChampSelectStore()

const currentSkinId = ref<number>()
const isSettingSkin = ref(false)

const renderOption = ({ option, node }: { node: VNode; option: SelectOption }) => {
  return h(
    NTooltip,
    { delay: 300, animated: false },
    {
      trigger: () => node,
      default: () => {
        if (option.isChild) {
          return h(LcuImage, {
            src: option.chromaPreviewUrl as string,
            cache: false,
            style: {
              height: '40px',
              minWidth: '40px',
              objectFit: 'contain'
            }
          })
        } else {
          return h(LcuImage, {
            src: option.previewUrl as string,
            cache: false,
            style: {
              height: '40px',
              minWidth: '80px',
              objectFit: 'contain'
            }
          })
        }
      }
    }
  )
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
    if (!skin.disabled && skin.unlocked) {
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
  () => cs.currentChampion,
  async (c) => {
    if (!c) {
      carouselSkins.value = []
      championDetails.value = null
      return
    }

    try {
      const list = (await getCarouselSkins()).data
      carouselSkins.value = list

      const cm = (await getChampDetails(c)).data
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
    await setSkin(currentSkinId.value)
    message.success('已经成功设置皮肤')
  } catch (error) {
    message.warning('尝试设置皮肤时失败')
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

.card-header-title {
  font-weight: bold;
  font-size: 18px;
}
</style>
