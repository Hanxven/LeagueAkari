<template>
  <NPopover v-if="perkId && gameData.perks[perkId]" :delay="300">
    <template #trigger>
      <LcuImage
        :src="gameData.perks[perkId].iconPath"
        v-bind="$attrs"
        :style="{ width: `${size}px`, height: `${size}px` }"
        class="perk"
      />
    </template>
    <div :style="{ 'max-width': `${maxWidth}px` }" class="info">
      <LcuImage class="image" :src="gameData.perks[perkId].iconPath" />
      <div class="right-side">{{ gameData.perks[perkId].name }}</div>
    </div>
    <div
      :style="{ 'max-width': `${maxWidth}px` }"
      style="font-size: 12px"
      lol-view
      v-html="gameData.perks[perkId].longDesc"
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
import { useGameDataStore } from '@renderer-shared/modules/lcu-state-sync/game-data'
import { NPopover } from 'naive-ui'

import LcuImage from '../LcuImage.vue'

const { size = 20, maxWidth = 400 } = defineProps<{
  perkId?: number
  size?: number
  maxWidth?: number
}>()

const gameData = useGameDataStore()
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
