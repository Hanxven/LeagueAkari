<template>
  <div class="wrapper" v-if="data">
    <div class="queue">
      <IndicatorPulse style="margin-right: 8px" />
      <div class="queue-name">
        {{ gameData.queues[data.game.gameQueueConfigId]?.name || data.game.gameQueueConfigId }}
      </div>
      <NPopover :disabled="isCrossRegion">
        <template #trigger>
          <NButton
            class="launch-spectator"
            size="tiny"
            @click="() => handleSpectate(false)"
            :disabled="!isSpectatorAvailable || !canSpectate"
          >
            <template #icon>
              <NIcon>
                <PlayCircleFilledIcon />
              </NIcon>
            </template>
            观战</NButton
          >
        </template>
        <ControlItem label="使用 LCU API 观战 (可选)" :label-width="240">
          <template #labelDescription>
            <div>使用 LCU API 调起同大区观战流程，而非通过进程调用</div>
            <div class="warn-text" v-if="gameflow.phase !== 'None'">
              使用 LCU API 观战需要退出房间到空闲状态，当前不是空闲状态。请先退出房间
            </div>
          </template>
          <NButton
            class="launch-spectator"
            size="tiny"
            @click="() => handleSpectate(true)"
            :disabled="!isSpectatorAvailable || !canSpectate || gameflow.phase !== 'None'"
          >
            <template #icon>
              <NIcon>
                <PlayCircleFilledIcon />
              </NIcon>
            </template>
            LCU API 观战</NButton
          >
        </ControlItem>
      </NPopover>
    </div>
    <div class="time">
      于 {{ dayjs(data.playerCredentials.gameCreateDate).format('MM-DD HH:mm:ss') }} 开始 ({{
        relativeText
      }})
    </div>
    <div class="divider"></div>
    <DefineTeamSide v-slot="{ bans, players, name, id }">
      <div class="team">
        <div class="team-name">
          <span v-if="name">{{ name }}</span>
          <div class="bans" v-if="bans && bans.length">
            <span class="bans-hint">禁用</span>
            <LcuImage
              class="champion-icon"
              v-for="ban of bans"
              :src="championIconUrl(ban.championId)"
            />
          </div>
        </div>
        <div class="team-players" :class="{ blue: id === 100 || id === 0, red: id === 200 }">
          <div v-for="player in players" :key="player.puuid" class="team-player">
            <PositionIcon
              class="position-icon"
              v-if="player.selectedPosition !== 'NONE'"
              :position="player.selectedPosition"
            />
            <LcuImage
              v-if="isTftMode"
              class="champion-icon"
              :src="profileIconUrl(player.profileIconId)"
            />
            <LcuImage v-else class="champion-icon" :src="championIconUrl(player.championId)" />
            <div
              class="player-name"
              @click="() => emits('toSummoner', player.puuid)"
              @mouseup.prevent="(event) => handleMouseUp(event, player.puuid)"
              @mousedown="handleMouseDown"
              :class="{ self: player.puuid === puuid }"
            >
              <span class="name">{{
                updatedSummonerInfo[player.puuid]
                  ? updatedSummonerInfo[player.puuid].gameName
                  : player.summonerName
              }}</span>
              <span v-if="updatedSummonerInfo[player.puuid]" class="tag-line"
                >#{{ updatedSummonerInfo[player.puuid].tagLine }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </DefineTeamSide>
    <div
      class="cherry-bans"
      v-if="data.game.gameMode === 'CHERRY' && data.game.bannedChampions.length"
    >
      <span class="bans-hint">禁用</span>
      <div class="bans-wrap">
        <LcuImage
          class="champion-icon"
          v-for="ban of data.game.bannedChampions"
          :src="championIconUrl(ban.championId)"
        />
      </div>
    </div>
    <TeamSide
      v-if="teams && teams.team1 && teams.team1.players.length"
      :players="teams.team1.players"
      :name="teams.team1.name"
      :bans="teams.team1.bans"
      :id="100"
    />
    <TeamSide
      v-if="teams && teams.team2 && teams.team2.players.length"
      :players="teams.team2.players"
      :name="teams.team2.name"
      :bans="teams.team2.bans"
      :id="200"
    />
  </div>
  <div class="placeholder" v-else>无进行中对局</div>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { championIconUrl, profileIconUrl } from '@renderer-shared/modules/game-data'
import { useGameDataStore } from '@renderer-shared/modules/lcu-state-sync/game-data'
import { useGameflowStore } from '@renderer-shared/modules/lcu-state-sync/gameflow'
import { getPlayerAccountNameset } from '@renderer-shared/rc-http-api/rc-api'
import { SpectatorData } from '@shared/data-sources/sgp/types'
import { PlayCircleFilled as PlayCircleFilledIcon } from '@vicons/material'
import { createReusableTemplate, useIntervalFn, useTimeoutFn } from '@vueuse/core'
import dayjs from 'dayjs'
import { NButton, NIcon, NPopover } from 'naive-ui'
import { computed, ref, shallowRef, watch } from 'vue'

import PositionIcon from '@main-window/components/icons/position-icons/PositionIcon.vue'

import IndicatorPulse from './IndicatorPulse.vue'

