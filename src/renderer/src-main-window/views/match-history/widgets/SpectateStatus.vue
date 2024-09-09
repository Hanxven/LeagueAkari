<template>
  <div class="wrapper" v-if="data">
    <div class="queue">
      <span>
        进行中 ·
        {{
          gameData.queues[data.game.gameQueueConfigId]?.name || data.game.gameQueueConfigId
        }}</span
      >
      <NButton
        class="launch-spectator"
        size="tiny"
        @click="handleSpectate"
        :disabled="!isSpectatorAvailable || !canSpectate"
        >拉起观战</NButton
      >
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
          <span>{{ name }}</span>
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
              :class="{ self: player.puuid === puuid }"
            >
              {{
                updatedSummonerInfo[player.puuid]
                  ? `${updatedSummonerInfo[player.puuid].gameName}#${updatedSummonerInfo[player.puuid].tagLine}`
                  : player.summonerName
              }}
            </div>
          </div>
        </div>
      </div>
    </DefineTeamSide>
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
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { externalDataSourceRendererModule as edsm } from '@renderer-shared/modules/external-data-source'
import { championIconUrl, profileIconUrl } from '@renderer-shared/modules/game-data'
import { useGameDataStore } from '@renderer-shared/modules/lcu-state-sync/game-data'
import { getPlayerAccountAlias, getPlayerAccountNameset } from '@renderer-shared/rc-http-api/rc-api'
import { SpectatorData } from '@shared/data-sources/sgp/types'
import { createReusableTemplate, useIntervalFn, useTimeoutFn } from '@vueuse/core'
import dayjs from 'dayjs'
import { NButton } from 'naive-ui'
import { computed, ref, shallowRef, watch } from 'vue'

import PositionIcon from '@main-window/components/icons/position-icons/PositionIcon.vue'

const emits = defineEmits<{
  toSummoner: [puuid: string]
  launchSpectator: [puuid: string]
}>()

const [DefineTeamSide, TeamSide] = createReusableTemplate<{
  players: SpectatorData['game']['teamOne']
  bans?: SpectatorData['game']['bannedChampions']
  name: string
  id: number
}>()

const { data, puuid } = defineProps<{
  puuid: string
  data: SpectatorData
}>()

const canSpectate = computed(() => {
  return data.game.gameMode !== 'TFT'
})

const isTftMode = computed(() => {
  return data.game.gameMode === 'TFT'
})

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
  }
)

const { start } = useTimeoutFn(() => {
  isSpectatorAvailable.value = true
}, 2000)

// 防 呆 设 计
const isSpectatorAvailable = ref(true)
const handleSpectate = () => {
  isSpectatorAvailable.value = false
  start()
  emits('launchSpectator', puuid)
}
</script>

<style lang="less" scoped>
.wrapper {
  width: 266px;
}

.queue {
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;

  .launch-spectator {
    margin-left: auto;
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
    color: #d6d6d6;
    transition: filter 0.2s;
    cursor: pointer;

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
</style>
