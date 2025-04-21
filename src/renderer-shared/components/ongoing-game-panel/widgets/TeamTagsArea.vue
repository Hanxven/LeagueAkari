<template>
  <div class="team-tags">
    <template v-if="analysis">
      <NPopover>
        <template #trigger>
          <div
            class="normal-text win-rate"
            :class="{
              'gte-50': analysis.team.averageWinRate >= 0.5,
              'lt-50': analysis.team.averageWinRate < 0.5
            }"
          >
            {{ (analysis.team.averageWinRate * 100).toFixed() }}%
          </div>
        </template>
        {{
          t('TeamTagsArea.winRate', {
            rate: (analysis.team.averageWinRate * 100).toFixed(4)
          })
        }}
      </NPopover>
      <div class="divider"></div>
      <NPopover>
        <template #trigger>
          <div class="normal-text">
            {{ analysis.team.averageKda.toFixed(2) }}
          </div>
        </template>
        {{
          t('TeamTagsArea.kda', {
            kda: analysis.team.averageKda.toFixed(4)
          })
        }}
      </NPopover>
    </template>
    <div class="divider" v-if="hasTags"></div>
    <div class="tags-container">
      <NPopover v-for="p of teamPremadeTeams">
        <template #trigger>
          <template v-if="p.winRateTeamInfo">
            <div class="combined-tag">
              <div
                class="tag"
                :style="{
                  backgroundColor: p.premadeId
                    ? PREMADE_TEAM_COLORS[p.premadeId]?.foregroundColor
                    : '#ffffff40',
                  color: PREMADE_TEAM_COLORS[p.premadeId]?.color || '#fff'
                }"
              >
                {{
                  t('TeamTagsArea.premade', {
                    countV: p.players.length
                  })
                }}
              </div>
              <div class="tag win-rate-team" v-if="p.winRateTeamInfo.type === 'win-rate-team'">
                {{ t('TeamTagsArea.winRateTeam') }}
              </div>
              <div class="tag lose-rate-team" v-else>
                {{ t('TeamTagsArea.loseRateTeam') }}
              </div>
            </div>
          </template>
          <template v-else>
            <div
              class="tag"
              :style="{
                backgroundColor: p.premadeId
                  ? PREMADE_TEAM_COLORS[p.premadeId]?.foregroundColor
                  : '#ffffff40',
                color: PREMADE_TEAM_COLORS[p.premadeId]?.color || '#fff'
              }"
            >
              {{
                t('TeamTagsArea.premade', {
                  countV: p.players.length
                })
              }}
            </div>
          </template>
        </template>
        <TinyPlayerChampionList :list="p.players" />
      </NPopover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SummonerInfo } from '@shared/types/league-client/summoner'
import {
  MatchHistoryGamesAnalysisAll,
  MatchHistoryGamesAnalysisTeamSide
} from '@shared/utils/analysis'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'
import { computed } from 'vue'

import { PREMADE_TEAMS, PREMADE_TEAM_COLORS } from '../ongoing-game-utils'
import TinyPlayerChampionList from './TinyPlayerChampionList.vue'

const WIN_RATE_TEAM_MIN_MATCHES = 13
const WIN_RATE_TEAM_OTHER_MEMBER_WIN_STREAK = 4
const WIN_RATE_TEAM_MIN_SIZE = 3
const LOST_RATE_TEAM_MIN_SIZE = 2
const WIN_RATE_TEAM_MIN_WIN_RATE = 0.9
const LOSE_RATE_TEAM_MAX_WIN_RATE = 0.25

const {
  analysis,
  premadeInfo,
  championSelections = {},
  summoners = {}
} = defineProps<{
  sideId: string
  analysis?: {
    players: Record<string, MatchHistoryGamesAnalysisAll>
    team: MatchHistoryGamesAnalysisTeamSide
  }
  premadeInfo?: {
    groups: Record<string, string[]>
    premadeTeamIdMap: Record<string, string>
  }
  summoners?: Record<string, SummonerInfo>
  championSelections?: Record<string, number>
}>()

interface WinRateTeamInfo {
  premadeId: string
  players: string[]
  type: 'win-rate-team' | 'lose-rate-team'
}

const { t } = useTranslation()

