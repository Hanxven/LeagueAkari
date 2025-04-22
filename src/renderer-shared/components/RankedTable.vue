<template>
  <table class="ranked-stats-table">
    <colgroup></colgroup>
    <thead>
      <tr>
        <th>{{ t('RankedTable.queueType') }}</th>
        <th>{{ t('RankedTable.tier') }}</th>
        <th>{{ t('RankedTable.leaguePoints') }}</th>
        <th>{{ t('RankedTable.wins') }}</th>
        <th>{{ t('RankedTable.losses') }}</th>
        <th>{{ t('RankedTable.previousSeasonEndTier') }}</th>
        <th>{{ t('RankedTable.previousSeasonHighestTier') }}</th>
        <th>{{ t('RankedTable.highestTier') }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="r of sortedQueues" :key="r.queueType">
        <td>{{ formatQueueName(r.queueType) }}</td>
        <td>
          <div class="tier">
            <img
              v-if="RANKED_MEDAL_MAP[r.tier]"
              :src="RANKED_MEDAL_MAP[r.tier]"
              alt="tier"
              class="tier-img"
            />
            {{ formatTierDivision(r, 'current') }}
          </div>
        </td>
        <td>{{ formatPoints(r) }}</td>
        <td>{{ formatWins(r) }}</td>
        <td>{{ formatLosses(r.losses) }}</td>
        <td>
          <div class="tier">
            <img
              v-if="RANKED_MEDAL_MAP[r.previousSeasonEndTier]"
              :src="RANKED_MEDAL_MAP[r.previousSeasonEndTier]"
              alt="tier"
              class="tier-img"
            />
            {{ formatTierDivision(r, 'previousSeasonEnd') }}
          </div>
        </td>
        <td>
          <div class="tier">
            <img
              v-if="RANKED_MEDAL_MAP[r.previousSeasonHighestTier]"
              :src="RANKED_MEDAL_MAP[r.previousSeasonHighestTier]"
              alt="tier"
              class="tier-img"
            />
            {{ formatTierDivision(r, 'previousSeasonHighest') }}
          </div>
        </td>
        <td>
          <div class="tier">
            <img
              v-if="RANKED_MEDAL_MAP[r.highestTier]"
              :src="RANKED_MEDAL_MAP[r.highestTier]"
              alt="tier"
              class="tier-img"
            />
            {{ formatTierDivision(r, 'highest') }}
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
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
import { RankedEntry, RankedStats } from '@shared/types/league-client/ranked'
import { useTranslation } from 'i18next-vue'

const { rankedStats } = defineProps<{
  rankedStats: RankedStats
}>()

const { t } = useTranslation()

const RANKED_MEDAL_MAP: Record<string, string> = {
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

const QUEUE_TYPE_ORDER: Record<string, number> = {
  RANKED_SOLO_5x5: 1,
  RANKED_FLEX_SR: 2,
  CHERRY: 3,
  RANKED_TFT: 4,
  RANKED_TFT_TURBO: 5,
  RANKED_TFT_DOUBLE_UP: 6
}

const formatQueueName = (queueType: string) => {
  return t(`common.queueTypes.${queueType}`, queueType)
}

const formatWins = (entry: RankedEntry) => {
  if (entry.queueType === 'CHERRY') {
    return entry.ratedTier === 'NONE' ? '—' : entry.wins
  }

  if (!entry.tier || entry.tier === 'NA') {
    return '—'
  }

  return entry.wins
}

const formatPoints = (entry: RankedEntry) => {
  if (entry.queueType === 'CHERRY') {
    return entry.ratedTier === 'NONE' ? '—' : entry.ratedRating
  }

  if (!entry.tier || entry.tier === 'NA') {
    return '—'
  }

  return entry.leaguePoints
}

const sortedQueues = rankedStats.queues.sort((a, b) => {
  return QUEUE_TYPE_ORDER[a.queueType] - QUEUE_TYPE_ORDER[b.queueType]
})

const formatTierDivision = (entry: RankedEntry, type: string) => {
  let tier: string
  let division: string
  switch (type) {
    case 'current':
      tier = entry.tier
      division = entry.division
      break
    case 'previousSeasonEnd':
      tier = entry.previousSeasonEndTier
      division = entry.previousSeasonEndDivision
      break
    case 'previousSeasonHighest':
      tier = entry.previousSeasonHighestTier
      division = entry.previousSeasonHighestDivision
      break
    case 'highest':
      tier = entry.highestTier
      division = entry.highestDivision
      break
    default:
      tier = ''
      division = ''
  }

  if (!tier || tier === 'NA') {
    return '—'
  }

  if (!division || division === 'NA') {
    return t(`common.tiers.${tier}`, tier)
  }

  return `${t(`common.tiers.${tier}`, tier)} ${division}`
}

const formatLosses = (losses: number) => {
  return losses || '—'
}
</script>

<style lang="less" scoped>
// 轻度边框
.ranked-stats-table {
  border-collapse: collapse;
  border-spacing: 0;
  border: 1px solid #ffffff40;
  font-size: 12px;
  color: #d4d4d4;

  th,
  td {
    border: 1px solid #ffffff40;
    padding: 0 4px;
    text-align: center;
  }

  .tier {
    display: flex;
    gap: 4px;
    align-items: center;
    justify-content: center;

    .tier-img {
      width: 16px;
      height: 16px;
      vertical-align: middle;
    }
  }
}
</style>
