<template>
  <div id="app-title-bar">
    <div class="app-logo">
      <LeagueAkariSpan text="先占上位" />
    </div>
    <div class="divider" />
    <!-- 为特定模块留出的位置 -->
    <div class="shard-area" />
    <div class="divider" />
    <CommonButtons />
    <div class="divider" />
    <!-- 三大金刚按键 -->
    <TrafficButtons />
  </div>
</template>

<script setup lang="ts">
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useRoute } from 'vue-router'

import CommonButtons from './CommonButtons.vue'
import TrafficButtons from './TrafficButtons.vue'

const route = useRoute()

route.matched.forEach((record) => {
  console.log(record)
  record.name
})
</script>

<style lang="less" scoped>
#app-title-bar {
  display: flex;
  position: relative;
  height: var(--title-bar-height);
  align-items: center;
  z-index: 1e8;
  -webkit-app-region: drag;

  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.app-logo {
  width: 80px;
  text-align: center;
  font-weight: bold;
  font-size: 16px;
  margin-left: 8px;
}

.shard-area {
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
