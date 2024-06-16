<template>
  <div class="la-placeholder">
    <LeagueAkariSpan />
    <span class="sub" v-if="gameflow.phase === 'InProgress'">游戏进行中</span>
    <span class="sub" v-else>当前没有进行中的活动</span>
  </div>
</template>

<script setup lang="ts">
import LeagueAkariSpan from '@shared/renderer/components/LeagueAkariSpan.vue'
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync-new/gameflow';

const gameflow = useGameflowStore()
</script>

<style lang="less" scoped>
.la-placeholder {
  display: flex;
  position: relative;
  flex-direction: column;
  top: calc(var(--title-bar-height) * -0.5);
  color: #8d8d8d;
  font-size: 14px;
  font-weight: 700;
  height: 100%;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.sub {
  font-size: 12px;
  font-weight: normal;
}
</style>
