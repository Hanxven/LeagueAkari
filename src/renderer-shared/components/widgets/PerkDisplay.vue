<template>
  <NPopover v-if="perkId && lcs.gameData.perks[perkId]" :delay="50">
    <template #trigger>
      <LcuImage
        :src="lcs.gameData.perks[perkId].iconPath"
        v-bind="$attrs"
        :style="{ width: `${size}px`, height: `${size}px` }"
        class="perk"
      />
    </template>
    <div :style="{ 'max-width': `${maxWidth}px` }" class="info">
      <LcuImage class="image" :src="lcs.gameData.perks[perkId].iconPath" />
      <div class="right-side">{{ lcs.gameData.perks[perkId].name }}</div>
    </div>
    <div
      :style="{ 'max-width': `${maxWidth}px` }"
      style="font-size: 12px"
      lol-view
      v-html="lcs.gameData.perks[perkId].longDesc"
    ></div>
  </NPopover>
  <div
    v-else
    :style="{ width: `${size}px`, height: `${size}px` }"
    v-bind="$attrs"
    class="empty"
  ></div>
</template>

<script setup lang="ts">
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { NPopover } from 'naive-ui'

import LcuImage from '../LcuImage.vue'

const { size = 20, maxWidth = 400 } = defineProps<{
  perkId?: number
  size?: number
  maxWidth?: number
}>()

const lcs = useLeagueClientStore()
</script>

<style lang="less" scoped>
.perk,
.empty {
  border-radius: 2px;
}

.info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;

  .image {
    border-radius: 2px;
    height: 28px;
  }

  .right-side {
    margin-left: 8px;
    font-size: 12px;
    font-weight: bold;
  }
}

.empty {
  background-color: rgb(34, 34, 34);
}
</style>
