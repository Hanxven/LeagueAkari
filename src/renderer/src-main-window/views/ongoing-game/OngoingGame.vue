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
        <div class="team-title">{{ formatTeamText(team).name }}</div>
        <div class="team">
          <PlayerInfoCard
            v-for="{ player, analysis, position } of players"
            :puuid="player.puuid"
            :key="player.puuid"
            :is-self="player.puuid === summoner.me?.puuid"
            :champion-id="cf.ongoingChampionSelections?.[player.puuid]"
            :match-history="player.matchHistory"
            :summoner="player.summoner"
            :ranked-stats="player.rankedStats"
            :saved-info="player.savedInfo"
            :analysis="analysis"
            :position="position"
            :pre-made-team-id="preMadeTeamInfo.players[player.puuid]"
            :current-highlighting-pre-made-team-id="currentHighlightingPreMadeTeamIdD"
            @show-game="handleShowGame"
            @show-game-by-id="handleShowGameById"
            @to-summoner="handleToSummoner"
            @highlight="handleHighlightSubTeam"
          />
        </div>
      </div>
    </DefineOngoingTeam>
    <NScrollbar v-if="!isInIdleState && cf.settings.ongoingAnalysisEnabled" x-scrollable>
      <div class="inner-container" :class="{ 'fit-content': columnsNeed >= 4 }">
        <OngoingTeam v-for="(players, team) of teams" :team="team" :key="team" :players="players" />
      </div>
    </NScrollbar>
    <div v-else class="no-ongoing-game">
      <div class="centered">
        <LeagueAkariSpan bold class="akari-text" />
        <div
          v-if="cf.settings.ongoingAnalysisEnabled"
          style="font-size: 14px; font-weight: normal; color: #666"
        >
          <template v-if="lc.state !== 'connected'">未连接到客户端</template>
          <template v-else-if="champSelect.session?.isSpectating">等待观战延迟</template>
          <template v-else>没有正在进行中的游戏</template>
        </div>
        <div v-else style="font-size: 14px; font-weight: normal; color: #666">对局分析已禁用</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import {
  OngoingPlayer,
  useCoreFunctionalityStore
} from '@renderer-shared/modules/core-functionality/store'
import { useLcuConnectionStore } from '@renderer-shared/modules/lcu-connection/store'
import { useChampSelectStore } from '@renderer-shared/modules/lcu-state-sync/champ-select'
import { useGameflowStore } from '@renderer-shared/modules/lcu-state-sync/gameflow'
import { useSummonerStore } from '@renderer-shared/modules/lcu-state-sync/summoner'
import { Game } from '@shared/types/lcu/match-history'
import { MatchHistoryGamesAnalysisAll } from '@shared/utils/analysis'
import { ParsedRole } from '@shared/utils/ranked'
import { createReusableTemplate, refDebounced, useDebounceFn, useElementSize } from '@vueuse/core'
import { NScrollbar } from 'naive-ui'
import { computed, provide, reactive, ref, useTemplateRef } from 'vue'

import { matchHistoryTabsRendererModule as mhm } from '@main-window/modules/match-history-tabs'

import StandaloneMatchHistoryCardModal from '../match-history/card/StandaloneMatchHistoryCardModal.vue'
import PlayerInfoCard from './PlayerInfoCard.vue'
import {
  FIXED_CARD_WIDTH,
  ONGOING_GAME_COMP_K,
  PRE_MADE_TEAMS,
  TEAM_NAMES,
  TeamMeta,
  useIdleState
} from './ongoing-game-utils'

const cf = useCoreFunctionalityStore()
const lc = useLcuConnectionStore()
const gameflow = useGameflowStore()
const champSelect = useChampSelectStore()
const summoner = useSummonerStore()

const isInIdleState = useIdleState()

const teams = computed(() => {
  if (!cf.ongoingTeams || !cf.ongoingPlayers) {
    return {}
  }

  const teamMap: Record<
    string,
    {
      player: OngoingPlayer
      analysis?: MatchHistoryGamesAnalysisAll
      position: {
        position: string
        role: ParsedRole | null
      }
    }[]
  > = {}

  Object.entries(cf.ongoingTeams).forEach(([team, players]) => {
    if (!players.length) {
      return
    }

    const ps = players.filter((p) => cf.ongoingPlayers[p]).map((p) => cf.ongoingPlayers[p])
    if (ps.length) {
      teamMap[team] = ps.map((player) => {
        const data: {
          player: OngoingPlayer
          analysis?: MatchHistoryGamesAnalysisAll
          position: {
            position: string
            role: ParsedRole | null
          }
        } = {
          player,
          position: {
            position: 'NONE',
            role: null
          }
        }

        if (cf.ongoingPlayerAnalysis && cf.ongoingPlayerAnalysis.players[player.puuid]) {
          data.analysis = cf.ongoingPlayerAnalysis.players[player.puuid]
        }

        if (cf.ongoingPositionAssignments && cf.ongoingPositionAssignments[player.puuid]) {
          data.position = cf.ongoingPositionAssignments[player.puuid]
        }

        return data
      })
    }
  })

  return teamMap
})