// ## 胜率队
// 1. 3 人以上的预组队队伍
// 2. 存在任意一名高胜率玩家
// 3. 其他成员的近期连胜平均值超过预设场次
// ## 败率队 (偏娱乐)
// 1. 2 人以上的预组队队伍
// 2. 玩家胜率均低于特定值
const winRateTeams = computed(() => {
  if (!analysis || !premadeInfo) {
    return {}
  }

  let index = 0
  const result: WinRateTeamInfo[] = []

  Object.values(premadeInfo.groups).forEach((players) => {
    if (players.length < WIN_RATE_TEAM_MIN_SIZE && players.length > LOST_RATE_TEAM_MIN_SIZE) {
      return
    }

    let hasOneHighWinRateMember = false
    let otherMembersWinTotalStreak = 0

    for (const p of players) {
      const a = analysis.players[p]

      if (!a) {
        break
      }

      if (
        !hasOneHighWinRateMember &&
        a.summary.winRate >= WIN_RATE_TEAM_MIN_WIN_RATE &&
        a.summary.count >= WIN_RATE_TEAM_MIN_MATCHES
      ) {
        hasOneHighWinRateMember = true
      } else {
        otherMembersWinTotalStreak += a.summary.winningStreak
      }
    }

    if (
      hasOneHighWinRateMember &&
      otherMembersWinTotalStreak / (players.length - 1) >= WIN_RATE_TEAM_OTHER_MEMBER_WIN_STREAK
    ) {
      result.push({
        premadeId: PREMADE_TEAMS[index++],
        players,
        type: 'win-rate-team'
      })
    }

    let loseRateTeamQualified = true

    for (const p of players) {
      const a = analysis.players[p]

      if (!a) {
        loseRateTeamQualified = false
        break
      }

      if (!loseRateTeamQualified) {
        break
      }

      if (
        a.summary.count < LOST_RATE_TEAM_MIN_SIZE ||
        a.summary.winRate > LOSE_RATE_TEAM_MAX_WIN_RATE
      ) {
        loseRateTeamQualified = false
      }
    }

    if (loseRateTeamQualified) {
      result.push({
        premadeId: PREMADE_TEAMS[index++],
        players,
        type: 'lose-rate-team'
      })
    }
  })

  return result.reduce(
    (acc, cur) => {
      acc[cur.premadeId] = cur
      return acc
    },
    {} as Record<string, WinRateTeamInfo>
  )
})

const teamPremadeTeams = computed(() => {
  if (!premadeInfo) {
    return []
  }

  return Object.entries(premadeInfo.groups)
    .map(([premadeId, players]) => {
      return {
        premadeId,
        winRateTeamInfo: winRateTeams.value[premadeId],
        players: players.map((p) => {
          return {
            puuid: p,
            championId: championSelections[p] || -1,
            gameName: summoners[p]?.gameName,
            tagLine: summoners[p]?.tagLine
          }
        })
      }
    })
    .toSorted((a, b) => {
      return a.players.length - b.players.length
    })
})

const hasTags = computed(() => {
  return teamPremadeTeams.value.length > 0
})
</script>

<style scoped lang="less">
.team-tags {
  display: flex;
  align-items: flex-end;
}

.tags-container {
  display: flex;
  gap: 8px;
}

.combined-tag {
  display: flex;
  align-items: center;
  border-radius: 2px;
  overflow: hidden;

  .tag {
    border-radius: 0px;
  }
}

.tag {
  font-size: 12px;
  line-height: 12px;
  color: #ffffff;
  padding: 2px 4px;
  border-radius: 2px;

  &.win-rate-team {
    background-color: #7e2c85;
  }

  &.lose-rate-team {
    background-color: #893b3b;
  }
}

.normal-text {
  font-size: 14px;
}

.win-rate {
  font-weight: bold;
}

.divider {
  width: 1px;
  height: 0.9em;
  box-sizing: border-box;
  margin: 0 8px;
  align-self: center;
}

[data-theme='dark'] {
  .win-rate.gte-50 {
    color: #4cc69d;
  }

  .win-rate.lt-50 {
    color: #ff6161;
  }

  .divider {
    background-color: rgba(255, 255, 255, 0.15);
  }
}

[data-theme='light'] {
  .win-rate.gte-50 {
    color: rgb(44, 140, 108);
  }

  .win-rate.lt-50 {
    color: rgb(204, 0, 0);
  }

  .divider {
    background-color: rgba(0, 0, 0, 0.15);
  }
}
</style>
