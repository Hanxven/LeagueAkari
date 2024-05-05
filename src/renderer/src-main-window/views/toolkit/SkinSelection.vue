<template>
  <NCard size="small">
    <template #header><span class="card-header-title">皮肤选择</span></template>
    <ControlItem
      v-if="cs.currentChampion"
      class="control-item-margin"
      label="选择"
      label-description="选择皮肤"
    >
      <NFlex>
        <NSelect
          filterable
          style="width: 200px"
          :options="skinOptions"
          :render-option="renderOption"
          v-model:value="currentSkinId"
          size="tiny"
          :filter="(a, b) => isChampionNameMatch(a, b.label as string)"
        ></NSelect>
        <NButton size="tiny" :disabled="!currentSkinId" @click="handleSetSkin">应用</NButton>
      </NFlex>
    </ControlItem>
    <template v-else>
      <span style="font-size: 13px" v-if="!cs.session">未处于英雄选择过程中</span>
      <span style="font-size: 13px" v-else-if="!cs.currentChampion">未锁定英雄</span>
      <span style="font-size: 13px" v-else>不可用</span>
    </template>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import { getCarouselSkins, setSkin } from '@shared/renderer/http-api/champ-select'
import { getChampDetails } from '@shared/renderer/http-api/game-data'
import { useChampSelectStore } from '@shared/renderer/modules/lcu-state-sync/champ-select'
import { CarouselSkins } from '@shared/types/lcu/champ-select'
import { ChampDetails } from '@shared/types/lcu/game-data'
import { isChampionNameMatch } from '@shared/utils/string-match'
import { NButton, NCard, NFlex, NSelect, NTooltip, SelectOption, useMessage } from 'naive-ui'
import { VNode, computed, h, ref, shallowRef, watch } from 'vue'

const cs = useChampSelectStore()

const currentSkinId = ref<number>()

const renderOption = ({ option, node }: { node: VNode; option: SelectOption }) => {
  return h(
    NTooltip,
    { placement: 'right', delay: 300, animated: false },
    {
      trigger: () => node,
      default: () => {
        if (option.isChild) {
          return h(NFlex, { gap: 4, wrap: false, align: 'center' }, () => [
            h(LcuImage, {
              src: option.chromaPreviewUrl as string,
              cache: false,
              style: {
                height: '64px',
                width: '64px',
                objectFit: 'contain'
              }
            }),
            h(LcuImage, {
              src: option.previewUrl as string,
              cache: false,
              style: {
                height: '96px',
                width: '120px',
                objectFit: 'contain'
              }
            })
          ])
        } else {
          return h(LcuImage, {
            src: option.previewUrl as string,
            cache: false,
            style: {
              height: '160px',
              minWidth: '280px',
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
  if (!currentSkinId.value) {
    return
  }

  try {
    await setSkin(currentSkinId.value)
    message.success('已经成功设置皮肤')
  } catch (error) {
    message.warning('尝试设置皮肤时失败')
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
