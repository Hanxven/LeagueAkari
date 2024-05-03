<template>
  <NCard v-if="isCustomGame !== null" size="small">
    <NFlex align="center" v-if="!isCustomGame">
      <span class="label" style="flex: 1">退出游戏</span>
      <NButton size="tiny" type="warning" secondary @click="handleDodge">秒退</NButton>
    </NFlex>
  </NCard>
</template>

<script setup lang="ts">
import { dodge } from '@shared/renderer/http-api/login'
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync/gameflow'
import { NButton, NCard, NFlex } from 'naive-ui'
import { computed } from 'vue'

const gameflow = useGameflowStore()

const isCustomGame = computed(() => {
  if (!gameflow.session) {
    return null
  }

  return gameflow.session.gameData.isCustomGame
})

const handleDodge = async () => {
  try {
    await dodge()
  } catch (error) {}
}
</script>

<style scoped lang="less">
.label {
  font-size: 10px;
  color: rgb(178, 178, 178);
}
</style>
