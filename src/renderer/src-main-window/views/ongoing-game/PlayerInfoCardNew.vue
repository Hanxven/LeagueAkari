<template>
  <div class="player-card">
    <div class="profile">
      <PositionBottom class="profile-position" />
      <LcuImage class="profile-image" :src="championIcon(4)" />
      <div class="profile-name">
        <span class="game-name">泉此方 x 柊镜</span>
        <span class="tag-line">#Kagami</span>
      </div>
    </div>
    <div class="tags">
      <div class="tag">10 连胜</div>
      <div class="tag">标记的玩家</div>
      <div class="tag">生涯不公开</div>
      <div class="tag">3.48 KDA</div>
    </div>
    <div class="ranked-stats">
      <div class="ranked-solo">
        <span class="label">单双排位</span>
        <div class="rank">
          <img class="rank-medal" :src="rankedMedalMap['MASTER']" />
          <span class="rank-name">海之眷顾 II</span>
        </div>
      </div>
      <div class="ranked-flex">
        <span class="label">灵活排位</span>
        <div class="rank">
          <img class="rank-medal" :src="rankedMedalMap['MASTER']" />
          <span class="rank-name">经验修补 III</span>
        </div>
      </div>
    </div>
    <div class="mastery">
      <span class="mastery-label">高成就点</span>
      <div class="mastery-items">
        <LcuImage class="mastery-image" :src="championIcon(4)" />
        <LcuImage class="mastery-image" :src="championIcon(4)" />
        <LcuImage class="mastery-image" :src="championIcon(4)" />
        <LcuImage class="mastery-image" :src="championIcon(4)" />
        <LcuImage class="mastery-image" :src="championIcon(4)" />
        <LcuImage class="mastery-image" :src="championIcon(4)" />
        <LcuImage class="mastery-image" :src="championIcon(4)" />
      </div>
    </div>
    <div class="recently-used-champions">
      <span class="r-label">近期使用</span>
      <div class="r-champions">
        <LcuImage class="r-champion-image" :src="championIcon(4)" />
        <LcuImage class="r-champion-image" :src="championIcon(4)" />
        <LcuImage class="r-champion-image" :src="championIcon(4)" />
        <LcuImage class="r-champion-image" :src="championIcon(4)" />
        <LcuImage class="r-champion-image" :src="championIcon(4)" />
        <LcuImage class="r-champion-image" :src="championIcon(4)" />
        <LcuImage class="r-champion-image" :src="championIcon(4)" />
      </div>
    </div>
    <div class="match-history">
      <NVirtualList :items="items" style="height: 100%" :item-size="30">
        <template #default="{ item }">
          <div
            class="match-history-item"
            style="height: 28px; background-color: red; margin-bottom: 2px"
          >
            <LcuImage class="image" :src="championIcon(1)" />
            <div style="width: 56px">
              <div class="mode">测试模式</div>
              <div class="time">03 26 一</div>
            </div>
            <span class="k-d-a">1/3/4</span>
          </div>
        </template>
      </NVirtualList>
    </div>
    <!-- <div class="charts">
      <Radar :data="data" :options="options" />
    </div> -->
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import { championIcon } from '@shared/renderer/modules/game-data'
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
  background-color: rgba(45, 104, 57, 0.429);
  box-sizing: border-box;
  padding: 4px;
}

.profile {
  position: relative;
  display: flex;
  width: 100%;

  .profile-position {
    position: absolute;
    width: 16px;
    height: 16px;
    bottom: 0px;
    left: 8px;
  }

  .profile-name {
    display: flex;
    margin-left: 4px;
    align-items: flex-end;
    flex: 1;
    width: 0;

    .game-name {
      font-size: 12px;
      color: #fff;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .tag-line {
      font-size: 11px;
      color: #adadad;
      margin-left: 4px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }

  .profile-image {
    width: 24px;
    height: 24px;
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: 4px;

  background-color: rgb(37, 103, 49);

  .tag {
    display: flex;
    font-size: 10px;
    background-color: rgb(145, 90, 39);
    border-radius: 2px;
    padding: 0 4px;
  }
}

.ranked-stats {
  display: flex;
  margin-top: 4px;
  gap: 2px;

  .ranked,
  .ranked-flex {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
  }

  .label {
    font-size: 11px;
    color: #b3b3b3;
  }

  .rank {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #fff;

    .rank-medal {
      width: 16px;
      height: 16px;
      margin-right: 2px;
    }

    .rank-name {
      font-size: 12px;
      color: #d3d3d3;
      font-weight: bold;
    }
  }
}

.mastery {
  display: flex;
  align-items: center;
  margin-top: 4px;

  .mastery-label {
    font-size: 12px;
    color: #d3d3d3;
    margin-right: 4px;
    vertical-align: middle;
    flex: 1;
  }

  .mastery-items {
    display: flex;
    gap: 2px;
  }

  .mastery-image {
    width: 18px;
    height: 18px;
  }
}

.recently-used-champions {
  display: flex;
  align-items: center;
  margin-top: 4px;

  .r-label {
    font-size: 12px;
    color: #d3d3d3;
    margin-right: 4px;
    vertical-align: middle;
    flex: 1;
  }

  .r-champions {
    display: flex;
    gap: 2px;
  }

  .r-champion-image {
    width: 18px;
    height: 18px;
  }
}

.charts {
  flex: 1;
  width: 100%;
  height: 0;
  justify-content: center;
}

.match-history {
  flex: 1;
  width: 100%;
  height: 0;
  margin-top: 4px;

  .match-history-item {
    display: flex;
    align-items: center;
    padding: 0 2px;
    border-radius: 2px;
    margin-right: 2px;
    cursor: pointer;
    transition: all 0.3s ease;

    .image {
      height: 24px;
      width: 24px;
      margin-right: 4px;
    }

    .mode,
    .time {
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      font-size: 10px;
      line-height: 12px;
    }

    .k-d-a {
      font-size: 12px;
      margin-left: 4px;
    }
  }

  .match-history-item:hover {
    filter: brightness(1.1);
  }

  .match-history-item.win {
    background-color: rgba(46, 148, 47, 0.2);
  }

  .match-history-item.lose {
    background-color: rgba(188, 53, 41, 0.2);
  }

  .match-history-item.remake {
    background-color: rgba(255, 255, 255, 0.114);
  }
}
</style>