const emits = defineEmits<{
  toSummoner: [puuid: string, newTab?: boolean]
  launchSpectator: [puuid: string, byLcuApi: boolean]
}>()

const [DefineTeamSide, TeamSide] = createReusableTemplate<{
  players: SpectatorData['game']['teamOne']
  bans?: SpectatorData['game']['bannedChampions']
  name: string
  id: number
}>()

const {
  data,
  puuid,
  isCrossRegion = false
} = defineProps<{
  isCrossRegion?: boolean
  puuid: string
  data: SpectatorData
}>()

// 将在日后更新
const canSpectate = computed(() => {
  return true
})

const isTftMode = computed(() => {
  return data.game.gameMode === 'TFT'
})

const gameflow = useGameflowStore()

const teams = computed(() => {
  if (!data) {
    return null
  }

  if (data.game.gameMode === 'CHERRY') {
    return {
      team1: {
        id: 0,
        name: '全体',
        players: data.game.teamOne
      }
    }
  } else if (data.game.gameMode === 'TFT') {
    return {
      team1: {
        id: 0,
        name: '',
        players: data.game.teamOne
      }
    }
  }

  return {
    team1: {
      id: 100,
      name: '蓝色方',
      players: data.game.teamOne,
      bans: data.game.bannedChampions.filter((ban) => ban.teamId === 100)
    },
    team2: {
      id: 200,
      name: '红色方',
      players: data.game.teamTwo,
      bans: data.game.bannedChampions.filter((ban) => ban.teamId === 200)
    }
  }
})

const gameData = useGameDataStore()

const relativeText = ref(dayjs(data.playerCredentials.gameCreateDate).locale('zh-cn').fromNow())
useIntervalFn(
  () => {
    relativeText.value = dayjs(data.playerCredentials.gameCreateDate).locale('zh-cn').fromNow()
  },
  1000 * 10,
  { immediate: true, immediateCallback: true }
)

const updatedSummonerInfo = shallowRef<Record<string, { gameName: string; tagLine: string }>>({})

watch(
  () => data,
  async (d) => {
    if (d) {
      const puuids = data.game.teamOne.concat(data.game.teamTwo).map((p) => p.puuid)

      for (const puuid of puuids) {
        if (updatedSummonerInfo.value[puuid]) {
          continue
        }

        try {
          const p = await getPlayerAccountNameset(puuid)
          updatedSummonerInfo.value = {
            ...updatedSummonerInfo.value,
            [puuid]: {
              gameName: p.gnt.gameName,
              tagLine: p.gnt.tagLine
            }
          }
        } catch {}
      }
    }
  },
  { immediate: true }
)

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

const { start } = useTimeoutFn(() => {
  isSpectatorAvailable.value = true
}, 2000)

// 防 呆 设 计
const isSpectatorAvailable = ref(true)
const handleSpectate = (byLcuApi: boolean) => {
  isSpectatorAvailable.value = false
  start()
  emits('launchSpectator', puuid, byLcuApi)
}
</script>

<style lang="less" scoped>
.queue {
  display: flex;
  align-items: center;

  .queue-name {
    font-size: 14px;
    font-weight: bold;
    flex: 1;
    width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.divider {
  height: 1px;
  background-color: #ffffff10;
  margin: 8px 0;
}

.time {
  color: #d2d2d2;
  font-size: 12px;
  margin-top: 2px;
  margin-bottom: 4px;
}

.team {
  .team-name {
    display: flex;
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 4px;

    .bans {
      margin-left: auto;
      display: flex;
      align-items: flex-end;
      gap: 2px;

      .bans-hint {
        margin-right: 2px;
        font-weight: normal;
        font-size: 10px;
        color: #d6d6d6;
      }
    }
  }

  .team-players {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px;
    border-radius: 2px;

    &.blue {
      background-color: #3c539320;
    }

    &.red {
      background-color: #9a303e20;
    }
  }

  &:not(:last-child) {
    margin-bottom: 8px;
  }
}

.team-player {
  display: flex;
  align-items: center;

  .position-icon {
    font-size: 18px;
    color: #d6d6d6;
    margin-right: 2px;
  }

  .player-name {
    margin-left: 4px;
    font-size: 12px;
    transition: filter 0.3s;
    cursor: pointer;

    .tag-line {
      font-size: 11px;
      color: #858585;
      margin-left: 2px;
    }

    &.self {
      font-weight: bold;
      color: #e8e8e8;
    }

    &:hover {
      filter: brightness(1.2);
    }
  }
}

.champion-icon {
  width: 18px;
  height: 18px;
}

.cherry-bans {
  display: flex;

  .bans-wrap {
    margin-left: auto;
    display: flex;
    align-items: flex-end;
    gap: 2px;
    flex-wrap: wrap;
    max-width: 160px;
  }

  .bans-hint {
    margin-right: 2px;
    font-weight: normal;
    font-size: 10px;
    color: #d6d6d6;
  }
}

.operations {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
  color: #d6d6d6;
  margin-top: 8px;
}

.placeholder {
  font-size: 12px;
  color: #d6d6d6;
  text-align: center;
  margin-top: 8px;
}

.warn-text {
  color: yellow;
}
</style>
