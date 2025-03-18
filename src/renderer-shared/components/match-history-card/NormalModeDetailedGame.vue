<template>
  <div class="detailed-game-card">
    <DefineDetailedTable v-slot="{ participants, aggregateTeamStats, teamId }">
      <table
        class="team"
        :class="{
          win: participants[0].stats.win,
          lose: !participants[0].stats.win,
          na:
            participants[0].stats.gameEndedInEarlySurrender ||
            game.endOfGameResult === 'Abort_AntiCheatExit'
        }"
      >
        <thead class="team-header">
          <tr>
            <th class="header-info">
              {{ participants[0].stats.win ? t('DetailedGame.win') : t('DetailedGame.lose') }} ({{
                teamId === 100 ? t('common.teams.100') : t('common.teams.200')
              }})
            </th>
            <th class="header-kda">{{ t('DetailedGame.header.kda') }}</th>
            <th class="header-damage">{{ t('DetailedGame.header.dmg') }}</th>
            <th class="header-wards">{{ t('DetailedGame.header.ward') }}</th>
            <th class="header-cs">{{ t('DetailedGame.header.cs') }}</th>
            <th class="header-gold">{{ t('DetailedGame.header.gold') }}</th>
            <th class="header-items">{{ t('DetailedGame.header.item') }}</th>
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
                  <LcuImage class="champion-icon" :src="championIconUri(p.championId)" />
                  <div class="champion-level">{{ p.stats.champLevel }}</div>
                </div>
                <div class="summoner-spells">
                  <SummonerSpellDisplay :spell-id="p.spell1Id" :size="16" />
                  <SummonerSpellDisplay :spell-id="p.spell2Id" :size="16" />
                </div>
                <div class="perks" v-if="p.stats.perkPrimaryStyle && p.stats.perkSubStyle">
                  <PerkDisplay :perk-id="p.stats.perk0" :size="16" />
                  <PerkstyleDisplay :perkstyle-id="p.stats.perkSubStyle" :size="16" />
                </div>
                <div class="name-and-rank">
                  <div class="name">
                    <span
                      class="name-span"
                      :class="{
                        'is-bot': p.identity.player.puuid === EMPTY_PUUID
                      }"
                      @click="() => emits('toSummoner', p.identity.player.puuid)"
                      @mouseup.prevent="(event) => handleMouseUp(event, p.identity.player.puuid)"
                      @mousedown="handleMouseDown"
                      :title="
                        masked(
                          summonerName(
                            p.identity.player.gameName || p.identity.player.summonerName,
                            p.identity.player.tagLine
                          ),
                          name(p.championId)
                        )
                      "
                      >{{
                        p.identity.player.puuid === EMPTY_PUUID
                          ? `(${t('DetailedGame.bot')}) `
                          : ''
                      }}{{
                        masked(
                          summonerName(
                            p.identity.player.gameName || p.identity.player.summonerName,
                            p.identity.player.tagLine
                          ),
                          name(p.championId)
                        )
                      }}</span
                    >
                  </div>
                </div>
              </div>
            </td>
            <td style="width: 92px">
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
            <td style="width: 124px">
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
                <div
                  :title="t('DetailedGame.controlWard', { count: p.stats.visionWardsBoughtInGame })"
                >
                  {{ p.stats.visionWardsBoughtInGame }}
                </div>
                <div
                  :title="
                    t('DetailedGame.wardPlaced', {
                      countV: p.stats.wardsPlaced,
                      cleared: p.stats.wardsKilled
                    })
                  "
                >
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
                      match.recordStats.maxCsOverall &&
                      p.csOverall === match.recordStats.maxCsOverall
                  }"
                >
                  {{ p.csOverall }}
                </div>
                <div>
                  {{
                    t('DetailedGame.csPerMinute', {
                      countV: (
                        (p.stats.totalMinionsKilled + p.stats.neutralMinionsKilled) /
                        ((game.gameDuration || 1) / 60)
                      ).toFixed(1)
                    })
                  }}
                </div>
              </div>
            </td>
            <td class="cell-gold" style="width: 50px">
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
    <DetailedTable
      v-if="match.teams.team1.length > 0"
      :aggregate-team-stats="match.aggregateStats.team1"
      :team-id="100"
      :participants="match.teams.team1"
      :index="0"
    />
    <div v-if="match.teams.team1.length > 0 && match.teams.team2.length" class="divider"></div>
    <DetailedTable
      style="margin-top: 4px"
      v-if="match.teams.team2.length > 0"
      :aggregate-team-stats="match.aggregateStats.team2"
      :team-id="200"
      :participants="match.teams.team2"
      :index="1"
    />
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import ItemDisplay from '@renderer-shared/components/widgets/ItemDisplay.vue'
import PerkDisplay from '@renderer-shared/components/widgets/PerkDisplay.vue'
import PerkstyleDisplay from '@renderer-shared/components/widgets/PerkstyleDisplay.vue'
import SummonerSpellDisplay from '@renderer-shared/components/widgets/SummonerSpellDisplay.vue'
import { useChampionInfo } from '@renderer-shared/compositions/useChampionInfo'
import { useStreamerModeMaskedText } from '@renderer-shared/compositions/useStreamerModeMaskedText'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { EMPTY_PUUID } from '@shared/constants/common'
import { Game, ParticipantIdentity } from '@shared/types/league-client/match-history'
import { summonerName } from '@shared/utils/name'
import { createReusableTemplate } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import DamageMetricsBar from './widgets/DamageMetricsBar.vue'

