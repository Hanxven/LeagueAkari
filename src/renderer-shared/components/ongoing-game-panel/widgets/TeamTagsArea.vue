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
    <NPopover v-for="p of premadeCountSorted">
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
      <div class="premade-team-champions">
        <ChampionIcon
          class="premade-team-champion"
          round
          ring
          v-for="m of p.players"
          :champion-id="championSelections[m] || -1"
        />
      </div>
    </NPopover>
    <div class="tag win-rate-team" v-for="te of winRateTeams.winRateTeams">
      {{
        t('TeamTagsArea.winRateTeam', {
          team: `(${te.players.length})`
        })
      }}
    </div>
    <div class="tag lose-rate-team" v-for="te of winRateTeams.loseRateTeams">
      {{
        t('TeamTagsArea.loseRateTeam', {
          team: `(${te.players.length})`
        })
      }}
    </div>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import {
  MatchHistoryGamesAnalysisAll,
  MatchHistoryGamesAnalysisTeamSide
} from '@shared/utils/analysis'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'
import { computed, watchEffect } from 'vue'

import { PREMADE_TEAMS, PREMADE_TEAM_COLORS } from '../ongoing-game-utils'

const WIN_RATE_TEAM_MIN_AVG_MATCHES = 12
const WIN_RATE_TEAM_MIN_SIZE = 3
const WIN_RATE_TEAM_MIN_WIN_RATE = 85
const LOSE_RATE_TEAM_MAX_WIN_RATE = 25

const {
  analysis,
  premadeInfo,
  championSelections = {}
} = defineProps<{
  sideId: string
  analysis: {
    players: Record<string, MatchHistoryGamesAnalysisAll>
    team: MatchHistoryGamesAnalysisTeamSide
  } | null
  premadeInfo?: {
    groups: Record<string, string[]>
    premadeTeamIdMap: Record<string, string>
  } | null
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
    if (players.length < WIN_RATE_TEAM_MIN_SIZE) {
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
        a.summary.count < WIN_RATE_TEAM_MIN_AVG_MATCHES ||
        a.summary.winRate < WIN_RATE_TEAM_MIN_WIN_RATE
      ) {
        winRateQualified = false
      }

      if (
        a.summary.count < WIN_RATE_TEAM_MIN_AVG_MATCHES ||
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

  return {
    winRateTeams: result.filter((t) => t.type === 'win-rate-team'),
    loseRateTeams: result.filter((t) => t.type === 'lose-rate-team')
  }
})

const premadeCountSorted = computed(() => {
  if (!premadeInfo) {
    return []
  }

  return Object.entries(premadeInfo.groups)
    .map(([premadeId, players]) => {
      return {
        premadeId,
        players
      }
    })
    .toSorted((a, b) => {
      return a.players.length - b.players.length
    })
})

watchEffect(() => {
  // console.log(premade)
})

const hasTags = computed(() => {
  return (
    premadeCountSorted.value.length > 0 ||
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

.premade-team-champions {
  display: flex;
  gap: 2px;

  .premade-team-champion {
    width: 32px;
    height: 32px;
  }
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
