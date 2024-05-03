<template>
  <div class="la-placeholder">
    <LeagueAkariSpan />
    <span class="sub">当前没有进行中的活动</span>
  </div>
</template>

<script setup lang="ts">
import LeagueAkariSpan from '@shared/renderer/components/LeagueAkariSpan.vue'
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
