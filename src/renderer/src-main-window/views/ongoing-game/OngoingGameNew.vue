<template>
  <div class="ongoing-game-page">
    <NScrollbar x-scrollable>
      <div class="inner-container">
        <div class="team-5x5">
          <PlayerInfoCardNew class="team-player-card" />
          <PlayerInfoCardNew class="team-player-card" />
          <PlayerInfoCardNew class="team-player-card" />
          <PlayerInfoCardNew class="team-player-card" />
          <PlayerInfoCardNew class="team-player-card" />
        </div>
        <div class="team-5x5">
          <PlayerInfoCardNew class="team-player-card" />
          <PlayerInfoCardNew class="team-player-card" />
          <PlayerInfoCardNew class="team-player-card" />
          <PlayerInfoCardNew class="team-player-card" />
          <PlayerInfoCardNew class="team-player-card" />
        </div>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { NRadioButton, NRadioGroup, NScrollbar, NSelect } from 'naive-ui'
import { ref } from 'vue'

import PlayerInfoCardNew from './PlayerInfoCardNew.vue'

const viewType = ref('chart')

const queueOptions = ref([
  {
    label: '当前队列',
    value: 'current'
  },
  {
    label: '单双排位',
    value: 'solo'
  },
  {
    label: '灵活排位',
    value: 'flex'
  },
  {
    label: '极地大乱斗',
    value: 'aram'
  },
  {
    label: '无限火力',
    value: 'urf'
  },
  {
    label: '所有',
    value: 'all'
  }
])
</script>

<style lang="less" scoped>
.ongoing-game-page {
  height: 100%;
}

.inner-container {
  position: relative;
  height: 100%;
  margin: 0 auto;
  width: fit-content;

  .content {
    display: flex;
  }
}

.ongoing-header {
  position: sticky;
  z-index: 10;
  top: 0;
  display: flex;
  align-items: center;
  padding: 0 8px;
  height: 36px;
  background-color: rgba(63, 63, 63, 0.8);
  gap: 4px;
  justify-content: flex-end;
}

.team-5x5 {
  display: flex;
  flex-wrap: nowrap;
  margin-top: 4px;
  gap: 4px;
}
</style>
