<template>
  <div class="ongoing-game-page">
    <NScrollbar x-scrollable>
      <div class="inner-container">
        <div class="ongoing-header">
          <NSelect
            placeholder="队列"
            style="width: 160px"
            size="small"
            :options="queueOptions"
          ></NSelect>
          <NRadioGroup class="view-type-btn-group" size="small" v-model:value="viewType">
            <NRadioButton value="match-history">战绩</NRadioButton>
            <NRadioButton value="chart">图表</NRadioButton>
          </NRadioGroup>
        </div>
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

// 维持每个卡片元素的偶数宽度，= 4 * gap + 5 * 1fr
@container-width: 1016px;

.inner-container {
  position: relative;
  height: 100%;
  width: @container-width;
  margin: 0 auto;

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
  flex-wrap: wrap;
  margin-top: 4px;
  gap: 4px;

  .team-player-card {
    flex: 1;
    height: 340px;
    width: 0;
  }
}
</style>
