<template>
  <template v-if="showingRank">
    <NPopover placement="bottom" :disabled="!simple && sortedRankedQueues.length <= 1">
      <template #trigger>
        <div v-bind="$attrs" class="summoner-rank">
          <img
            v-if="showingRank.tier && rankedMedalMap[showingRank.tier]"
            :src="rankedMedalMap[showingRank.tier]"
            class="ranked-medal"
          />
          <span>
            {{ formatRankText(showingRank, simple) }}
          </span>
        </div>
      </template>
      <div class="summoner-rank-popover" v-for="q of sortedRankedQueues" :key="q.queueType">
        {{ formatRankText(q) }}
      </div>
    </NPopover>
  </template>
  <div class="summoner-rank" v-else>无段位</div>
</template>

<script setup lang="ts">
import { RankedEntry, RankedStats } from '@shared/types/lcu/ranked'
import { NPopover } from 'naive-ui'
import { computed } from 'vue'

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

const props = defineProps<{
  ranked: RankedStats
  simple?: boolean
  queueType?: string
}>()

const queueTypeText: Record<string, string> = {
  RANKED_FLEX_SR: '灵活排位',
  RANKED_SOLO_5x5: '单双排位',
  RANKED_FLEX_TT: '灵活排位 扭曲丛林',
  RANKED_TFT: '云顶之弈',
  RANKED_TFT_TURBO: '云顶之弈 Turbo',
  RANKED_TFT_DOUBLE_UP: '云顶之弈 Double',
  CHERRY: '斗魂竞技场'
}

// 越大的值代表更高的优先级
const queueOrderMap = {
  RANKED_SOLO_5x5: 1100,
  RANKED_FLEX_SR: 1050,
  RANKED_FLEX_TT: 1010,
  RANKED_TFT: 550,
  RANKED_TFT_TURBO: 540,
  RANKED_TFT_DOUBLE_UP: 530,
  CHERRY: 150
}

const tierOrderMap = {
  NA: 0,
  IRON: 1,
  BRONZE: 2,
  SILVER: 3,
  GOLD: 4,
  PLATINUM: 5,
  EMERALD: 6,
  DIAMOND: 7,
  MASTER: 8,
  GRANDMASTER: 9,
  CHALLENGER: 100
}

const tierDivisionOrderMap = {
  NA: 0,
  V: 1,
  IV: 2,
  III: 3,
  II: 4,
  I: 5
}

// 无段位时，为空字符串
const tierTextMap: Record<string, string> = {
  IRON: '坚韧黑铁',
  BRONZE: '英勇黄铜', // 实际上应该是青铜，黄铜是 brass
  SILVER: '不屈白银',
  GOLD: '荣耀黄金',
  PLATINUM: '华贵铂金',
  EMERALD: '流光翡翠',
  DIAMOND: '璀璨钻石',
  MASTER: '超凡大师',
  GRANDMASTER: '傲世宗师',
  CHALLENGER: '最强王者'
}

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

const sortedRankedQueues = computed(() => {
  return props.ranked.queues
    .toSorted((a, b) => {
      let aQueue = queueOrderMap[a.queueType] || 0
      let bQueue = queueOrderMap[b.queueType] || 0

      if (a.queueType === props.queueType) {
        aQueue = 1e7
      }

      if (b.queueType === props.queueType) {
        bQueue = 1e7
      }

      const aTier = tierOrderMap[a.tier] || 0
      const apTier = tierOrderMap[a.previousSeasonHighestTier] || 0
      const bTier = tierOrderMap[b.tier] || 0
      const bpTier = tierOrderMap[b.previousSeasonHighestTier] || 0
      const aDivision = tierDivisionOrderMap[a.division] || 0
      const bDivision = tierDivisionOrderMap[b.division] || 0
      const apDivision = tierDivisionOrderMap[a.previousSeasonHighestDivision] || 0
      const bpDivision = tierDivisionOrderMap[b.previousSeasonHighestDivision] || 0

      if (aQueue !== bQueue) {
        return bQueue - aQueue
      }

      if (a.tier && b.tier) {
        if (aTier !== bTier) {
          return bTier - aTier
        }

        return bDivision - aDivision
      } else {
        if (apTier !== bpTier) {
          return bpTier - apTier
        }

        return bpDivision - apDivision
      }
    })
    .filter((q) => q.tier || q.highestTier || q.previousSeasonHighestTier)
})

const showingRank = computed(() => {
  return sortedRankedQueues.value.find(
    (q) => q.tier || q.highestTier || q.previousSeasonHighestTier
  )
})

const formatRankText = (rank: RankedEntry, simple = false) => {
  const tier = tierTextMap[rank.tier]
  const queueType = queueTypeText[rank.queueType]
  const highestTier = tierTextMap[rank.highestTier]
  const previousHighestTier = tierTextMap[rank.previousSeasonHighestTier]

  const textArr: string[] = []

  textArr.push(queueType)

  if (tier) {
    if (rank.division === 'NA') {
      textArr.push(`${tier}`)
    } else {
      textArr.push(`${tier} ${rank.division}`)
    }
  }

  if (rank.ratedRating) {
    textArr.push(`${rank.ratedRating} 分`)
  }

  if (rank.leaguePoints) {
    textArr.push(`${rank.leaguePoints} LP`)
  }

  if (rank.wins && !simple) {
    textArr.push(`胜场 ${rank.wins}`)
  }

  if (highestTier && (!simple || textArr.length <= 1)) {
    if (rank.highestDivision === 'NA') {
      textArr.push(`赛季最高 ${highestTier}`)
    } else {
      textArr.push(`赛季最高 ${highestTier} ${rank.highestDivision}`)
    }
  }

  if (previousHighestTier && (!simple || textArr.length <= 1)) {
    if (rank.previousSeasonHighestDivision === 'NA') {
      textArr.push(`历史最高 ${previousHighestTier}`)
    } else {
      textArr.push(`历史最高 ${previousHighestTier} ${rank.previousSeasonHighestDivision}`)
    }
  }

  return textArr.join(' · ')
}
</script>

<style lang="less" scoped>
.summoner-rank {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: rgb(159, 159, 159);
  width: fit-content;
  gap: 4px;

  .ranked-medal {
    width: 16px;
    height: 16px;
  }
}

.summoner-rank-popover {
  font-size: 12px;
  color: rgb(255, 255, 255);
}

.tip {
  font-size: 12px;
  color: #adadad;
}

.icon {
  margin-left: 8px;
  font-size: 16px;
}
</style>
