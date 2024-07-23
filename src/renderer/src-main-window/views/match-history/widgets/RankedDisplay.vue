<template>
  <div v-if="rankedEntry" class="ranked-display">
    <div class="ranked-type">
      {{ queueTypeTextMap[rankedEntry.queueType] || rankedEntry.queueType }}
    </div>
    <img
      class="ranked-image"
      :src="rankedImageMap[rankedEntry.tier] || rankedImageMap['UNRANKED']"
    />
    <div class="ranked-info">
      <span class="ranked-name">{{ formatTier }}</span>
      <span class="ranked-wins-lp"
        >{{ rankedEntry.wins }} 胜 {{ rankedEntry.leaguePoints }} LP</span
      >
    </div>
  </div>
  <div v-else class="ranked-display-empty">无内容</div>
</template>

<script lang="ts" setup>
import { RankedEntry } from '@shared/types/lcu/ranked'
import { queueTypeTextMap, tierTextMap } from '@shared/utils/ranked'
import { computed } from 'vue'

import RankedBronze from '@main-window/assets/ranked-icons-large/bronze.png'
import RankedChallenger from '@main-window/assets/ranked-icons-large/challenger.png'
import RankedDiamond from '@main-window/assets/ranked-icons-large/diamond.png'
import RankedGold from '@main-window/assets/ranked-icons-large/gold.png'
import RankedGrandmaster from '@main-window/assets/ranked-icons-large/grandmaster.png'
import RankedIron from '@main-window/assets/ranked-icons-large/iron.png'
import RankedMaster from '@main-window/assets/ranked-icons-large/master.png'
import RankedPlatinum from '@main-window/assets/ranked-icons-large/platinum.png'
import RankedSilver from '@main-window/assets/ranked-icons-large/silver.png'
import RankedNone from '@main-window/assets/ranked-icons-large/unranked.png'

const props = defineProps<{
  rankedEntry?: RankedEntry
}>()

const rankedImageMap = {
  UNRANKED: RankedNone,
  IRON: RankedIron,
  BRONZE: RankedBronze,
  SILVER: RankedSilver,
  GOLD: RankedGold,
  PLATINUM: RankedPlatinum,
  DIAMOND: RankedDiamond,
  MASTER: RankedMaster,
  GRANDMASTER: RankedGrandmaster,
  CHALLENGER: RankedChallenger
}

const formatTier = computed(() => {
  if (!props.rankedEntry) {
    return ''
  }

  const tier = tierTextMap[props.rankedEntry.tier] || props.rankedEntry.tier

  if (tier === '' || tier === 'NA') {
    return '未定级'
  }

  const division = props.rankedEntry.division

  if (division === '' || division === 'NA') {
    return tier
  }

  return `${tier} ${division}`
})
</script>

<style lang="less" scoped>
.ranked-display {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 240px;
  height: 108px;
  background-color: #ffffff04;
  border-radius: 4px;
}

.ranked-type {
  position: absolute;
  top: 0;
  left: 0;
  padding: 4px 8px;
  font-size: 12px;
  color: rgb(200, 200, 200);
}

.ranked-image,
.ranked-info {
  position: relative;
  top: 6px;
}

.ranked-image {
  width: 96px;
  height: 72px;
  object-fit: contain;
}

.ranked-info {
  display: flex;
  flex-direction: column;
  width: 96px;

  .hint {
    font-size: 12px;
    color: rgb(130, 130, 130);
  }
}

.ranked-name {
  font-size: 16px;
  font-weight: bold;
}

.ranked-wins-lp {
  font-size: 12px;
  color: rgb(146, 146, 146);
}

.ranked-display-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  color: rgb(65, 65, 65);
  width: 240px;
  height: 108px;
  border: 1px solid #ffffff10;
  border-radius: 4px;
}
</style>
