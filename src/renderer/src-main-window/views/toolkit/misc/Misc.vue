<template>
  <NScrollbar class="outer-wrapper" ref="el">
    <div class="inner-wrapper">
      <AvailabilityCheck class="tool" v-if="app.settings.isInKyokoMode" />
      <SummonerProfile class="tool" />
      <Spectate class="tool" />
      <ChatAvailability class="tool" />
      <FakeRanked class="tool" />
      <ChatStatusMessage class="tool" />
      <GameView class="tool" />
      <CustomKeyboardSequence class="tool" />
    </div>
  </NScrollbar>
</template>

<script setup lang="ts">
import { useAppStore } from '@renderer-shared/modules/app/store'
import { NScrollbar } from 'naive-ui'

import AvailabilityCheck from './AvailabilityCheck.vue'
import ChatAvailability from './ChatAvailability.vue'
import ChatStatusMessage from './ChatStatusMessage.vue'
import CustomKeyboardSequence from './CustomKeyboardSequence.vue'
import FakeRanked from './FakeRanked.vue'
import GameView from './GameView.vue'
import Spectate from './Spectate.vue'
import SummonerProfile from './SummonerProfile.vue'

const app = useAppStore()

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
</style>
