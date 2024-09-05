<template>
  <NPopover v-if="spellId && gameData.summonerSpells[spellId]" :delay="50">
    <template #trigger>
      <LcuImage
        :src="gameData.summonerSpells[spellId].iconPath"
        v-bind="$attrs"
        :style="{ width: `${size}px`, height: `${size}px` }"
        class="spell"
      />
    </template>
    <div style="max-width: 240px">
      <div class="name">{{ gameData.summonerSpells[spellId].name }}</div>
      <div class="cooldown">冷却时间: {{ gameData.summonerSpells[spellId].cooldown }} 秒</div>
      <div class="level">等级需求: {{ gameData.summonerSpells[spellId].summonerLevel }}</div>
      <div class="description">{{ gameData.summonerSpells[spellId].description }}</div>
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
  spellId?: number
  size?: number
}>()

const gameData = useGameDataStore()
</script>

<style lang="less" scoped>
.cooldown,
.description,
.level {
  font-size: 12px;
}

.cooldown,
.level {
  font-style: italic;
}

.level {
  margin-bottom: 2px;
}

.name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 2px;
}

.spell {
  border-radius: 2px;
}

.empty {
  border-radius: 2px;
  background-color: rgb(34, 34, 34);
}
</style>
