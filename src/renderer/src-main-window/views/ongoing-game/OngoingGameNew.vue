<template>
  <div class="ongoing-game-page">
    <NScrollbar x-scrollable ref="scrollRef" >
      <div class="inner-container">
        <div class="ongoing-header"></div>
        <div class="team1">
          <div class="team-player"></div>
          <div class="team-player"></div>
          <div class="team-player"></div>
          <div class="team-player"></div>
          <div class="team-player"></div>
        </div>
        <div class="team1">
          <div class="team-player"></div>
          <div class="team-player"></div>
          <div class="team-player"></div>
          <div class="team-player"></div>
          <div class="team-player"></div>
        </div>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { NScrollbar } from 'naive-ui'
</script>

<style lang="less" scoped>
.ongoing-game-page {
  height: 100%;
}

@container-width: 1064px;

.inner-container {
  height: 100%;
  width: @container-width;
  margin: 0 auto;

  .content {
    display: flex;
  }
}

.ongoing-header {
  height: 36px;
  background-color: rgba(108, 108, 108, 0.429);
}

.team1 {
  display: flex;
  flex-wrap: wrap;
  margin-top: 4px;
  gap: 4px;

  .team-player {
    flex: 1;
    height: 300px;
    background-color: rgba(45, 104, 57, 0.429);
  }
}
</style>
