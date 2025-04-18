<template>
  <div class="team-tags">
    <template v-if="analysis">
      <div
        class="normal-text win-rate"
        :class="{
          'gte-50': analysis.team.averageWinRate >= 0.5,
          'lt-50': analysis.team.averageWinRate < 0.5
        }"
      >
        {{ (analysis.team.averageWinRate * 100).toFixed() }}%
      </div>
      <div class="divider"></div>
      <div class="normal-text">
        {{ analysis.team.averageKda.toFixed(2) }}
      </div>
    </template>
    <div class="divider" v-if="hasTags"></div>
    <NPopover v-for="p of teamPremadeTeams">
      <template #trigger>
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
      <TinyPlayerChampionList :list="p.players" />
    </NPopover>
    <NPopover v-for="te of winRateTeams.winRateTeams">
      <template #trigger>
        <div class="tag win-rate-team">
          {{
            t('TeamTagsArea.winRateTeam', {
              team: `(${te.players.length})`
            })
          }}
        </div>
      </template>
      <TinyPlayerChampionList :list="te.players" />
    </NPopover>
    <NPopover v-for="te of winRateTeams.loseRateTeams">
      <template #trigger>
        <div class="tag lose-rate-team">
          {{
            t('TeamTagsArea.loseRateTeam', {
              team: `(${te.players.length})`
            })
          }}
        </div>
      </template>
      <TinyPlayerChampionList :list="te.players" />
    </NPopover>
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

const WIN_RATE_TEAM_MIN_MATCHES = 10
const WIN_RATE_TEAM_MIN_SIZE = 3
const LOST_RATE_TEAM_MIN_SIZE = 2
const WIN_RATE_TEAM_MIN_WIN_RATE = 0.85
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
  name: string
  players: string[]
  type: 'win-rate-team' | 'lose-rate-team'
}

const { t } = useTranslation()

const winRateTeams = computed(() => {
  if (!analysis || !premadeInfo) {
    return {
      winRateTeams: [],
      loseRateTeams: []
    }
  }

  let index = 0
  const result: WinRateTeamInfo[] = []

  Object.values(premadeInfo.groups).forEach((players) => {
    if (players.length < WIN_RATE_TEAM_MIN_SIZE && players.length > LOST_RATE_TEAM_MIN_SIZE) {
      return
    }

    let winRateQualified = true
    let loseRateQualified = true

    for (const p of players) {
      const a = analysis.players[p]

      if (!a) {
        winRateQualified = false
        loseRateQualified = false
        break
      }

      if (!winRateQualified && !loseRateQualified) {
        break
      }

      if (
        a.summary.count < WIN_RATE_TEAM_MIN_MATCHES ||
        a.summary.winRate < WIN_RATE_TEAM_MIN_WIN_RATE
      ) {
        winRateQualified = false
      }

      if (
        a.summary.count < LOST_RATE_TEAM_MIN_SIZE ||
        a.summary.winRate > LOSE_RATE_TEAM_MAX_WIN_RATE
      ) {
        loseRateQualified = false
      }
    }

    if (winRateQualified) {
      result.push({
        name: PREMADE_TEAMS[index++],
        players,
        type: 'win-rate-team'
      })
    }

    if (loseRateQualified) {
      result.push({
        name: PREMADE_TEAMS[index++],
        players,
        type: 'lose-rate-team'
      })
    }
  })

  const detailed = result.map((t) => {
    const players = t.players.map((p) => {
      return {
        puuid: p,
        championId: championSelections[p] || -1,
        gameName: summoners[p]?.gameName,
        tagLine: summoners[p]?.tagLine
      }
    })

    return {
      ...t,
      players
    }
  })

  return {
    winRateTeams: detailed.filter((t) => t.type === 'win-rate-team'),
    loseRateTeams: detailed.filter((t) => t.type === 'lose-rate-team')
  }
})

const teamPremadeTeams = computed(() => {
  if (!premadeInfo) {
    return []
  }

  return Object.entries(premadeInfo.groups)
    .map(([premadeId, players]) => {
      return {
        premadeId,
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
  return (
    teamPremadeTeams.value.length > 0 ||
    winRateTeams.value.winRateTeams.length > 0 ||
    winRateTeams.value.loseRateTeams.length > 0
  )
})
</script>

<style scoped lang="less">
.team-tags {
  display: flex;
  align-items: flex-end;
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

.tag:not(:last-child) {
  margin-right: 8px;
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
