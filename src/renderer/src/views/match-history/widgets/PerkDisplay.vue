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
    <div style="width: 460px" class="info">
      <LcuImage class="image" :src="gameData.perks[perkId].iconPath" />
      <div class="right-side">{{ gameData.perks[perkId].name }}</div>
    </div>
    <div style="max-width: 460px" lol-view v-html="gameData.perks[perkId].longDesc"></div>
  </NPopover>
  <div
    v-else
    :style="{ width: `${size}px`, height: `${size}px` }"
    v-bind="$attrs"
    class="empty"
  ></div>
</template>

<script setup lang="ts">
import { NPopover } from 'naive-ui'

import LcuImage from '@renderer/components/LcuImage.vue'
import { useGameDataStore } from '@renderer/features/stores/lcu/game-data'

withDefaults(
  defineProps<{
    perkId?: number
    size?: number
  }>(),
  {
    size: 20
  }
)

const gameData = useGameDataStore()
</script>

<style lang="less" scoped>
.perk,
.empty {
  border-radius: 4px;
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
    font-weight: 700;
  }
}

.empty {
  background-color: rgb(34, 34, 34);
}
</style>
