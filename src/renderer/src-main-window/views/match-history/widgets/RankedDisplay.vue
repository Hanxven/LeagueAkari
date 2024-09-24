<template>
  <div v-if="rankedEntry" class="ranked-wrapper" :class="{ small: small }">
    <div class="ranked-display">
      <div class="ranked-display-info">
      <div class="ranked-display-info-left">
        <img
          class="ranked-image"
          v-if="!small"
          :src="rankedImageMap[rankedEntry.tier] || rankedImageMap['UNRANKED']"
        />
      </div>
      <div class="ranked-display-info-right">
        <div class="ranked-info" :class="{ small: small }">
          <span class="ranked-name" v-if="rankedEntry.queueType !== 'CHERRY'">{{ formatTier }}</span>
          <span v-if="rankedEntry.ratedRating" class="wins"
          >{{ rankedEntry.wins }} 胜 {{ rankedEntry.ratedRating }} 分</span
          >
          <span v-else class="ranked-wins-lp"
          >{{ rankedEntry.wins }} 胜 {{ rankedEntry.leaguePoints }} LP</span
          >
          <div class="ranked-highest-content">
            <div
              class="ranked-highest"
              :class="{
            'highest-unranked':
              rankedEntry.previousSeasonHighestTier === '' ||
              rankedEntry.previousSeasonHighestTier === 'NA'
          }"
            >
              <span class="label" style="font-size: 10px;align-items: center;display: flex">最高</span>
                <div style="width: 15px;height: 15px" v-if="
                                  rankedEntry.previousSeasonHighestTier &&
                                  rankedMedalMap[rankedEntry.previousSeasonHighestTier]">
                                  <img
                                    :src="rankedMedalMap[rankedEntry.previousSeasonHighestTier]"
                                    class="ranked-medal"
                                  />
                </div>
                <span class="label" style="margin: 0px 0px 0px 2px;font-size: 10px;align-items: center;display: flex">{{ formatPreviousTier }}</span>
            </div>


          </div>
        </div>

      </div>
      </div>
      <div class="ranked-type">
        {{ QUEUE_TYPE_TEXT[rankedEntry.queueType] || rankedEntry.queueType }}
      </div>
    </div>
  </div>
  <div v-else class="ranked-display-empty">无内容</div>
</template>

<script lang="ts" setup>
import { RankedEntry } from '@shared/types/lcu/ranked'
import { QUEUE_TYPE_TEXT, TIER_TEXT } from '@shared/utils/ranked'
import { computed } from 'vue'

import RankedBronze from '@main-window/assets/ranked-icons-large/bronze.png'
import RankedChallenger from '@main-window/assets/ranked-icons-large/challenger.png'
import RankedDiamond from '@main-window/assets/ranked-icons-large/diamond.png'
import RankedEmerald from '@main-window/assets/ranked-icons-large/emerald.png'
import RankedGold from '@main-window/assets/ranked-icons-large/gold.png'
import RankedGrandmaster from '@main-window/assets/ranked-icons-large/grandmaster.png'
import RankedIron from '@main-window/assets/ranked-icons-large/iron.png'
import RankedMaster from '@main-window/assets/ranked-icons-large/master.png'
import RankedPlatinum from '@main-window/assets/ranked-icons-large/platinum.png'
import RankedSilver from '@main-window/assets/ranked-icons-large/silver.png'
import RankedNone from '@main-window/assets/ranked-icons-large/unranked.png'
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
  rankedEntry?: RankedEntry
  small?: boolean
}>()

const rankedImageMap: Record<string, string> = {
  UNRANKED: RankedNone,
  IRON: RankedIron,
  BRONZE: RankedBronze,
  SILVER: RankedSilver,
  GOLD: RankedGold,
  EMERALD: RankedEmerald,
  PLATINUM: RankedPlatinum,
  DIAMOND: RankedDiamond,
  MASTER: RankedMaster,
  GRANDMASTER: RankedGrandmaster,
  CHALLENGER: RankedChallenger
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

const formatTier = computed(() => {
  if (!props.rankedEntry) {
    return ''
  }

  const tier = TIER_TEXT[props.rankedEntry.tier] || props.rankedEntry.tier

  if (tier === '' || tier === 'NA') {
    return '未定级'
  }

  const division = props.rankedEntry.division

  if (division === '' || division === 'NA') {
    return tier
  }

  return `${tier} ${division}`
})

const formatPreviousTier = computed(() => {
  if (!props.rankedEntry) {
    return ''
  }

  const tier =
    TIER_TEXT[props.rankedEntry.previousSeasonHighestTier] ||
    props.rankedEntry.previousSeasonHighestTier

  if (tier === '' || tier === 'NA') {
    return '未定级'
  }

  const division = props.rankedEntry.previousSeasonHighestDivision

  if (division === '' || division === 'NA') {
    return tier
  }

  return `${tier} ${division}`
})
</script>

<style lang="less" scoped>
.ranked-wrapper {
  display: flex;
  position: relative;
  height: 108px;
  width: 200px;
  border-radius: 4px;
  align-items: center;
  justify-content: center;
  //background: white;

  &.small {
    width: 120px;
    height: 96px;
  }
}

.ranked-display {
  position: relative;
  top: 4px;
  display: flex;
  align-items: center;
  flex-direction: column;
}
.ranked-display-info {
  display: flex;
}

.ranked-display-info-left {
  display: flex;
  flex-direction: column;
}

.ranked-display-info-right {
}

.ranked-type {
  //position: absolute;
  top: 0;
  left: 0;
  //padding: 4px 8px;
  font-size: 12px;
  color: rgb(200, 200, 200);
  text-align: center;
}

.ranked-image,
.ranked-info {
  position: relative;
}

.ranked-image {
  width: 60px;
  height: 60px;
  margin-right: 10px;
  object-fit: contain;
}

.ranked-info {
  display: flex;
  flex-direction: column;
  width: 96px;

  &.small {
    width: unset;
  }

  .hint {
    font-size: 12px;
    color: rgb(130, 130, 130);
  }
}

.ranked-name {
  font-size: 14px;
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

.ranked-highest-content{
  text-align: center;
}

.ranked-highest {
  display: flex;
  font-size: 10px;
  color: rgb(200, 200, 200);


  .label {
    margin-right: 2px;
  }

  .ranked-medal {
    width: 15px;
    height: 15px;
    margin-right: 2px;
    vertical-align: bottom;
  }

  &.highest-unranked {
    color: rgb(119, 119, 119);
  }
}
</style>
