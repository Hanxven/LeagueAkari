<template>
  <div class="ongoing-game-view" ref="og-view-container">
    <DefineOngoingTeam v-slot="{ players, team }">
      <div class="team-wrapper">
        <div class="team-stats-header">
          <span class="title">{{ formatTeamText(team).name }}</span>
          <div class="analysis" v-if="ogs.playerStats?.teams[team] && players.length >= 1">
            <span
              :title="t('OngoingGame.avgTeamWinRate')"
              class="win-rate"
              :class="{
                'gte-50': ogs.playerStats.teams[team].averageWinRate >= 0.5,
                'lt-50': ogs.playerStats.teams[team].averageWinRate < 0.5
              }"
              >{{ (ogs.playerStats.teams[team].averageWinRate * 100).toFixed() }}%</span
            >
            <span :title="t('OngoingGame.avgTeamKda')">{{
              ogs.playerStats?.teams[team].averageKda.toFixed(2)
            }}</span>
            <span title="Akari Score" style="color: #ff65ce" v-if="as.settings.isInKyokoMode"
              >Avg: {{ ogs.playerStats.teams[team].averageAkariScore.toFixed(2) }} | Team:
              {{ ogs.playerStats.teams[team].akariScoreBsi.toFixed(2) }}</span
            >
          </div>
        </div>
        <div class="team-members">
          <PlayerInfoCard
            v-for="player of players"
            :puuid="player"
            :key="player"
            :is-self="player === lcs.summoner.me?.puuid"
            :champion-id="ogs.championSelections?.[player]"
            :match-history="
              ogs.matchHistory[player]?.data.map((g) => ({ isDetailed: true, game: g }))
            "
            :match-history-loading="ogs.matchHistoryLoadingState[player]"
            :summoner="ogs.summoner[player]?.data"
            :ranked-stats="ogs.rankedStats[player]?.data"
            :saved-info="ogs.savedInfo[player]"
            :champion-mastery="ogs.championMastery[player]?.data"
            :analysis="ogs.playerStats?.players[player]"
            :position="ogs.positionAssignments?.[player]"
            :premade-team-id="premadeTeamInfo.players[player]"
            :currentHighlightingPremadeTeamId="currentHighlightingPremadeTeamIdD"
            :kda-iqr="kdaOutliers?.[player]"
            :query-stage="ogs.queryStage"
            :queue-type="ogs.queryStage.gameInfo?.queueType"
            @show-game="emits('showGame', $event, player)"
            @show-game-by-id="emits('showGameById', $event, player)"
            @to-summoner="emits('toSummoner', $event)"
            @highlight="handleHighlightSubTeam"
          />
        </div>
      </div>
    </DefineOngoingTeam>
    <NScrollbar v-if="!isInIdleState && ogs.settings.enabled" x-scrollable>
      <div class="inner-container" :class="{ 'fit-content': columnsNeed >= 4 }">
        <OngoingTeam
          v-for="(players, team) of sortedTeams"
          :team="team"
          :key="team"
          :players="players"
        />
      </div>
    </NScrollbar>
    <div v-else class="no-ongoing-game">
      <div class="centered">
        <LeagueAkariSpan bold class="akari-text" />
        <template v-if="ogs.settings.enabled">
          <template v-if="lcs.connectionState !== 'connected'">
            <span class="no-ongoing-game-text">{{ t('OngoingGame.disconnected') }}</span>
            <EasyToLaunch v-if="showEasyToLaunch" />
          </template>
          <template v-else-if="lcs.champSelect.session && lcs.champSelect.session.isSpectating">
            <span class="no-ongoing-game-text"> {{ t('OngoingGame.waitingForSpectate') }}</span>
          </template>
          <template v-else>
            <span class="no-ongoing-game-text"> {{ t('OngoingGame.noOngoingGame') }}</span>
          </template>
        </template>
        <span v-else class="no-ongoing-game-text">{{ t('OngoingGame.disabled') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import EasyToLaunch from '@renderer-shared/components/EasyToLaunch.vue'
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { Game } from '@shared/types/league-client/match-history'
import { findOutliersByIqr } from '@shared/utils/analysis'
import { createReusableTemplate, refDebounced, useElementSize } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NScrollbar } from 'naive-ui'
import { computed, ref, useTemplateRef } from 'vue'

import PlayerInfoCard from './PlayerInfoCard.vue'
import {
  FIXED_CARD_WIDTH_PX_LITERAL,
  FIXED_CARD_WIDTH_PX_NUMBER,
  PREMADE_TEAMS,
  TeamMeta,
  useIdleState
} from './ongoing-game-utils'

const { showEasyToLaunch = true } = defineProps<{
  showEasyToLaunch?: boolean
}>()

const emits = defineEmits<{
  toSummoner: [puuid: string]
  showGame: [game: Game, puuid: string]
  showGameById: [id: number, selfPuuid: string]
}>()

const lcs = useLeagueClientStore()
const as = useAppCommonStore()

const { t } = useTranslation()

const ogs = useOngoingGameStore()

const isInIdleState = useIdleState()

const POSITION_ORDER = {
  NONE: 0,
  TOP: 1,
  MIDDLE: 2,
  JUNGLE: 3,
  BOTTOM: 4,
  UTILITY: 5
}

const sortedTeams = computed(() => {
  if (!ogs.teams) {
    return {}
  }

  const sorted: Record<string, string[]> = {}

  Object.entries(ogs.teams).forEach(([team, players]) => {
    if (!players.length) {
      return
    }

    sorted[team] = players.toSorted((a, b) => {
      if (ogs.settings.orderPlayerBy === 'position') {
        const pa = ogs.positionAssignments[a]?.position || 'NONE'
        const pb = ogs.positionAssignments[b]?.position || 'NONE'

        return POSITION_ORDER[pa] - POSITION_ORDER[pb]
      }

      if (ogs.settings.orderPlayerBy === 'premade-team') {
        const teamA = premadeTeamInfo.value.players[a]
        const teamB = premadeTeamInfo.value.players[b]

        if (teamA && teamB) {
          if (teamA !== teamB) {
            const sizeA = premadeTeamInfo.value.groups[teamA].length
            const sizeB = premadeTeamInfo.value.groups[teamB].length
            if (sizeA !== sizeB) {
              return sizeB - sizeA
            } else {
              return teamA.localeCompare(teamB)
            }
          } else {
            return 0
          }
        }

        if (teamA) {
          return -1
        }

        if (teamB) {
          return 1
        }

        return 0
      }

      const statsA = ogs.playerStats?.players[a]
      const statsB = ogs.playerStats?.players[b]

      if (ogs.settings.orderPlayerBy === 'akari-score') {
        return (statsB?.akariScore.total || 0) - (statsA?.akariScore.total || 0)
      }

      if (ogs.settings.orderPlayerBy === 'kda') {
        return (statsB?.summary.averageKda || 0) - (statsA?.summary.averageKda || 0)
      }

      if (ogs.settings.orderPlayerBy === 'win-rate') {
        return (statsB?.summary.winRate || 0) - (statsA?.summary.winRate || 0)
      }

      return 0
    })
  })

  return sorted
})

const premadeTeamInfo = computed(() => {
  const playerMap: {
    groups: Record<string, string[]>
    players: Record<string, string>
  } = {
    groups: {},
    players: {}
  }

  let groupIndex = 0
  Object.entries(ogs.premadeTeams || {}).forEach(([_, groups]) => {
    groups.forEach((g) => {
      const groupId = PREMADE_TEAMS[groupIndex++]
      playerMap.groups[groupId] = g

      g.forEach((p) => {
        playerMap.players[p] = groupId
      })
    })
  })

  return playerMap
})

const formatTeamText = (team: string): TeamMeta => {
  if (ogs.gameInfo?.queueType === 'CHERRY') {
    if (lcs.gameflow.phase === 'ChampSelect') {
      return {
        name: team.startsWith('our') ? t(`common.teams.our`) : t(`common.teams.their`)
      }
    } else {
      if (team === 'all') {
        return { name: t(`common.teams.all`) }
      }

      return { name: t(`common.teams.unknown`) }
    }
  } else {
    return { name: t(`common.teams.${team}`, team) }
  }
}

const [DefineOngoingTeam, OngoingTeam] = createReusableTemplate<{
  players: string[]
  team: string
}>({ inheritAttrs: false })

const currentHighlightingPremadeTeamId = ref<string | null>(null)
const currentHighlightingPremadeTeamIdD = refDebounced<string | null>(
  currentHighlightingPremadeTeamId,
  200
)

const handleHighlightSubTeam = (preMadeTeamId: string, highlight: boolean) => {
  if (highlight) {
    currentHighlightingPremadeTeamId.value = preMadeTeamId
  } else {
    currentHighlightingPremadeTeamId.value = null
  }
}

const IQR_THRESHOLD = 0.65
const kdaOutliers = computed(() => {
  if (!ogs.playerStats || Object.keys(ogs.playerStats.players).length < 5) {
    return null
  }

  const kdaList = Object.entries(ogs.playerStats.players).map(([puuid, p]) => ({
    puuid,
    kda: p.summary.averageKda
  }))

  const iqr = findOutliersByIqr(kdaList, (a) => a.kda, IQR_THRESHOLD)
  const result: Record<string, 'over' | 'below'> = {}

  iqr.over.forEach((a) => {
    result[a.puuid] = 'over'
  })

  iqr.below.forEach((a) => {
    result[a.puuid] = 'below'
  })

  return result
})

const { width } = useElementSize(useTemplateRef('og-view-container'))
const columnsNeed = computed(() => {
  const teamColumns = Object.values(ogs.teams || {})
    .map((t) => t.length)
    .reduce((a, b) => Math.max(a, b), 0)

  const maxAllowed = [8, 7, 6, 5, 4, 3].find(
    (col) => width.value > FIXED_CARD_WIDTH_PX_NUMBER * (col + 0.25)
  )

  return Math.min(maxAllowed || 2, teamColumns)
})
</script>

<style lang="less" scoped>
.ongoing-game-view {
  height: 100%;
}

.inner-container {
  position: relative;
  height: 100%;
  margin: 0 auto;
  padding: 16px;

  .content {
    display: flex;
  }

  &.fit-content {
    width: fit-content;
  }
}

.team-members {
  display: grid;
  margin-top: 4px;
  grid-template-columns: repeat(v-bind(columnsNeed), v-bind(FIXED_CARD_WIDTH_PX_LITERAL));
  gap: 8px 4px;
}

.sora {
  height: 16px;
}

.team-stats-header {
  display: flex;
  margin-bottom: 8px;
  align-items: flex-end;

  .title {
    font-size: 16px;
    font-weight: bold;
    margin-right: 8px;
  }

  .analysis {
    display: flex;
    gap: 8px;
  }

  .win-rate {
    font-weight: bold;
  }
}

.team-wrapper {
  &:not(:last-child) {
    margin-bottom: 16px;
  }
}

.team-side-analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.no-ongoing-game {
  height: 100%;
  display: flex;
  position: relative;

  .akari-text {
    font-size: 22px;
  }

  .no-ongoing-game-text {
    font-size: 14px;
    font-weight: normal;
  }
}

.centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  top: 48%;
  left: 50%;
  transform: translate(-50%, -50%);
  gap: 16px;
}

[data-theme='dark'] {
  .team-stats-header {
    .win-rate.gte-50 {
      color: #4cc69d;
    }

    .win-rate.lt-50 {
      color: #ff6161;
    }
  }

  .no-ongoing-game {
    .no-ongoing-game-text {
      color: rgba(255, 255, 255, 0.4);
    }
  }
}

[data-theme='light'] {
  .team-stats-header {
    .win-rate.gte-50 {
      color: rgb(44, 140, 108);
    }

    .win-rate.lt-50 {
      color: rgb(204, 0, 0);
    }
  }

  .no-ongoing-game {
    .no-ongoing-game-text {
      color: rgba(0, 0, 0, 0.4);
    }
  }
}
</style>
