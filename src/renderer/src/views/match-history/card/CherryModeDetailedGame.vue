<template>
  <div class="detailed-game-card">
    <DefineDetailedTable v-slot="{ participants, aggregateTeamStats }">
      <table class="team">
        <thead class="team-header">
          <tr>
            <th class="header-info">
              {{ `第${chineseNumber[participants[0]?.stats.subteamPlacement - 1] ?? ' ? '}名` }} ({{
                participants[0].stats.subteamPlacement <= 2 ? '胜利' : '失败'
              }})
            </th>
            <th class="header-augments">增益</th>
            <th class="header-kda">KDA</th>
            <th class="header-damage">伤害 / 承受</th>
            <th class="header-gold">金币</th>
            <th class="header-items">物品</th>
          </tr>
        </thead>
        <tbody class="participants">
          <tr
            class="participant"
            :class="{ self: p.isSelf }"
            v-for="p of participants"
            :key="p.identity.player.summonerId"
          >
            <td style="min-width: 180px">
              <div class="info">
                <div class="champion">
                  <LcuImage class="champion-icon" :src="championIcon(p.championId)" />
                  <div class="champion-level">{{ p.stats.champLevel }}</div>
                </div>
                <div class="summoner-spells">
                  <SummonerSpellDisplay :spell-id="p.spell1Id" :size="18" />
                  <SummonerSpellDisplay :spell-id="p.spell2Id" :size="18" />
                </div>
                <div class="name-and-rank">
                  <div
                    :title="p.identity.player.summonerName"
                    class="name"
                    @click="handleToSummoner(p.identity.player.summonerId)"
                  >
                    {{ p.identity.player.summonerName || p.identity.player.gameName || '<无名>'
                    }}{{ p.identity.player.summonerId === 0 ? ' (人机)' : '' }}
                  </div>
                  <!-- <div class="rank">-</div> -->
                </div>
              </div>
            </td>
            <td style="width: 110px">
              <div class="augments">
                <AugmentDisplay :size="24" :augment-id="p.stats.playerAugment1" />
                <AugmentDisplay :size="24" :augment-id="p.stats.playerAugment2" />
                <AugmentDisplay :size="24" :augment-id="p.stats.playerAugment3" />
                <AugmentDisplay :size="24" :augment-id="p.stats.playerAugment4" />
              </div>
            </td>
            <td style="width: 100px">
              <div class="kda">
                <div class="kda-text">
                  {{ p.stats.kills }}/{{ p.stats.deaths }}/{{ p.stats.assists }} ({{
                    (
                      ((p.stats.kills + p.stats.assists) / (aggregateTeamStats.kills || 1)) *
                      100
                    ).toFixed(0)
                  }}
                  %)
                </div>
                <div class="kda-ratio">
                  {{ ((p.stats.kills + p.stats.assists) / (p.stats.deaths || 1)).toFixed(2) }}
                </div>
              </div>
            </td>
            <td style="width: 140px">
              <div class="damage">
                <DamageMetricsBar
                  :baseline-damage="match.recordStats.maxTotalDamageDealtToChampions"
                  :total-damage="p.stats.totalDamageDealtToChampions"
                  :magic-damage="p.stats.magicDamageDealtToChampions"
                  :physical-damage="p.stats.physicalDamageDealtToChampions"
                  :true-damage="p.stats.trueDamageDealtToChampions"
                />
                <DamageMetricsBar
                  :baseline-damage="match.recordStats.maxTotalDamageTaken"
                  :total-damage="p.stats.totalDamageTaken"
                  :magic-damage="p.stats.magicalDamageTaken"
                  :physical-damage="p.stats.physicalDamageTaken"
                  :true-damage="p.stats.trueDamageTaken"
                />
              </div>
            </td>
            <td class="cell-gold" style="width: 76px">
              <div class="gold" :title="p.stats.goldEarned.toLocaleString()">
                {{ (p.stats.goldEarned / 1e3).toFixed(2) }} K
              </div>
            </td>
            <td style="width: 180px">
              <div class="items">
                <ItemDisplay :size="20" :item-id="p.stats.item0" />
                <ItemDisplay :size="20" :item-id="p.stats.item1" />
                <ItemDisplay :size="20" :item-id="p.stats.item2" />
                <ItemDisplay :size="20" :item-id="p.stats.item3" />
                <ItemDisplay :size="20" :item-id="p.stats.item4" />
                <ItemDisplay :size="20" :item-id="p.stats.item5" />
                <ItemDisplay :size="20" is-trinket :item-id="p.stats.item6" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </DefineDetailedTable>
    <template v-if="match.teams.placement0.length === 0">
      <DetailedTable
        :participants="match.teams.placement1"
        :aggregate-team-stats="match.aggregateStats.placement1"
      />
      <div class="divider"></div>
      <DetailedTable
        :participants="match.teams.placement2"
        :aggregate-team-stats="match.aggregateStats.placement2"
      />
      <div class="divider"></div>
      <DetailedTable
        :participants="match.teams.placement3"
        :aggregate-team-stats="match.aggregateStats.placement3"
      />
      <div class="divider"></div>
      <DetailedTable
        :participants="match.teams.placement4"
        :aggregate-team-stats="match.aggregateStats.placement4"
      />
    </template>
    <template v-else>
      <DetailedTable
        :participants="match.teams.placement0"
        :aggregate-team-stats="match.aggregateStats.placement0"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { Game, Participant, ParticipantIdentity } from '@shared/types/lcu/match-history'
