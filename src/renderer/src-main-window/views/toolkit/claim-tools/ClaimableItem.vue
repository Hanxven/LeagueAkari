<template>
  <div class="claimable-item">
    <div class="header">
      <span class="title">{{ translatedTitle }}</span>
    </div>
    <div class="items">
      <RewardItem v-for="item of items" :key="item.id" :iconUrl="item.iconUrl" :name="item.name" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import RewardItem from './RewardItem.vue'

const { t } = useTranslation()

const { items = [], title = '' } = defineProps<{
  title?: string
  items?: {
    id: string
    iconUrl: string
    name: string
  }[]
}>()

const translatedTitle = computed(() => {
  // "Placeholder Name for Reward Group DO NOT TRANSLATE"
  if (title.includes('DO NOT TRANSLATE')) {
    return t('ClaimableItem.untranslatedC', {
      countV: items.length
    })
  }

  return title
})
</script>

<style lang="less" scoped>
.claimable-item {
  display: flex;
  flex-direction: column;

  .header {
    margin-bottom: 12px;

    .title {
      font-size: 14px;
      font-weight: bold;
    }
  }

  .items {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
}
</style>
