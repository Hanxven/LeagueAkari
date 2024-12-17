<template>
  <NPopover v-if="perkstyleId && lcs.gameData.perkstyles.styles[perkstyleId]" :delay="50">
    <template #trigger>
      <LcuImage
        :src="lcs.gameData.perkstyles.styles[perkstyleId].iconPath"
        v-bind="$attrs"
        :style="{ width: `${size}px`, height: `${size}px` }"
        class="perkstyle"
      />
    </template>
    <div style="width: 180px" class="info">
      <LcuImage class="image" :src="lcs.gameData.perkstyles.styles[perkstyleId].iconPath" />
      <div class="right-side">{{ lcs.gameData.perkstyles.styles[perkstyleId].name }}</div>
    </div>
    <div style="max-width: 180px; font-size: 12px">
      {{ lcs.gameData.perkstyles.styles[perkstyleId].tooltip }}
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
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { NPopover } from 'naive-ui'

import LcuImage from '../LcuImage.vue'

const { size = 20 } = defineProps<{
  perkstyleId?: number
  size?: number
}>()

const lcs = useLeagueClientStore()
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
