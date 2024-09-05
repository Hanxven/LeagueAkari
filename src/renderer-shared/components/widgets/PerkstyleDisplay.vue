<template>
  <NPopover v-if="perkstyleId && gameData.perkstyles[perkstyleId]" :delay="300">
    <template #trigger>
      <LcuImage
        :src="gameData.perkstyles[perkstyleId].iconPath"
        v-bind="$attrs"
        :style="{ width: `${size}px`, height: `${size}px` }"
        class="perkstyle"
      />
    </template>
    <div style="width: 180px" class="info">
      <LcuImage class="image" :src="gameData.perkstyles[perkstyleId].iconPath" />
      <div class="right-side">{{ gameData.perkstyles[perkstyleId].name }}</div>
    </div>
    <div style="max-width: 180px; font-size: 12px">
      {{ gameData.perkstyles[perkstyleId].tooltip }}
    </div>
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

const { size = 20 } = defineProps<{
  perkstyleId?: number
  size?: number
}>()

const gameData = useGameDataStore()
</script>

<style lang="less" scoped>
.perkstyle,
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
