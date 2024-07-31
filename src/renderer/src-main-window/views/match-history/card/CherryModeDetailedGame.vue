<template>
  <div class="detailed-game-card">
    <DefineDetailedTable v-slot="{ participants, aggregateTeamStats }">
      <table class="team">
        <thead class="team-header">
          <tr>
            <th class="header-info">
              {{ `第${chineseNumber[participants[0]?.stats.subteamPlacement - 1] ?? ' ? '}名` }} ({{
                participants[0].stats.subteamPlacement <= match.maxPlacement / 2 ? '胜利' : '失败'
              }})
            </th>
            <th class="header-augments">强化符文</th>
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
            :key="p.identity.player.puuid"
          >
            <td style="min-width: 100px">
              <div class="info">
                <div class="champion">
                  <LcuImage class="champion-icon" :src="championIcon(p.championId)" />
                  <div class="champion-level">{{ p.stats.champLevel }}</div>
                </div>
                <div class="summoner-spells">
                  <SummonerSpellDisplay :spell-id="p.spell1Id" :size="16" />
                  <SummonerSpellDisplay :spell-id="p.spell2Id" :size="16" />
                </div>
                <div class="name-and-rank">
                  <div
                    :title="
                      summonerName(
                        p.identity.player.gameName || p.identity.player.summonerName,
                        p.identity.player.tagLine
                      )
                    "
                    class="name"
                    @click="() => emits('toSummoner', p.identity.player.puuid)"
                  >
                    {{
                      summonerName(
                        p.identity.player.gameName || p.identity.player.summonerName,
                        p.identity.player.tagLine
                      )
                    }}{{ p.identity.player.puuid === EMPTY_PUUID ? ' (人机)' : '' }}
                  </div>
                  <!-- <div class="rank">-</div> -->
                </div>
              </div>
            </td>
            <td style="width: 92px">
              <div class="augments">
                <AugmentDisplay :size="18" :augment-id="p.stats.playerAugment1" />
                <AugmentDisplay :size="18" :augment-id="p.stats.playerAugment2" />
                <AugmentDisplay :size="18" :augment-id="p.stats.playerAugment3" />
                <AugmentDisplay :size="18" :augment-id="p.stats.playerAugment4" />
              </div>
            </td>
            <td style="width: 96px">
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
            <td style="width: 128px">
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
            <td class="cell-gold" style="width: 50px">
              <div class="gold" :title="p.stats.goldEarned.toLocaleString()">
                {{ (p.stats.goldEarned / 1e3).toFixed(2) }} K
              </div>
            </td>
            <td style="width: 162px">
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
      <template v-for="i of match.maxPlacement">
        <DetailedTable
          :participants="match.teams[`placement${i}`]"
          :aggregate-team-stats="match.aggregateStats[`placement${i}`]"
        />
        <div class="divider" v-if="i !== match.maxPlacement"></div>
      </template>
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
import { EMPTY_PUUID } from '@shared/constants/common'
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import AugmentDisplay from '@shared/renderer/components/widgets/AugmentDisplay.vue'
import ItemDisplay from '@shared/renderer/components/widgets/ItemDisplay.vue'
import SummonerSpellDisplay from '@shared/renderer/components/widgets/SummonerSpellDisplay.vue'
import { championIcon } from '@shared/renderer/modules/game-data'
import { Game, Participant, ParticipantIdentity } from '@shared/types/lcu/match-history'
import { summonerName } from '@shared/utils/name'
import { createReusableTemplate } from '@vueuse/core'
import { computed } from 'vue'

import DamageMetricsBar from '../widgets/DamageMetricsBar.vue'

const [DefineDetailedTable, DetailedTable] = createReusableTemplate<{
  participants: typeof match.value.teams.placement1
  aggregateTeamStats: typeof match.value.aggregateStats.placement1
}>({ inheritAttrs: false })

const props = defineProps<{
  game: Game
  selfPuuid?: string
}>()

const emits = defineEmits<{
  (e: 'toSummoner', puuid: string): void
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
    isSelf: identities[participant.participantId].player.puuid === props.selfPuuid,
    identity: identities[participant.participantId]
  }))

  const maxPlacement = all.reduce((p, c) => {
    return Math.max(c.stats.subteamPlacement, p)
  }, 0)

  const placements: Record<string, ParticipantWithIdentity[]> = {}

  for (let i = 0; i <= maxPlacement; i++) {
    placements[`placement${i}`] = []
  }

  const aggregateStats: Record<
    string,
    {
      kills: number
      deaths: number
      assists: number
      totalDamageDealtToChampions: number
      totalDamageTaken: number
    }
  > = {}

  for (let i = 0; i <= maxPlacement; i++) {
    aggregateStats[`placement${i}`] = {
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
    recordStats,
    maxPlacement
  }
})
</script>

<style lang="less" scoped>
.detailed-game-card {
  background-color: rgb(45, 45, 45);
  border-radius: 4px;
  width: 740px;
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
  font-size: 11px;
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
  align-items: center;
  gap: 4px;
}

.champion {
  position: relative;
  height: 34px;
  width: 34px;
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
  font-size: 10px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.621);
}

.summoner-spells {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 34px;
  width: 16px;
  gap: 2px;
}

.items {
  display: flex;
  justify-content: center;
  gap: 2px;
}

.kda,
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
    font-weight: bold;
    cursor: pointer;
    transition: color 0.3s ease;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;

    &:hover {
      color: #63e2b7;
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
    font-size: 11px;
  }

  .kda-ratio {
    font-size: 11px;
    font-weight: bold;
  }
}

.damage {
  display: flex;
  gap: 8px;
  justify-content: center;
  color: rgb(214, 214, 214);
  font-size: 11px;
}

.gold {
  text-align: center;
  font-size: 11px;
}

.team {
  width: 100%;
}

.participant {
  height: 40px;
}

.divider {
  background-color: rgb(76, 76, 76);
  height: 1px;
  margin: 4px 0px;
}
</style>
