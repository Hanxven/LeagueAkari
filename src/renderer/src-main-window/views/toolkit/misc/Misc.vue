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
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { NScrollbar } from 'naive-ui'

import ChatAvailability from './ChatAvailability.vue'
import ChatStatusMessage from './ChatStatusMessage.vue'
import FakeRanked from './FakeRanked.vue'
import GameView from './GameView.vue'
import Spectate from './Spectate.vue'
import SummonerProfile from './SummonerProfile.vue'
</script>

<style lang="less" scoped>
@import '../toolkit-styles.less';
</style>
