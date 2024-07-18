<template>
  <div v-if="rankedEntry" class="ranked-display">
    
  </div>
  <div v-else class="ranked-display-empty">无内容</div>
</template>

<script lang="ts" setup>
import { RankedEntry } from '@shared/types/lcu/ranked'

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
</script>

<style lang="less" scoped>
.ranked-display {
  width: 160px;
  height: 96px;
  border: 1px solid #ffffff20;
  border-radius: 4px;
}

.ranked-display-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  color: rgb(65, 65, 65);
  width: 160px;
  height: 96px;
  border: 1px solid #ffffff20;
  border-radius: 4px;
}
</style>