const { t } = useTranslation()

const [DefineDetailedTable, DetailedTable] = createReusableTemplate<{
  participants: (typeof match.value.teams)[keyof typeof match.value.teams]
  aggregateTeamStats: (typeof match.value.aggregateStats)[keyof typeof match.value.aggregateStats]
  teamId: number
  index: number
}>({ inheritAttrs: false })

const props = defineProps<{
  game: Game
  selfPuuid?: string
}>()

const emits = defineEmits<{
  toSummoner: [puuid: string, setCurrent?: boolean]
}>()

const match = computed(() => {
  const identities: Record<string, ParticipantIdentity> = {}
  props.game.participantIdentities.forEach((identity) => {
    identities[identity.participantId] = identity
  })

  const all = props.game.participants.map((participant) => ({
    ...participant,
    isSelf: identities[participant.participantId].player.puuid === props.selfPuuid,
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
    maxCsOverall: 0
  }

  const withExtra = all.map((v) => ({ ...v, csOverall: 0 }))

  withExtra.forEach((p) => {
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

    p.csOverall = p.stats.totalMinionsKilled + p.stats.neutralMinionsKilled

    recordStats.maxTotalDamageDealtToChampions = Math.max(
      recordStats.maxTotalDamageDealtToChampions,
      p.stats.totalDamageDealtToChampions
    )
    recordStats.maxTotalDamageTaken = Math.max(
      recordStats.maxTotalDamageTaken,
      p.stats.totalDamageTaken
    )
    recordStats.maxGoldEarned = Math.max(recordStats.maxGoldEarned, p.stats.goldEarned)
    recordStats.maxCsOverall = Math.max(recordStats.maxCsOverall, p.csOverall)
  })

  return {
    teams: {
      team1: withExtra.filter((p) => p.teamId === 100),
      team2: withExtra.filter((p) => p.teamId === 200)
    },
    aggregateStats: teamStats,
    recordStats: recordStats
  }
})

const handleMouseDown = (event: MouseEvent) => {
  if (event.button === 1) {
    event.preventDefault()
  }
}

const handleMouseUp = (event: MouseEvent, puuid: string) => {
  if (event.button === 1) {
    emits('toSummoner', puuid, false)
  }
}

const { masked } = useStreamerModeMaskedText()
const { name } = useChampionInfo()
</script>

<style lang="less" scoped>
.detailed-game-card {
  border-radius: 4px;
  overflow: hidden;
  width: 740px;
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

.info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.champion {
  position: relative;
  height: 32px;
  width: 32px;
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

.summoner-spells,
.perks {
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
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;

    .name-span {
      cursor: pointer;
      transition: color 0.3s ease;

      &:not(.is-bot):hover {
        color: #63e2b7;
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

.wards {
  font-size: 11px;
}

.cs {
  font-size: 11px;

  .cs-count {
    font-weight: bold;
  }
}

.gold {
  text-align: center;
  font-size: 11px;
}

.team {
  width: 100%;

  &.win {
    background-color: rgba(30, 39, 58, 0.9);
  }

  &.lose {
    background-color: rgba(65, 39, 43, 0.9);
  }

  &.na {
    background-color: rgba(56, 56, 56, 0.9);
  }
}

.participant {
  height: 50px;

  .win &.self {
    background-color: rgb(44, 57, 86);
  }

  .lose &.self {
    background-color: rgb(90, 53, 59);
  }

  .na &.self {
    background-color: rgb(76, 76, 76);
  }
}

.divider {
  background-color: rgb(76, 76, 76);
  height: 1px;
}

.best {
  font-weight: bold;
  color: rgb(167, 167, 255);
}
</style>
