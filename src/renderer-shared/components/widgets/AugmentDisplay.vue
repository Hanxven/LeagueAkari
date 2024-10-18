<template>
  <NPopover v-if="augmentId && lcs.gameData.augments[augmentId]" :delay="50">
    <template #trigger>
      <LcuImage
        :src="lcs.gameData.augments[augmentId].augmentSmallIconPath"
        v-bind="$attrs"
        :style="{ width: `${size}px`, height: `${size}px` }"
        class="augment"
        :class="{
          prismatic: lcs.gameData.augments[augmentId].rarity === 'kPrismatic',
          gold: lcs.gameData.augments[augmentId].rarity === 'kGold',
          silver: lcs.gameData.augments[augmentId].rarity === 'kSilver',
          bronze: lcs.gameData.augments[augmentId].rarity === 'kBronze'
        }"
      />
    </template>
    <div style="width: 180px" class="info">
      <LcuImage class="image" :src="lcs.gameData.augments[augmentId].augmentSmallIconPath" />
      <div class="right-side">{{ lcs.gameData.augments[augmentId].nameTRA }}</div>
    </div>
    <div class="rarity" style="max-width: 180px; font-size: 12px">
      <span
        :class="{
          prismatic: lcs.gameData.augments[augmentId].rarity === 'kPrismatic',
          gold: lcs.gameData.augments[augmentId].rarity === 'kGold',
          silver: lcs.gameData.augments[augmentId].rarity === 'kSilver',
          bronze: lcs.gameData.augments[augmentId].rarity === 'kBronze'
        }"
        class="rarity-indicator"
      ></span>
      {{ formatRarity(lcs.gameData.augments[augmentId].rarity) }}
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
  augmentId?: number
  size?: number
}>()

const lcs = useLeagueClientStore()

const formatRarity = (r: string) => {
  switch (r) {
    case 'kSilver':
      return 'Sliver'

    case 'kGold':
      return 'Gold'

    case 'kPrismatic':
      return 'Prismatic'

    default:
      return r
  }
}
</script>

<style lang="less" scoped>
.augment,
.empty {
  border-radius: 2px;
}

.augment {
  box-sizing: border-box;
}

.augment.prismatic {
  border: 1px solid transparent;
  border-image: linear-gradient(135deg, #e78fff, #8b05b0) 1;
  background-color: rgb(45, 37, 66);
}

.augment.gold {
  border: 1px solid rgb(255, 183, 0);
  background-color: rgb(50, 37, 5);
}

.augment.silver {
  border: 1px solid rgb(180, 180, 180);
  background-color: rgb(35, 35, 34);
}

.augment.bronze {
  border: 1px solid rgb(139, 69, 19);
  background-color: rgb(35, 35, 34);
}

.info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  .image {
    border-radius: 4px;
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

.rarity-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 2px;
  background-color: rgb(0, 0, 0); // default color
}

.rarity-indicator.silver {
  background-color: rgb(247, 247, 247);
}

.rarity-indicator.gold {
  background-color: rgb(255, 183, 0);
}

.rarity-indicator.prismatic {
  background-image: linear-gradient(135deg, #f6d7ff, #b453cf);
}

.rarity-indicator.bronze {
  background-color: rgb(139, 69, 19);
}
</style>
