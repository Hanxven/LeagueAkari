<template>
  <div class="ongoing-game-wrapper" ref="el">
    <!-- 提供一个简单的历史对局查看工具 -->
    <StandaloneMatchHistoryCardModal
      :game="showingGame.game"
      :game-id="showingGame.gameId"
      :self-puuid="showingGame.selfPuuid"
      v-model:show="isStandaloneMatchHistoryCardShow"
    />
    <PlayerTagEditModal v-model:show="isPlayerTagEditModalShow" :puuid="tagEditingSummonerPuuid" />
    <div
      v-if="!isIdle && !cf.isWaitingForDelay && cf.settings.ongoingAnalysisEnabled"
      class="ongoing-game-inner"
    >
      <div class="header" v-if="cf.settings.matchHistorySource === 'sgp'">
        <NSelect
          style="width: 180px"
          size="small"
          :options="queueOptions"
          @update:value="(val) => cfm.setQueueFilter(val)"
          :value="cf.queueFilter"
        ></NSelect>
      </div>
      <!-- 蓝队 -->
      <DefineOngoingTeam v-slot="{ participants, team }">
        <div class="team">
          <PlayerInfoCard
            v-for="p of participants"
            :key="p.puuid"
            :puuid="p.puuid"
            :is-self="p.puuid === summoner.me?.puuid"
            :summoner-info="p.summoner"
            :ranked-stats="p.rankedStats"
            :match-history="p.matchHistory"
            :champion-id="cf.ongoingChampionSelections?.[p.puuid]"
            :team="team"
            :queue-type="showingQueueType"
            :saved-info="p.savedInfo"
            @show-game-by-id="(id, selfId) => handleShowGameById(id, selfId)"
            @show-game="(game, puuid) => handleShowGame(game, puuid)"
            @to-summoner="(id) => handleToSummoner(id)"
            @show-saved-info="(id) => handleTagEditing(id)"
          />
        </div>
      </DefineOngoingTeam>
      <NCard
        size="small"
        style="margin-bottom: 12px; background-color: transparent"
        v-for="(teamPlayers, team) of teams"
      >
        <template #header
          ><span class="card-header-title">{{ formatTeamText(team) }}</span></template
        >
        <OngoingTeam :team="team" :participants="teamPlayers" />
      </NCard>
      <NCard
        v-if="cf.ongoingPreMadeTeams.length"
        style="background-color: transparent; margin-bottom: 12px"
        size="small"
      >
        <template #header><span class="card-header-title">预组队推测</span></template>
        <div class="pre-made-team">
          <div
            class="group"
            v-for="g of cf.ongoingPreMadeTeams"
            :class="{
              blue: g.team === '100',
              red: g.team === '200',
              green: g.team !== '100' && g.team !== '200'
            }"
          >
            <div class="team-side">
              {{ formatTeamText(g.team) }} ({{ g.times }}
              场对局)
            </div>
            <div class="players">
              <div v-for="p of g.players" class="image-name-line">
                <LcuImage
                  :title="
                    summonerName(
                      cf.ongoingPlayers[p]?.summoner?.gameName ||
                        cf.ongoingPlayers[p]?.summoner?.displayName,
                      cf.ongoingPlayers[p]?.summoner?.tagLine,
                      p.toString()
                    )
                  "
                  class="image"
                  :src="championIcon(cf.ongoingChampionSelections?.[p] || -1)"
                />
                <div class="name">
                  {{
                    summonerName(
                      cf.ongoingPlayers[p]?.summoner?.gameName ||
                        cf.ongoingPlayers[p]?.summoner?.displayName,
                      cf.ongoingPlayers[p]?.summoner?.tagLine,
                      p.toString()
                    )
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </NCard>
      <NCard
        v-if="app.isAdministrator && cf.settings.sendKdaInGame"
        style="background-color: transparent"
        size="small"
      >
        <template #header><span class="card-header-title">KDA 简报</span></template>
        <span style="font-size: 13px; margin-bottom: 12px; display: block"
          >在英雄选择中或游戏内发送 KDA 简报已启用，在设置 -> 战绩 -> KDA 简报 中配置通用选项。
        </span>
        <ControlItem label="发送这些玩家的简报" label-description="只发送这些玩家的简报">
          <div
            v-for="(team, index) of teams"
            :key="index"
            style="display: flex; flex-wrap: wrap; margin-bottom: 4px"
          >
            <NCheckbox
              size="small"
              v-for="player of team"
              :key="player.puuid"
              :checked="cf.sendList[player.puuid]"
              @update:checked="(val) => cfm.setSendPlayer(player.puuid, val)"
              >{{
                summonerName(
                  player.summoner?.gameName || player.summoner?.displayName,
                  player.summoner?.tagLine,
                  player.puuid.slice(0, 6)
                )
              }}</NCheckbox
            >
          </div>
        </ControlItem>
      </NCard>
    </div>
    <div v-else-if="cf.isWaitingForDelay" class="no-ongoing-game">
      <div class="centered">
        <LeagueAkariSpan bold class="akari-text" />
        <NFlex align="center">
          <NSpin :size="14" />
          <div style="font-size: 14px; font-weight: normal; color: #888">等待加载延时...</div>
        </NFlex>
      </div>
    </div>
    <div v-else class="no-ongoing-game">
      <div class="centered">
        <LeagueAkariSpan bold class="akari-text" />
        <div
          v-if="cf.settings.ongoingAnalysisEnabled"
          style="font-size: 14px; font-weight: normal; color: #666"
        >
          {{ lc.state !== 'connected' ? '未连接到客户端' : '没有正在进行中的游戏' }}
        </div>
        <div v-else style="font-size: 14px; font-weight: normal; color: #666">对局分析已禁用</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EMPTY_PUUID } from '@shared/constants/common'
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import LeagueAkariSpan from '@shared/renderer/components/LeagueAkariSpan.vue'
import { useKeepAliveScrollPositionMemo } from '@shared/renderer/compositions/useKeepAliveScrollPositionMemo'
import { useAppStore } from '@shared/renderer/modules/app/store'
import { coreFunctionalityRendererModule as cfm } from '@shared/renderer/modules/core-functionality'
import {
  OngoingPlayer,
  useCoreFunctionalityStore
} from '@shared/renderer/modules/core-functionality/store'
import { championIcon } from '@shared/renderer/modules/game-data'
import { useLcuConnectionStore } from '@shared/renderer/modules/lcu-connection/store'
import { useGameDataStore } from '@shared/renderer/modules/lcu-state-sync/game-data'
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync/gameflow'
import { useSummonerStore } from '@shared/renderer/modules/lcu-state-sync/summoner'
import { Game } from '@shared/types/lcu/match-history'
import { summonerName } from '@shared/utils/name'
import { createReusableTemplate } from '@vueuse/core'
import { NCard, NCheckbox, NFlex, NSelect, NSpin } from 'naive-ui'
import { computed, reactive, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import PlayerTagEditModal from '@main-window/components/PlayerTagEditModal.vue'

import StandaloneMatchHistoryCardModal from '../match-history/card/StandaloneMatchHistoryCardModal.vue'
import PlayerInfoCard from './PlayerInfoCard.vue'

const router = useRouter()

const cf = useCoreFunctionalityStore()
const gameflow = useGameflowStore()
const summoner = useSummonerStore()
const gameData = useGameDataStore()

const app = useAppStore()

// FOR DEBUGGING ONLY
watchEffect(() => {
  const value = Object.entries(cf.ongoingPlayers)
    .filter((p) => Boolean(p[1].championMastery))
    .map((p) => ({
      puuid: p[0],
      mastery: p[1].championMastery
    }))
  console.log(value)
})

// just a workaround
const showingQueueType = computed(() => {
  if (cf.queueFilter === 1700) {
    return 'CHERRY'
  }

  return cf.ongoingGameInfo?.queueType
})

const queueOptions = computed(() => {
  return [
    {
      label: '所有队列',
      value: -1
    },
    {
      label: gameData.queues[420]?.name || 'Ranked Solo/Duo',
      value: 420
    },
    {
      label: gameData.queues[430]?.name || 'Normal',
      value: 430
    },
    {
      label: gameData.queues[440]?.name || 'Ranked Flex',
      value: 440
    },
    {
      label: gameData.queues[450]?.name || 'ARAM',
      value: 450
    },

    {
      label: gameData.queues[1700]?.name || 'ARENA',
      value: 1700
    },
    {
      label: gameData.queues[490]?.name || 'Quickplay',
      value: 490
    },
    {
      label: gameData.queues[1900]?.name || 'URF',
      value: 1900
    },
    {
      label: gameData.queues[900]?.name || 'ARURF',
      value: 900
    }
  ]
})

const handleToSummoner = (puuid: string) => {
  if (!puuid || puuid === EMPTY_PUUID) {
    return
  }
  return router.replace(`/match-history/${puuid}`)
}

const lc = useLcuConnectionStore()

const isIdle = computed(() => {
  return (
    gameflow.phase === 'Lobby' ||
    gameflow.phase === 'None' ||
    gameflow.phase === 'Matchmaking' ||
    gameflow.phase === 'ReadyCheck' ||
    gameflow.phase === 'WatchInProgress' ||
    lc.state !== 'connected'
  )
})

const teams = computed(() => {
  if (!cf.ongoingTeams || !cf.ongoingPlayers) {
    return {}
  }

  const teamsWithPlayers: Record<string, OngoingPlayer[]> = {}
  Object.entries(cf.ongoingTeams).forEach(([team, players]) => {
    if (!players.length) {
      return
    }

    const ps = players.filter((p) => cf.ongoingPlayers[p]).map((p) => cf.ongoingPlayers[p])
    if (ps.length) {
      teamsWithPlayers[team] = ps
    }
  })

  return teamsWithPlayers
})

const [DefineOngoingTeam, OngoingTeam] = createReusableTemplate<{
  participants: OngoingPlayer[]
  team: string
}>({ inheritAttrs: false })

const formatTeamText = (team: string) => {
  if (cf.ongoingGameInfo?.queueType === 'CHERRY') {
    if (gameflow.phase === 'ChampSelect') {
      return team.startsWith('our') ? '我方小队' : '敌方小队'
    } else {
      if (team === 'all') {
        return `所有`
      }

      return `全体`
    }
  } else {
    if (gameflow.phase === 'ChampSelect') {
      switch (team) {
        case 'our':
          return '我方'
        case 'our-1':
          return '我方 (蓝方)'
        case 'our-2':
          return '我方 (红方)'
        case 'their':
          return '敌方'
        case 'their-1':
          return '敌方 (蓝方)'
        case 'their-2':
          return '敌方 (红方)'

        default:
          return '队伍'
      }
    } else {
      return team === '100' ? '蓝方' : '红方'
    }
  }
}

const showingGame = reactive<{
  gameId: number
  game: Game | null
  selfPuuid: string
}>({
  gameId: 0,
  game: null,
  selfPuuid: ''
})

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

const isPlayerTagEditModalShow = ref(false)
const tagEditingSummonerPuuid = ref('')
const handleTagEditing = (puuid: string) => {
  isPlayerTagEditModalShow.value = true
  tagEditingSummonerPuuid.value = puuid
}

const el = ref()
useKeepAliveScrollPositionMemo(el)
</script>

<style lang="less" scoped>
.ongoing-game-wrapper {
  position: relative;
  padding: 0 24px;
  box-sizing: border-box;
  height: 100%;
  overflow-y: scroll;
}

.ongoing-game-inner {
  padding: 24px 0;
  position: relative;
  min-width: 800px;
  max-width: 1024px;
  margin: 0 auto;

  font-size: 12px;
  white-space: pre;

  .header {
    height: 36px;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
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

.team {
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr 1fr;
}

.card-header-title {
  font-weight: bold;
  font-size: 18px;
}

.pre-made-team {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px;

  .group {
    border-radius: 4px;
    border: 1px solid rgb(64, 64, 64);
    padding: 4px 8px;

    &.blue {
      border-color: rgb(87, 116, 155);
    }

    &.red {
      border-color: rgb(152, 74, 41);
    }

    &.green {
      border-color: rgb(41, 152, 130);
    }

    .image {
      height: 24px;
      width: 24px;
      border-radius: 50%;
    }

    .name {
      font-size: 12px;
    }

    .image-name-line {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .players {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .team-side {
      font-size: 12px;
      font-weight: bold;
      color: rgb(203, 203, 203);
    }

    &.blue .team-side {
      color: rgb(131, 179, 247);
    }

    &.red .team-side {
      color: rgb(240, 120, 68);
    }
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
