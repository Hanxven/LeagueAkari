<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <ChampionBench class="tool" />
        <GameflowInProcess class="tool" />
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { NScrollbar } from 'naive-ui'

import ChampionBench from './ChampionBench.vue'
import GameflowInProcess from './GameflowInProcess.vue'
</script>

<style lang="less" scoped>
.outer-wrapper {
  position: relative;
  height: 100%;
  max-width: 100%;
}

.inner-wrapper {
  padding: 24px;
  margin: 0 auto;
  max-width: 800px;

  :deep(.n-card) {
    background-color: transparent;
  }
}

.tool:not(:last-child) {
  margin-bottom: 8px;
}

.single-root {
  height: 100%;
}
</style>
