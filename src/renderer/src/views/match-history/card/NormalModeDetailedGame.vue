<template>
  <div class="detailed-game-card">
    <DefineDetailedTable v-slot="{ participants, aggregateTeamStats, teamId }">
      <table class="team">
        <thead class="team-header">
          <tr>
            <th class="header-info">
              {{ participants[0].stats.win ? '胜利' : '失败' }} ({{
                teamId === 100 ? '蓝色方' : '红色方'
              }})
            </th>
            <th class="header-kda">KDA</th>
            <th class="header-damage">伤害 / 承受</th>
            <th class="header-wards">眼</th>
            <th class="header-cs">补兵数</th>
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
                <div class="perks" v-if="p.stats.perkPrimaryStyle && p.stats.perkSubStyle">
                  <PerkDisplay :perk-id="p.stats.perk0" :size="18" />
                  <PerkstyleDisplay :perkstyle-id="p.stats.perkSubStyle" :size="18" />
                </div>
                <div class="name-and-rank">
                  <div class="name">
                    <span
                      class="name-span"
                      @click="handleToSummoner(p.identity.player.summonerId)"
                      :title="p.identity.player.summonerName"
                      >{{ p.identity.player.summonerName || p.identity.player.gameName || '<无名>'
                      }}{{ p.identity.player.summonerId === 0 ? ' (人机)' : '' }}</span
                    >
                  </div>
                </div>
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
            <td style="width: 150px">
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
            <td style="width: 40px">
              <div class="wards">
                <div :title="`控制守卫 ${p.stats.visionWardsBoughtInGame}`">
                  {{ p.stats.visionWardsBoughtInGame }}
                </div>
                <div :title="`放置 ${p.stats.wardsPlaced}, 排除 ${p.stats.wardsKilled}`">
                  {{ p.stats.wardsPlaced }} / {{ p.stats.wardsKilled }}
                </div>
              </div>
            </td>
            <td style="width: 90px">
              <div class="cs">
                <div
                  class="cs-count"
                  :class="{
                    best:
                      match.recordStats.maxTotalMinionsKilled &&
                      p.stats.totalMinionsKilled === match.recordStats.maxTotalMinionsKilled
                  }"
                >
                  {{ p.stats.totalMinionsKilled }}
                </div>
                <div>
                  每分钟
                  {{ (p.stats.totalMinionsKilled / ((game.gameDuration || 1) / 60)).toFixed(1) }}
                  个
                </div>
              </div>
            </td>
            <td class="cell-gold" style="width: 60px">
              <div
                class="gold"
                :title="p.stats.goldEarned.toString()"
                :class="{
                  best:
                    match.recordStats.maxGoldEarned &&
                    p.stats.goldEarned === match.recordStats.maxGoldEarned
                }"
              >
                {{ (p.stats.goldEarned / 1e3).toFixed(2) }} K
              </div>
            </td>
            <td style="width: 164px">
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
    <DetailedTable
      v-if="match.teams.team1.length > 0"
      :aggregate-team-stats="match.aggregateStats.team1"
      :team-id="100"
      :participants="match.teams.team1"
    />
    <div v-if="match.teams.team1.length > 0 && match.teams.team2.length" class="divider"></div>
    <DetailedTable
      style="margin-top: 4px"
      v-if="match.teams.team2.length > 0"
      :aggregate-team-stats="match.aggregateStats.team2"
      :team-id="200"
      :participants="match.teams.team2"
    />
  </div>
</template>

<script setup lang="ts">
import { createReusableTemplate } from '@vueuse/core'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import LcuImage from '@renderer/components/LcuImage.vue'
import ItemDisplay from '@renderer/components/widgets/ItemDisplay.vue'
import PerkDisplay from '@renderer/components/widgets/PerkDisplay.vue'
import PerkstyleDisplay from '@renderer/components/widgets/PerkstyleDisplay.vue'
import SummonerSpellDisplay from '@renderer/components/widgets/SummonerSpellDisplay.vue'
import { championIcon } from '@renderer/features/game-data'
import { Game, ParticipantIdentity } from '@renderer/types/match-history'

import DamageMetricsBar from '../widgets/DamageMetricsBar.vue'

const [DefineDetailedTable, DetailedTable] = createReusableTemplate<{
  participants: (typeof match.value.teams)[keyof typeof match.value.teams]
  aggregateTeamStats: (typeof match.value.aggregateStats)[keyof typeof match.value.aggregateStats]
  teamId: number
}>({ inheritAttrs: false })

const props = defineProps<{
  game: Game
  selfId?: number
}>()

const match = computed(() => {
  const identities: Record<string, ParticipantIdentity> = {}
  props.game.participantIdentities.forEach((identity) => {
    identities[identity.participantId] = identity
  })

  const all = props.game.participants.map((participant) => ({
    ...participant,
    isSelf: identities[participant.participantId].player.summonerId === props.selfId,
    identity: identities[participant.participantId]
  }))

  const teamStats = {
    team1: { kills: 0, deaths: 0, assists: 0, totalDamageDealtToChampions: 0, totalDamageTaken: 0 },
    team2: { kills: 0, deaths: 0, assists: 0, totalDamageDealtToChampions: 0, totalDamageTaken: 0 }
  }

  const recordStats = {
    maxTotalDamageDealtToChampions: 0,
    maxTotalDamageTaken: 0,
    maxGoldEarned: 0,
    maxTotalMinionsKilled: 0
  }

  all.forEach((p) => {
    let teamKey: string
    if (p.teamId === 100) {
      teamKey = 'team1'
    } else if (p.teamId === 200) {
      teamKey = 'team2'
    } else {
      return
    }
    teamStats[teamKey].kills += p.stats.kills
    teamStats[teamKey].deaths += p.stats.deaths
    teamStats[teamKey].assists += p.stats.assists
    teamStats[teamKey].totalDamageDealtToChampions += p.stats.totalDamageDealtToChampions
    teamStats[teamKey].totalDamageTaken += p.stats.totalDamageTaken

    recordStats.maxTotalDamageDealtToChampions = Math.max(
      recordStats.maxTotalDamageDealtToChampions,
      p.stats.totalDamageDealtToChampions
    )
    recordStats.maxTotalDamageTaken = Math.max(
      recordStats.maxTotalDamageTaken,
      p.stats.totalDamageTaken
    )
    recordStats.maxGoldEarned = Math.max(recordStats.maxGoldEarned, p.stats.goldEarned)
    recordStats.maxTotalMinionsKilled = Math.max(
      recordStats.maxTotalMinionsKilled,
      p.stats.totalMinionsKilled
    )
  })

  return {
    teams: {
      team1: all.filter((p) => p.teamId === 100),
      team2: all.filter((p) => p.teamId === 200)
    },
    aggregateStats: teamStats,
    recordStats: recordStats
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
  container: detailed-card / inline-size;
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

.summoner-spells,
.perks {
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
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;

    .name-span {
      cursor: pointer;
      transition: color 0.3s ease;
      &:hover {
        color: rgb(167, 167, 255);
      }
    }
  }

  .rank {
    font-size: 10px;
    color: rgb(159, 159, 159);
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

.wards {
  font-size: 12px;
}

.cs {
  font-size: 12px;

  .cs-count {
    font-weight: 700;
  }
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
  margin: 8px 0px;
}

.best {
  font-weight: 700;
  color: rgb(167, 167, 255);
}
</style>
