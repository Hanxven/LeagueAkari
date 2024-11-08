<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <SummonerProfile class="tool" />
        <Spectate class="tool" />
        <ChatAvailability class="tool" />
        <FakeRanked class="tool" />
        <ChatStatusMessage class="tool" />
        <GameView class="tool" />
        <!-- <CustomKeyboardSequence class="tool" /> -->
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { NScrollbar } from 'naive-ui'

import ChatAvailability from './ChatAvailability.vue'
import ChatStatusMessage from './ChatStatusMessage.vue'
// import CustomKeyboardSequence from './CustomKeyboardSequence.vue'
import FakeRanked from './FakeRanked.vue'
import GameView from './GameView.vue'
import Spectate from './Spectate.vue'
import SummonerProfile from './SummonerProfile.vue'
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
