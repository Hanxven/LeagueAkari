<template>
  <div v-if="rankedEntry" class="ranked-wrapper" :class="{ small: small }">
    <div class="ranked-type">
      {{ t(`common.queueTypes.${rankedEntry.queueType}`, rankedEntry.queueType) }}
    </div>
    <div class="ranked-display">
      <div class="ranked-image-container" v-if="!small">
        <img
          class="ranked-image"
          :src="rankedImageMap[rankedEntry.tier] || rankedImageMap['UNRANKED']"
        />
      </div>
      <div class="ranked-info" :class="{ small: small }">
        <span class="ranked-name" v-if="rankedEntry.queueType !== 'CHERRY'">{{ formatTier }}</span>
        <span v-if="rankedEntry.ratedRating" class="wins"
          >{{ rankedEntry.wins }} {{ t('RankedDisplay.win') }} {{ rankedEntry.ratedRating }}
          {{ t('RankedDisplay.point') }}</span
        >
        <span v-else class="ranked-wins-lp"
          >{{ rankedEntry.wins }} {{ t('RankedDisplay.win') }}
          {{ rankedEntry.leaguePoints }} LP</span
        >
        <div
          class="ranked-highest"
          :class="{
            'highest-unranked':
              rankedEntry.previousSeasonHighestTier === '' ||
              rankedEntry.previousSeasonHighestTier === 'NA'
          }"
        >
          <span class="label">{{ t('RankedDisplay.highest') }}</span>
          <div class="content">
            <img
              v-if="
                rankedEntry.previousSeasonHighestTier &&
                rankedMedalMap[rankedEntry.previousSeasonHighestTier]
              "
              :src="rankedMedalMap[rankedEntry.previousSeasonHighestTier]"
              class="ranked-medal"
            />
            <span>{{ formatPreviousTier }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="ranked-display-empty">{{ t('RankedDisplay.empty') }}</div>
</template>

<script lang="ts" setup>
import RankedBronze from '@renderer-shared/assets/ranked-icons-large/bronze.png'
import RankedChallenger from '@renderer-shared/assets/ranked-icons-large/challenger.png'
import RankedDiamond from '@renderer-shared/assets/ranked-icons-large/diamond.png'
import RankedEmerald from '@renderer-shared/assets/ranked-icons-large/emerald.png'
import RankedGold from '@renderer-shared/assets/ranked-icons-large/gold.png'
import RankedGrandmaster from '@renderer-shared/assets/ranked-icons-large/grandmaster.png'
import RankedIron from '@renderer-shared/assets/ranked-icons-large/iron.png'
import RankedMaster from '@renderer-shared/assets/ranked-icons-large/master.png'
import RankedPlatinum from '@renderer-shared/assets/ranked-icons-large/platinum.png'
import RankedSilver from '@renderer-shared/assets/ranked-icons-large/silver.png'
import RankedNone from '@renderer-shared/assets/ranked-icons-large/unranked.png'
import BronzeMedal from '@renderer-shared/assets/ranked-icons/bronze.png'
import ChallengerMedal from '@renderer-shared/assets/ranked-icons/challenger.png'
import DiamondMedal from '@renderer-shared/assets/ranked-icons/diamond.png'
import EmeraldMedal from '@renderer-shared/assets/ranked-icons/emerald.png'
import GoldMedal from '@renderer-shared/assets/ranked-icons/gold.png'
import GrandmasterMedal from '@renderer-shared/assets/ranked-icons/grandmaster.png'
import IronMedal from '@renderer-shared/assets/ranked-icons/iron.png'
import MasterMedal from '@renderer-shared/assets/ranked-icons/master.png'
import PlatinumMedal from '@renderer-shared/assets/ranked-icons/platinum.png'
import SilverMedal from '@renderer-shared/assets/ranked-icons/silver.png'
import { RankedEntry } from '@shared/types/league-client/ranked'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

const props = defineProps<{
  rankedEntry?: RankedEntry
  small?: boolean
}>()

const { t } = useTranslation()

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

  const tier = props.rankedEntry.tier
    ? t(`common.tiers.${props.rankedEntry.tier}`)
    : props.rankedEntry.tier

  if (tier === '' || tier === 'NA') {
    return t('RankedDisplay.unranked')
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

  const tier = props.rankedEntry.previousSeasonHighestTier
    ? t(`common.tiers.${props.rankedEntry.previousSeasonHighestTier}`)
    : props.rankedEntry.previousSeasonHighestTier

  if (tier === '' || tier === 'NA') {
    return t('RankedDisplay.unranked')
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
  width: 240px;
  border-radius: 4px;
  align-items: center;
  justify-content: center;

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
  justify-content: center;
  gap: 8px;
  width: 100%;
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
}

.ranked-image-container {
  position: relative;
  width: 64px;
  height: 48px;
}

.ranked-image {
  width: 144%;
  height: 144%;
  position: absolute;
  object-fit: contain;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ranked-info {
  display: flex;
  flex-direction: column;
  min-width: 64px; // 让它看起来更加居中

  &.small {
    width: unset;
  }

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

.ranked-highest {
  display: flex;
  font-size: 10px;
  color: rgb(200, 200, 200);
  align-items: center;

  .label {
    margin-right: 2px;
  }

  .ranked-medal {
    width: 16px;
    height: 16px;
    margin-right: 2px;
    vertical-align: middle;
  }

  &.highest-unranked {
    color: rgb(119, 119, 119);
  }
}
</style>