import { createReusableTemplate } from '@vueuse/core'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import LcuImage from '@renderer/components/LcuImage.vue'
import AugmentDisplay from '@renderer/components/widgets/AugmentDisplay.vue'
import ItemDisplay from '@renderer/components/widgets/ItemDisplay.vue'
import SummonerSpellDisplay from '@renderer/components/widgets/SummonerSpellDisplay.vue'
import { championIcon } from '@renderer/features/game-data'

import DamageMetricsBar from '../widgets/DamageMetricsBar.vue'

const [DefineDetailedTable, DetailedTable] = createReusableTemplate<{
  participants: typeof match.value.teams.placement1
  aggregateTeamStats: typeof match.value.aggregateStats.placement1
}>({ inheritAttrs: false })

const props = defineProps<{
  game: Game
  selfId?: number
  selfPuuid?: string
}>()

const chineseNumber = ['一', '二', '三', '四', '五', '六', '七', '八', '九']

const match = computed(() => {
  const identities: Record<string, ParticipantIdentity> = {}
  props.game.participantIdentities.forEach((identity) => {
    identities[identity.participantId] = identity
  })

  type ParticipantWithIdentity = Participant & { isSelf: boolean; identity: ParticipantIdentity }

  const all: ParticipantWithIdentity[] = props.game.participants.map((participant) => ({
    ...participant,
    isSelf:
      identities[participant.participantId].player.summonerId === props.selfId ||
      identities[participant.participantId].player.puuid === props.selfPuuid,
    identity: identities[participant.participantId]
  }))

  const placements: Record<string, ParticipantWithIdentity[]> = {
    placement0: [], // 只有在数据错误的时候，才会出现 placement0 的情况
    placement1: [],
    placement2: [],
    placement3: [],
    placement4: []
  }

  const aggregateStats = {
    placement0: {
      kills: 0,
      deaths: 0,
      assists: 0,
      totalDamageDealtToChampions: 0,
      totalDamageTaken: 0
    },
    placement1: {
      kills: 0,
      deaths: 0,
      assists: 0,
      totalDamageDealtToChampions: 0,
      totalDamageTaken: 0
    },
    placement2: {
      kills: 0,
      deaths: 0,
      assists: 0,
      totalDamageDealtToChampions: 0,
      totalDamageTaken: 0
    },
    placement3: {
      kills: 0,
      deaths: 0,
      assists: 0,
      totalDamageDealtToChampions: 0,
      totalDamageTaken: 0
    },
    placement4: {
      kills: 0,
      deaths: 0,
      assists: 0,
      totalDamageDealtToChampions: 0,
      totalDamageTaken: 0
    }
  }

  const recordStats = {
    maxTotalDamageDealtToChampions: 0,
    maxTotalDamageTaken: 0
  }

  all.forEach((p) => {
    const placementKey = `placement${p.stats.subteamPlacement}`
    placements[placementKey].push(p)

    aggregateStats[placementKey].kills += p.stats.kills
    aggregateStats[placementKey].deaths += p.stats.deaths
    aggregateStats[placementKey].assists += p.stats.assists
    aggregateStats[placementKey].totalDamageDealtToChampions += p.stats.totalDamageDealtToChampions
    aggregateStats[placementKey].totalDamageTaken += p.stats.totalDamageTaken

    recordStats.maxTotalDamageDealtToChampions = Math.max(
      recordStats.maxTotalDamageDealtToChampions,
      p.stats.totalDamageDealtToChampions
    )
    recordStats.maxTotalDamageTaken = Math.max(
      recordStats.maxTotalDamageTaken,
      p.stats.totalDamageTaken
    )
  })

  return {
    teams: placements,
    aggregateStats,
    recordStats
  }
})

