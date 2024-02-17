<template>
  <div class="ongoing-game-wrapper" ref="el">
    <!-- 提供一个简单的历史对局查看工具 -->
    <StandaloneMatchHistoryCardModal
      :game-id="showingGame.id"
      :self-id="showingGame.summonerId"
      v-model:show="isStandaloneMatchHistoryCardShow"
    />
    <div v-if="!isIdle" class="ongoing-game-inner">
      <!-- 蓝队 -->
      <DefineOngoingTeam v-slot="{ participants, team }">
        <div class="team">
          <PlayerInfoCard
            v-for="p of participants.toSorted((a, b) => (a.order || -1) - (b.order || -1))"
            :key="p.id"
            :id="p.id"
            :is-self="p.id === summoner.currentSummoner?.summonerId"
            :summoner-info="p.summoner"
            :ranked-stats="p.rankedStats"
            :match-history="p.matchHistory"
            :champion-id="p.championId"
            :team="team"
            :queue-type="mh.ongoingGame?.queueType"
            :saved-info="p.savedInfo"
            @show-game="(id, selfId) => handleShowGame(id, selfId)"
            @to-summoner="(id) => handleToSummoner(id)"
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
        v-if="mh.ongoingPreMadeTeamsSimplifiedArray.length"
        style="background-color: transparent; margin-bottom: 12px"
        size="small"
      >
        <template #header
          ><span class="card-header-title"
            >预组队推测
            <span style="font-size: 12px; color: rgb(184, 184, 184); font-weight: normal"
              >(统计自 {{ Object.keys(mh.ongoingDetailedGamesCache).length }} 场游戏)</span
            ></span
          ></template
        >
        <div class="pre-made-team">
          <div
            class="group"
            v-for="g of mh.ongoingPreMadeTeamsSimplifiedArray"
            :class="{
              blue: g.team === '100',
              red: g.team === '200',
              green: g.team !== '100' && g.team !== '200'
            }"
          >
            <div class="team-side">
              {{ formatTeamText(g.team) }} ({{ g.times
              }}{{ g.times >= settings.matchHistory.teamAnalysisPreloadCount ? '+' : '' }}
              场对局)
            </div>
            <div class="players">
              <div v-for="p of g.players" class="image-name-line">
                <LcuImage
                  :title="mh.ongoingPlayers[p]?.summoner?.displayName || p"
                  class="image"
                  :src="championIcon(mh.ongoingPlayers[p]?.championId || -1)"
                />
                <div class="name">{{ mh.ongoingPlayers[p]?.summoner?.displayName || p }}</div>
              </div>
            </div>
          </div>
        </div>
      </NCard>
      <NCard
        v-if="settings.matchHistory.sendKdaInGame"
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
              :key="player.id"
              :checked="mh.sendPlayers[player.id]"
              @update:checked="(val) => setInGameKdaSendPlayer(player.id, val)"
              >{{ player.summoner?.displayName || player.id }}</NCheckbox
            >
          </div>
        </ControlItem>
      </NCard>
    </div>
    <div v-else class="no-ongoing-game">
      <div>League Toolkit</div>
      <div style="font-size: 14px; font-weight: normal">没有正在进行中的游戏</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createReusableTemplate } from '@vueuse/core'
import { NCard, NCheckbox } from 'naive-ui'
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import ControlItem from '@renderer/components/ControlItem.vue'
import LcuImage from '@renderer/components/LcuImage.vue'
import { useKeepAliveScrollPositionMemo } from '@renderer/compositions/useKeepAliveScrollPositionMemo'
import { championIcon } from '@renderer/features/game-data'
import { setInGameKdaSendPlayer } from '@renderer/features/match-history'
import { useGameflowStore } from '@renderer/features/stores/lcu/gameflow'
import { useSummonerStore } from '@renderer/features/stores/lcu/summoner'
import { OngoingTeamPlayer, useMatchHistoryStore } from '@renderer/features/stores/match-history'
import { useSettingsStore } from '@renderer/features/stores/settings'

import StandaloneMatchHistoryCardModal from '../match-history/card/StandaloneMatchHistoryCardModal.vue'
import PlayerInfoCard from './PlayerInfoCard.vue'

const mh = useMatchHistoryStore()
const router = useRouter()
const gameflow = useGameflowStore()
const summoner = useSummonerStore()
const settings = useSettingsStore()

const handleToSummoner = (summonerId: number) => {
  if (summonerId === 0) {
    return
  }
  return router.replace(`/match-history/${summonerId}`)
}

const isIdle = computed(() => {
  return (
    gameflow.phase === 'Lobby' ||
    gameflow.phase === 'None' ||
    gameflow.phase === 'Matchmaking' ||
    gameflow.phase === 'ReadyCheck' ||
    gameflow.phase === 'WatchInProgress'
  )
})

const teams = computed(() => {
  return Object.entries(mh.ongoingPlayers).reduce(
    (o, [_id, info]) => {
      if (!info.team) {
        return o
      }

      if (o[info.team]) {
        o[info.team].push(info)
      } else {
        o[info.team] = [info]
      }

      return o
    },
    {} as Record<string, OngoingTeamPlayer[]>
  )
})

const [DefineOngoingTeam, OngoingTeam] = createReusableTemplate<{
  participants: OngoingTeamPlayer[]
  team: string
}>({ inheritAttrs: false })

const formatTeamText = (team: string) => {
  if (mh.ongoingGame?.queueType === 'CHERRY') {
    if (gameflow.phase === 'ChampSelect') {
      return team === '100' ? '我方小队' : '敌方小队'
    } else {
      if (team === 'all') {
        return `所有`
      }

      return `小队 ${team}`
    }
  } else {
    if (gameflow.phase === 'ChampSelect') {
      return team === '100' ? '我方' : '敌方'
    } else {
      return team === '100' ? '蓝方' : '红方'
    }
  }
}

const showingGame = reactive({
  id: 0,
  summonerId: 0
})
const isStandaloneMatchHistoryCardShow = ref(false)
const handleShowGame = (gameId: number, summonerId: number) => {
  showingGame.id = gameId
  showingGame.summonerId = summonerId
  isStandaloneMatchHistoryCardShow.value = true
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
}

.no-ongoing-game {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 22px;
  font-weight: 700;
  color: rgb(92, 92, 92);
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
      font-weight: 700;
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
</style>