const preMadeTeamInfo = computed(() => {
  const playerMap: {
    groups: Record<string, string[]>
    players: Record<string, string>
  } = {
    groups: {},
    players: {}
  }

  let groupIndex = 0
  Object.entries(cf.ongoingPreMadeTeams).forEach(([_, groups]) => {
    groups.forEach((g) => {
      const groupId = PRE_MADE_TEAMS[groupIndex++]
      playerMap.groups[groupId] = g

      g.forEach((p) => {
        playerMap.players[p] = groupId
      })
    })
  })

  return playerMap
})

const formatTeamText = (team: string): TeamMeta => {
  if (cf.ongoingGameInfo?.queueType === 'CHERRY') {
    if (gameflow.phase === 'ChampSelect') {
      return {
        name: team.startsWith('our') ? '我方小队' : '敌方小队',
        side: -1
      }
    } else {
      if (team === 'all') {
        return { name: '所有玩家', side: -1 }
      }

      return { name: '全体', side: -1 }
    }
  } else {
    return TEAM_NAMES[team] || { name: '队伍', side: -1 }
  }
}

const [DefineOngoingTeam, OngoingTeam] = createReusableTemplate<{
  players: {
    player: OngoingPlayer
    analysis?: MatchHistoryGamesAnalysisAll
    position?: { position: string; role: ParsedRole | null }
  }[]
  team: string
}>({ inheritAttrs: false })

provide(ONGOING_GAME_COMP_K, {})

const showingGame = reactive<{
  gameId: number
  game: Game | null
  selfPuuid: string
}>({
  gameId: 0,
  game: null,
  selfPuuid: ''
})

const currentHighlightingPreMadeTeamId = ref<string | null>(null)
const currentHighlightingPreMadeTeamIdD = refDebounced<string | null>(
  currentHighlightingPreMadeTeamId,
  200
)
useDebounceFn(() => {})

const handleHighlightSubTeam = (preMadeTeamId: string, highlight: boolean) => {
  if (highlight) {
    currentHighlightingPreMadeTeamId.value = preMadeTeamId
  } else {
    currentHighlightingPreMadeTeamId.value = null
  }
}

const isStandaloneMatchHistoryCardShow = ref(false)
const handleShowGame = (game: Game, puuid: string) => {
  showingGame.gameId = 0
  showingGame.game = game
  showingGame.selfPuuid = puuid
  isStandaloneMatchHistoryCardShow.value = true
}

const handleShowGameById = (id: number, selfId: string) => {
  showingGame.game = null
  showingGame.gameId = id
  showingGame.selfPuuid = selfId
  isStandaloneMatchHistoryCardShow.value = true
}

const { navigateToTab } = mhm.useNavigateToTab()
const handleToSummoner = (puuid: string) => {
  navigateToTab(puuid)
}

// 基于经验的手动测量, 确定的较为不错的列数, 最多支持 8 列
// 注意, 这建立在卡片元素在 240px 宽度的基础上, 同时行间隔为 4px. 如果任意一个条件发生变化, 列数需要重新调整
const { width } = useElementSize(useTemplateRef('page-el'))
// watchEffect(() => {
//   console.log(width.value)
// })
const columnsNeed = computed(() => {
  const teamColumns = Object.values(teams.value)
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
  grid-template-columns: repeat(v-bind(columnsNeed), v-bind(FIXED_CARD_WIDTH));
  gap: 8px 4px;
}

.sora {
  height: 16px;
}

.team-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

.team-wrapper {
  &:not(:last-child) {
    margin-bottom: 16px;
  }
}

.no-ongoing-game {
  height: 100%;
  display: flex;
  position: relative;
  top: calc(var(--title-bar-height) * -0.5);

  .akari-text {
    font-size: 22px;
  }
}

.centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
