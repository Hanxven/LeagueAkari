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
@import '../toolkit-styles.less';
</style>
