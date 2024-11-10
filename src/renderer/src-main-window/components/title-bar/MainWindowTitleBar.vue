<template>
  <div id="app-title-bar">
    <div class="app-logo">
      League Akari
      <span style="font-size: 12px; font-weight: normal; color: #fffa">(TEST)</span>
    </div>
    <div class="divider" />
    <!-- 为特定模块留出的位置 -->
    <div class="shard-area">
      <Transition name="fade">
        <KeepAlive>
          <MatchHistoryTabsTitle v-if="route.name === 'match-history'" />
          <OngoingGameTitle v-else-if="route.name === 'ongoing-game'" />
        </KeepAlive>
      </Transition>
    </div>
    <div class="divider" />
    <CommonButtons />
    <div class="divider" />
    <!-- 三大金刚按键 -->
    <TrafficButtons />
  </div>
</template>

<script setup lang="ts">
import { NIcon, NTooltip } from 'naive-ui'
import { useRoute } from 'vue-router'

import CommonButtons from './CommonButtons.vue'
import MatchHistoryTabsTitle from './MatchHistoryTabsTitle.vue'
import OngoingGameTitle from './OngoingGameTitle.vue'
import TrafficButtons from './TrafficButtons.vue'

const route = useRoute()
</script>

<style lang="less" scoped>
#app-title-bar {
  display: flex;
  position: relative;
  height: var(--title-bar-height);
  align-items: center;
  -webkit-app-region: drag;
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.app-logo {
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  padding: 4px;
  font-weight: bold;
  font-size: 14px;
  margin-left: 8px;
  -webkit-app-region: drag;
}

.shard-area {
  height: 100%;
  width: 0;
  flex: 1;
}

.divider {
  width: 1px;
  height: 40%;
  box-sizing: border-box;
  margin: 0 8px;
  background-color: rgba(255, 255, 255, 0.15);
}
</style>
