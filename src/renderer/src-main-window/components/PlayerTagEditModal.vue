<template>
  <NModal v-model:show="show" preset="card" style="max-width: 60vw">
    <template #header>
      <span class="card-header-title">{{ t('PlayerTagEditModal.title') }}</span>
    </template>
    <template v-if="summoner">
      <div class="summoner-info">
        <LcuImage class="image" :src="profileIconUri(summoner.profileIconId)" />
        <span class="name">{{
          masked(
            summonerName(summoner?.gameName || summoner?.displayName, summoner?.tagLine, puuid),
            t('common.summoner')
          )
        }}</span>
      </div>
    </template>
    <template v-else>
      <span style="font-size: 12px">{{ t('PlayerTagEditModal.loading') }}</span>
    </template>
    <div style="margin-top: 12px">
      <NInput
        v-model:value="text"
        :placeholder="
          t('PlayerTagEditModal.placeholder', {
            name: masked(
              summonerName(summoner?.gameName || summoner?.displayName, summoner?.tagLine, puuid),
              t('common.summoner')
            )
          })
        "
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 4 }"
        ref="input"
      ></NInput>
    </div>
    <div style="margin-top: 12px; display: flex; justify-content: flex-end; gap: 4px">
      <NButton size="small" @click="show = false">{{ t('PlayerTagEditModal.cancel') }}</NButton>
      <NButton size="small" type="primary" @click="handleSaveTag">{{
        t('PlayerTagEditModal.save')
      }}</NButton>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useStreamerModeMaskedText } from '@renderer-shared/compositions/useStreamerModeMaskedText'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { PlayerTagDto } from '@renderer-shared/shards/saved-player'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import { summonerName } from '@shared/utils/name'
import { useTranslation } from 'i18next-vue'
import { NButton, NInput, NModal } from 'naive-ui'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

const { t } = useTranslation()

const show = defineModel<boolean>('show', { default: false })

const inputEl = useTemplateRef('input')

const emits = defineEmits<{
  submit: [tag: string | null]
}>()

const { summoner, tags } = defineProps<{
  puuid?: string
  summoner?: SummonerInfo | null
  tags?: PlayerTagDto[]
}>()

const { masked } = useStreamerModeMaskedText()

const selfTagged = computed(() => {
  return tags?.find((t) => t.markedBySelf)
})

const text = ref('')

watch(
  () => show.value,
  (show) => {
    if (show) {
      text.value = selfTagged.value?.tag || ''
      nextTick(() => inputEl.value?.focus())
    }
  }
)

const handleSaveTag = async () => {
  emits('submit', text.value || null)
}
</script>

<style lang="less" scoped>
.summoner-info {
  display: flex;
  align-items: center;

  .image {
    width: 24px;
    height: 24px;
    border-radius: 4px;
  }

  .name {
    margin-left: 8px;
    font-size: 14px;
    font-weight: bold;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