const router = useRouter()

const handleToSummoner = (summonerId: number) => {
  // 人机不跳
  if (summonerId === 0) {
    return
  }
  router.replace(`/match-history/${summonerId}`)
}
</script>

<style lang="less" scoped>
.detailed-game-card {
  background-color: #343434;
  border-radius: 4px;
  overflow: hidden;
}

table,
th,
td {
  border: none;
}

td:first-child {
  padding-left: 8px;
}

td:last-child {
  padding-right: 8px;
}

table {
  border-spacing: 0;
}

.team-header {
  font-size: 12px;
  height: 30px;

  th {
    font-weight: normal;
  }

  .header-info {
    text-align: left;
    padding-left: 24px;
  }
}

.self {
  background-color: #474747;
}

.info {
  display: flex;
  gap: 4px;
}

.champion {
  position: relative;
  height: 40px;
  width: 40px;
}

.champion-icon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.champion-level {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  font-size: 12px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.621);
}

.summoner-spells {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 40px;
  width: 18px;
  gap: 4px;
}

.items {
  display: flex;
  justify-content: center;
  gap: 2px;
}

.kda,
.damage,
.cs,
.wards {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.name-and-rank {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 4px;
  flex-grow: 1;
  width: 0;

  .name {
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: color 0.3s ease;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;

    &:hover {
      color: rgb(167, 167, 255);
    }
  }

  .rank {
    font-size: 10px;
    color: rgb(159, 159, 159);
  }
}

.augments {
  display: flex;
  gap: 2px;
  justify-content: center;

  .augment {
    height: 20px;
    width: 20px;
    box-sizing: border-box;
    background-color: rgb(34, 34, 34);
    border-radius: 2px;
  }

  .augment.prismatic {
    border: 1px solid rgb(175, 141, 255);
  }

  .augment.gold {
    border: 1px solid rgb(255, 183, 0);
  }

  .augment.silver {
    border: 1px solid rgb(247, 247, 247);
  }

  .augment-empty {
    height: 20px;
    width: 20px;
    border-radius: 2px;
    background-color: rgb(34, 34, 34);
  }
}

.kda {
  color: rgb(214, 214, 214);

  .kda-text {
    font-size: 12px;
  }

  .kda-ratio {
    font-size: 12px;
    font-weight: 700;
  }
}

.damage {
  color: rgb(214, 214, 214);
  font-size: 12px;
}

.gold {
  text-align: center;
  font-size: 12px;
}

.team {
  width: 100%;
}

.participant {
  height: 50px;
}

.divider {
  background-color: rgb(76, 76, 76);
  height: 1px;
  margin: 12px 0px;
}
</style>
