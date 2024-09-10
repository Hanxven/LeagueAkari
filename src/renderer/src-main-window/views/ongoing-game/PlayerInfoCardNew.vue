<template>
  <div class="player-card">
    <div class="player-info">
      <div class="champion"></div>
      <div class="name-group">
        <div class="name-tag">
          <span class="name">测试名称测试名称测试</span>
          <span class="tag-line">#12345</span>
        </div>

      </div>
    </div>
    <!-- <div class="charts">
      <Radar :data="data" :options="options" />
    </div> -->
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { championIconUrl } from '@renderer-shared/modules/game-data'
import { ChartData, ChartOptions } from 'chart.js'
import { NVirtualList } from 'naive-ui'
import { Radar } from 'vue-chartjs'

import BronzeMedal from '@main-window/assets/ranked-icons/bronze.png'
import ChallengerMedal from '@main-window/assets/ranked-icons/challenger.png'
import DiamondMedal from '@main-window/assets/ranked-icons/diamond.png'
import EmeraldMedal from '@main-window/assets/ranked-icons/emerald.png'
import GoldMedal from '@main-window/assets/ranked-icons/gold.png'
import GrandmasterMedal from '@main-window/assets/ranked-icons/grandmaster.png'
import IronMedal from '@main-window/assets/ranked-icons/iron.png'
import MasterMedal from '@main-window/assets/ranked-icons/master.png'
import PlatinumMedal from '@main-window/assets/ranked-icons/platinum.png'
import SilverMedal from '@main-window/assets/ranked-icons/silver.png'
import PositionBottom from '@main-window/components/icons/position-icons/PositionBottom.vue'

const rankedMedalMap: Record<string, string> = {
  IRON: IronMedal,
  BRONZE: BronzeMedal,
  SILVER: SilverMedal,
  GOLD: GoldMedal,
  PLATINUM: PlatinumMedal,
  EMERALD: EmeraldMedal,
  DIAMOND: DiamondMedal,
  MASTER: MasterMedal,
  GRANDMASTER: GrandmasterMedal,
  CHALLENGER: ChallengerMedal
}

const data: ChartData<'radar'> = {
  labels: ['伤害', '承受', 'KDA', '参团', '经济', '补兵'],
  datasets: [
    {
      label: '百分比',
      data: [65, 59, 100, 67, 77, 24],
      fill: true,
      backgroundColor: '#63e2b710',
      borderColor: '#63e2b7',
      pointBackgroundColor: '#4cb1c6',
      pointBorderColor: '#4cc69d',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(255, 99, 132)'
    }
  ]
}

const options: ChartOptions<'radar'> = {
  elements: {
    line: {
      borderWidth: 2
    }
  },
  scales: {
    r: {
      display: true,
      angleLines: {
        display: false
      },
      ticks: {
        display: false,
        count: 4
      },
      grid: {
        color: '#fff2',
        lineWidth: 1
      },
      pointLabels: {
        color: '#fffa',
        padding: 4
      },
      suggestedMin: 0,
      suggestedMax: 100
    }
  },
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (tooltipItem) => {
          let label = tooltipItem.dataset.label || ''
          if (label) {
            label += ': '
          }
          if (tooltipItem.raw !== null) {
            label += tooltipItem.raw + ' %'
          }
          return label
        }
      }
    }
  }
}
const items = Array.from({ length: 100 }, (_, i) => ({
  key: `${i}`,
  value: i
}))
</script>

<style lang="less" scoped>
.player-card {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 8px;
  width: 240px;
  height: 360px;
  border-radius: 4px;
  box-sizing: border-box;
  border: 1px dashed white;
}

.player-info {
  display: flex;

  .champion {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background-color: #fff;
    margin-right: 8px;
  }

  .name-group {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 0;

    .name-tag {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: filter 0.3s;
      cursor: pointer;

      &:hover {
        filter: brightness(1.2);
      }
    }

    .name {
      font-weight: bold;
      font-size: 13px;
      color: #e8e8e8;
    }

    .tag-line {
      font-size: 12px;
      color: #999;
      margin-left: 4px;
    }
  }
}

.charts {
  flex: 1;
  width: 100%;
  height: 0;
  justify-content: center;
}
</style>
