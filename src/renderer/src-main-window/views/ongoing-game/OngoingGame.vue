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
          <div class="analysis" v-if="og.playerStats?.teams[team] && players.length >= 1">
            <span
              title="队伍平均胜率"
              class="win-rate"
              :class="{
                'gte-50': og.playerStats.teams[team].averageWinRate >= 0.5,
                'lt-50': og.playerStats.teams[team].averageWinRate < 0.5
              }"
              >{{ (og.playerStats.teams[team].averageWinRate * 100).toFixed() }} %</span
            >
            <span title="队伍平均 KDA">{{
              og.playerStats?.teams[team].averageKda.toFixed(2)
            }}</span>
            <span
              title="队伍平均 Akari Score"
              style="color: #ff65ce"
              v-if="app.settings.isInKyokoMode"
              >{{ og.playerStats.teams[team].averageAkariScore.toFixed(2) }}</span
            >
          </div>
        </div>
        <div class="team">
          <PlayerInfoCard
            v-for="player of players"
            :puuid="player"
            :key="player"
            :is-self="player === lc.summoner.me?.puuid"
            :champion-id="og.championSelections?.[player]"
            :match-history="
              og.matchHistory[player]?.data.map((g) => ({ isDetailed: true, game: g }))
            "
            :summoner="og.summoner[player]?.data"
            :ranked-stats="og.rankedStats[player]?.data"
            :saved-info="og.savedInfo[player]"
            :champion-mastery="og.championMastery[player]?.data"
            :analysis="og.playerStats?.players[player]"
            :position="og.positionAssignments?.[player]"
            :premade-team-id="premadeTeamInfo.players[player]"
            :currentHighlightingPremadeTeamId="currentHighlightingPremadeTeamIdD"
            @show-game="handleShowGame"
            @show-game-by-id="handleShowGameById"
            @to-summoner="handleToSummoner"
            @highlight="handleHighlightSubTeam"
          />
        </div>
      </div>
    </DefineOngoingTeam>
    <NScrollbar v-if="!isInIdleState && og.settings.enabled" x-scrollable>
      <div class="inner-container" :class="{ 'fit-content': columnsNeed >= 4 }">
        <div class="header-controls">
          <NSelect
            :options="orderOptions"
            placeholder="排序方式"
            size="small"
            :value="og.settings.orderPlayerBy"
            @update:value="(val) => (og.settings.orderPlayerBy = val)"
            class="order-selector"
          />
          <NSelect
            v-if="canUseSgpApi"
            :options="sgpTagOptions"
            :value="og.matchHistoryTag"
            @update:value="(val) => ogs.setMatchHistoryTag(val)"
            placeholder="队列筛选"
            size="small"
            class="queue-selector"
          />
          <NButton @click="() => ogs.reload()" size="small" type="primary">刷新</NButton>
        </div>
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
        <div
          v-if="og.settings.enabled"
          style="font-size: 14px; font-weight: normal; color: #666; margin-top: 8px"
        >
          <template v-if="lc.connectionState !== 'connected'">未连接到客户端</template>
          <template v-else-if="lc.champSelect.session && lc.champSelect.session.isSpectating"
            >等待观战延迟</template
          >
          <template v-else>没有正在进行中的游戏</template>
        </div>
        <div v-else style="font-size: 14px; font-weight: normal; color: #666; margin-top: 8px">
          对局分析已禁用
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { Game } from '@shared/types/league-client/match-history'
import { createReusableTemplate, refDebounced, useElementSize } from '@vueuse/core'
import { NButton, NScrollbar, NSelect } from 'naive-ui'
import { computed, reactive, ref, useTemplateRef } from 'vue'

import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'

import StandaloneMatchHistoryCardModal from '../match-history/card/StandaloneMatchHistoryCardModal.vue'
import PlayerInfoCard from './PlayerInfoCard.vue'
import {
  FIXED_CARD_WIDTH_PX_LITERAL,
  PRE_MADE_TEAMS as PREMADE_TEAMS,
  TEAM_NAMES,
  TeamMeta,
  useIdleState,
  useOrderOptions,
  useSgpTagOptions
} from './ongoing-game-utils'

const lc = useLeagueClientStore()
const app = useAppCommonStore()

const og = useOngoingGameStore()
const sgp = useSgpStore()
const ogs = useInstance<OngoingGameRenderer>('ongoing-game-renderer')

const mh = useInstance<MatchHistoryTabsRenderer>('match-history-tabs-renderer')

const isInIdleState = useIdleState()

const canUseSgpApi = computed(() => {
  return og.settings.matchHistoryUseSgpApi && sgp.availability.serversSupported.matchHistory
})

const sortedTeams = computed(() => {
  if (!og.teams) {
    return {}
  }

  const sorted: Record<string, string[]> = {}

  Object.entries(og.teams).forEach(([team, players]) => {
    if (!players.length) {
      return
    }

    sorted[team] = players.toSorted((a, b) => {
      const statsA = og.playerStats?.players[a]
      const statsB = og.playerStats?.players[b]

      if (og.settings.orderPlayerBy === 'akari-score') {
        return (statsB?.akariScore.total || 0) - (statsA?.akariScore.total || 0)
      }

      if (og.settings.orderPlayerBy === 'kda') {
        return (statsB?.summary.averageKda || 0) - (statsA?.summary.averageKda || 0)
      }

      if (og.settings.orderPlayerBy === 'win-rate') {
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
  Object.entries(og.premadeTeams || {}).forEach(([_, groups]) => {
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
  if (og.gameInfo?.queueType === 'CHERRY') {
    if (lc.gameflow.phase === 'ChampSelect') {
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

const orderOptions = useOrderOptions()
const sgpTagOptions = useSgpTagOptions()

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

const { navigateToTab } = mh.useNavigateToTab()
const handleToSummoner = (puuid: string) => {
  navigateToTab(puuid)
}

// 基于经验的手动测量, 确定的较为不错的列数, 最多支持 8 列
// 注意, 这建立在卡片元素在 240px 宽度的基础上, 同时行间隔为 4px. 如果任意一个条件发生变化, 列数需要重新调整
const { width } = useElementSize(useTemplateRef('page-el'))
const columnsNeed = computed(() => {
  const teamColumns = Object.values(og.teams || {})
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

.header-controls {
  display: flex;
  justify-content: flex-end;
  // margin-bottom: 8px; // maybe it's unnecessary
  gap: 8px;

  .queue-selector,
  .order-selector {
    width: 160px;
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
