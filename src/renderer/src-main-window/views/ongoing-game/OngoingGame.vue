<template>
  <div class="ongoing-game-page" ref="page-el">
    <StandaloneMatchHistoryCardModal
      :game="showingGame.game"
      :game-id="showingGame.gameId"
      :self-puuid="showingGame.selfPuuid"
      v-model:show="isStandaloneMatchHistoryCardShow"
    />
    <DefineOngoingTeam v-slot="{ players, team }">
      <div class="team-wrapper">
        <div class="team-header">
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
            <span
              title="Avg Akari Score"
              style="color: #ff65ce"
              v-if="app.settings.isInKyokoMode"
              >{{ ogs.playerStats.teams[team].averageAkariScore.toFixed(2) }}</span
            >
          </div>
        </div>
        <div class="team">
          <PlayerInfoCard
            v-for="player of players"
            :puuid="player"
            :key="player"
            :is-self="player === lc.summoner.me?.puuid"
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
            :query-stage="ogs.queryStage"
            @show-game="handleShowGame"
            @show-game-by-id="handleShowGameById"
            @to-summoner="handleToSummoner"
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
          <template v-if="lc.connectionState !== 'connected'">
            <span class="no-ongoing-game-text">{{ t('OngoingGame.disconnected') }}</span>
            <EasyToLaunch />
          </template>
          <template v-else-if="lc.champSelect.session && lc.champSelect.session.isSpectating">
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
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { Game } from '@shared/types/league-client/match-history'
import { createReusableTemplate, refDebounced, useElementSize } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NScrollbar } from 'naive-ui'
import { computed, reactive, ref, useTemplateRef } from 'vue'

import EasyToLaunch from '@main-window/components/EasyToLaunch.vue'
import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'

import StandaloneMatchHistoryCardModal from '../match-history/card/StandaloneMatchHistoryCardModal.vue'
import PlayerInfoCard from './PlayerInfoCard.vue'
import {
  FIXED_CARD_WIDTH_PX_LITERAL,
  PREMADE_TEAMS,
  TeamMeta,
  useIdleState
} from './ongoing-game-utils'

const lc = useLeagueClientStore()
const app = useAppCommonStore()

const { t } = useTranslation()

const ogs = useOngoingGameStore()

const mh = useInstance<MatchHistoryTabsRenderer>('match-history-tabs-renderer')

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
    if (lc.gameflow.phase === 'ChampSelect') {
      return {
        name: team.startsWith('our') ? t(`common.teams.our`) : t(`common.teams.their`),
        side: -1
      }
    } else {
      if (team === 'all') {
        return { name: t(`common.teams.all`), side: -1 }
      }

      return { name: t(`common.teams.unknown`), side: -1 }
    }
  } else {
    return { name: t(`common.teams.${team}`, team), side: -1 }
  }
}

const [DefineOngoingTeam, OngoingTeam] = createReusableTemplate<{
  players: string[]
  team: string
}>({ inheritAttrs: false })

const showingGame = reactive<{
  gameId: number
  game: Game | null
  selfPuuid: string
}>({
  gameId: 0,
  game: null,
  selfPuuid: ''
})

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

const isStandaloneMatchHistoryCardShow = ref(false)
const handleShowGame = (game: Game, puuid: string) => {
  showingGame.gameId = 0
  showingGame.game = game
  showingGame.selfPuuid = puuid
  isStandaloneMatchHistoryCardShow.value = true
}

const handleShowGameById = (id: number, selfPuuid: string) => {
  showingGame.game = null
  showingGame.gameId = id
  showingGame.selfPuuid = selfPuuid
  isStandaloneMatchHistoryCardShow.value = true
}

const { navigateToTabByPuuid } = mh.useNavigateToTab()
const handleToSummoner = (puuid: string) => {
  navigateToTabByPuuid(puuid)
}

// 基于经验的手动测量, 确定的较为不错的列数, 最多支持 8 列
// 注意, 这建立在卡片元素在 240px 宽度的基础上, 同时行间隔为 4px. 如果任意一个条件发生变化, 列数需要重新调整
const { width } = useElementSize(useTemplateRef('page-el'))
const columnsNeed = computed(() => {
  const teamColumns = Object.values(ogs.teams || {})
    .map((t) => t.length)
    .reduce((a, b) => Math.max(a, b), 0)

  if (width.value > 1990) {
    return Math.min(8, teamColumns)
  }

  if (width.value > 1740) {
    return Math.min(7, teamColumns)
  }

  if (width.value > 1500) {
    return Math.min(6, teamColumns)
  }

  if (width.value > 1250) {
    return Math.min(5, teamColumns)
  }

  if (width.value > 1010) {
    return Math.min(4, teamColumns)
  }

  if (width.value > 760) {
    return Math.min(3, teamColumns)
  }

  return Math.min(2, teamColumns)
})
</script>

<style lang="less" scoped>
.ongoing-game-page {
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

.team {
  display: grid;
  margin-top: 4px;
  grid-template-columns: repeat(v-bind(columnsNeed), v-bind(FIXED_CARD_WIDTH_PX_LITERAL));
  gap: 8px 4px;
}

.sora {
  height: 16px;
}

.team-header {
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

  .win-rate.gte-50 {
    color: #4cc69d;
  }

  .win-rate.lt-50 {
    color: #ff6161;
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
    color: rgba(255, 255, 255, 0.4);
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
</style>
