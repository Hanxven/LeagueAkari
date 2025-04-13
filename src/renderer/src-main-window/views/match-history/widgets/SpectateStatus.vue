<template>
  <div class="wrapper" v-if="data">
    <div class="queue">
      <IndicatorPulse style="margin-right: 8px" />
      <div class="queue-name">
        {{ lcs.gameData.queues[data.game.gameQueueConfigId]?.name || data.game.gameQueueConfigId }}
      </div>
      <NPopover>
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
            {{ t('SpectateStatus.button') }}</NButton
          >
        </template>
        <ControlItem
          style="margin-bottom: 8px"
          v-if="!isCrossRegion"
          :label="t('SpectateStatus.lcuSpectate.label')"
          :label-width="240"
        >
          <template #labelDescription>
            <div>{{ t('SpectateStatus.lcuSpectate.description') }}</div>
            <div class="warn-text" v-if="lcs.gameflow.phase !== 'None'">
              {{ t('SpectateStatus.lcuSpectate.descriptionNotIdle') }}
            </div>
          </template>
          <NButton
            class="launch-spectator"
            size="tiny"
            @click="() => handleSpectate(true)"
            :disabled="!isSpectatorAvailable || !canSpectate || lcs.gameflow.phase !== 'None'"
          >
            <template #icon>
              <NIcon>
                <PlayCircleFilledIcon />
              </NIcon>
            </template>
            {{ t('SpectateStatus.lcuSpectate.button') }}</NButton
          >
        </ControlItem>
        <ControlItem
          :label="t('SpectateStatus.tokenSpectate.label')"
          :label-width="240"
          :label-description="t('SpectateStatus.tokenSpectate.description')"
        >
          <NButton
            class="launch-spectator"
            size="tiny"
            @click="handleCopyToken"
            :disabled="!canSpectate"
          >
            <template #icon>
              <NIcon>
                <CopyAllFilledIcon />
              </NIcon>
            </template>
            {{ t('SpectateStatus.tokenSpectate.button') }}</NButton
          >
        </ControlItem>
      </NPopover>
    </div>
    <div class="time">
      {{
        t('SpectateStatus.startFrom', {
          date: dayjs(data.playerCredentials.gameCreateDate).format('MM-DD HH:mm:ss'),
          relativeTime: relativeText
        })
      }}
    </div>
    <div class="divider"></div>
    <DefineTeamSide v-slot="{ bans, players, name, id }">
      <div class="team">
        <div class="team-name">
          <span v-if="name">{{ name }}</span>
          <div class="bans" v-if="bans && bans.length">
            <span class="bans-hint">{{ t('SpectateStatus.bans') }}</span>
            <LcuImage
              class="champion-icon"
              v-for="ban of bans"
              :src="championIconUri(ban.championId)"
            />
          </div>
        </div>
        <div class="team-players" :class="{ blue: id === 100 || id === 0, red: id === 200 }">
          <div v-for="(player, index) in players" :key="player.puuid" class="team-player">
            <PositionIcon
              class="position-icon"
              v-if="player.selectedPosition !== 'NONE'"
              :position="player.selectedPosition"
            />
            <LcuImage
              v-if="isTftMode"
              class="champion-icon"
              :src="profileIconUri(player.profileIconId)"
            />
            <LcuImage v-else class="champion-icon" :src="championIconUri(player.championId)" />
            <div
              v-if="premadeInfo[player.puuid]"
              class="premade-team-name"
              :style="{
                color: premadeInfo[player.puuid].color.foregroundColor
              }"
            >
              {{ premadeInfo[player.puuid]?.teamName }}
            </div>
            <div
              class="player-name"
              @click="() => emits('toSummoner', player.puuid)"
              @mouseup.prevent="(event) => handleMouseUp(event, player.puuid)"
              @mousedown="handleMouseDown"
              :class="{ self: player.puuid === puuid }"
              :style="{
                color: premadeInfo[player.puuid]?.color.foregroundColor || '#fffd'
              }"
            >
              <StreamerModeMaskedText>
                <template #masked>
                  <span class="name">{{ summonerName(player.puuid, index) }}</span>
                </template>
                <span class="name">{{
                  updatedSummonerInfo[player.puuid]
                    ? updatedSummonerInfo[player.puuid].gameName
                    : player.summonerName
                }}</span>
                <span v-if="updatedSummonerInfo[player.puuid]" class="tag-line"
                  >#{{ updatedSummonerInfo[player.puuid].tagLine }}</span
                >
              </StreamerModeMaskedText>
            </div>
          </div>
        </div>
      </div>
    </DefineTeamSide>
    <div
      class="cherry-bans"
      v-if="data.game.gameMode === 'CHERRY' && data.game.bannedChampions.length"
    >
      <span class="bans-hint">{{ t('SpectateStatus.bans') }}</span>
      <div class="bans-wrap">
        <LcuImage
          class="champion-icon"
          v-for="ban of data.game.bannedChampions"
          :src="championIconUri(ban.championId)"
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
  <div class="placeholder" v-else>No Data</div>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import StreamerModeMaskedText from '@renderer-shared/components/StreamerModeMaskedText.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import {
  PREMADE_TEAMS,
  PREMADE_TEAM_COLORS
} from '@renderer-shared/components/ongoing-game-panel/ongoing-game-utils'
import { useStreamerModeMaskedText } from '@renderer-shared/compositions/useStreamerModeMaskedText'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri, profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { RiotClientRenderer } from '@renderer-shared/shards/riot-client'
import { SpectatorData } from '@shared/data-sources/sgp/types'
import {
  CopyAllFilled as CopyAllFilledIcon,
  PlayCircleFilled as PlayCircleFilledIcon
} from '@vicons/material'
import { createReusableTemplate, useIntervalFn, useTimeoutFn } from '@vueuse/core'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NPopover, useMessage } from 'naive-ui'
import { computed, ref, shallowRef, watch } from 'vue'

import IndicatorPulse from './IndicatorPulse.vue'

const { t } = useTranslation()
const as = useAppCommonStore()

const emits = defineEmits<{
  toSummoner: [puuid: string, setCurrent?: boolean]
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
  isCrossRegion = false,
  sgpServerId
} = defineProps<{
  isCrossRegion?: boolean
  puuid: string
  sgpServerId: string
  data: SpectatorData
}>()

// 将在日后更新
const canSpectate = computed(() => {
  return true
})

const isTftMode = computed(() => {
  return data.game.gameMode === 'TFT'
})

const lcs = useLeagueClientStore()
const rc = useInstance(RiotClientRenderer)

const teams = computed(() => {
  if (!data) {
    return null
  }

  if (data.game.gameMode === 'CHERRY') {
    return {
      team1: {
        id: 0,
        name: t('common.teams.all'),
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
      name: t('common.teams.100'),
      players: data.game.teamOne,
      bans: data.game.bannedChampions.filter((ban) => ban.teamId === 100)
    },
    team2: {
      id: 200,
      name: t('common.teams.200'),
      players: data.game.teamTwo,
      bans: data.game.bannedChampions.filter((ban) => ban.teamId === 200)
    }
  }
})

const relativeText = ref(
  dayjs(data.playerCredentials.gameCreateDate).locale(as.settings.locale.toLowerCase()).fromNow()
)
useIntervalFn(
  () => {
    relativeText.value = dayjs(data.playerCredentials.gameCreateDate)
      .locale(as.settings.locale.toLowerCase())
      .fromNow()
  },
  1000 * 10,
  { immediate: true, immediateCallback: true }
)

watch(
  () => as.settings.locale,
  (locale) => {
    relativeText.value = dayjs(data.playerCredentials.gameCreateDate)
      .locale(locale.toLowerCase())
      .fromNow()
  }
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
          const { data } = await rc.api.playerAccount.getPlayerAccountNameset([puuid])

          if (data.namesets.length === 0) {
            return
          }

          updatedSummonerInfo.value = {
            ...updatedSummonerInfo.value,
            [puuid]: {
              gameName: data.namesets[0].gnt.gameName,
              tagLine: data.namesets[0].gnt.tagLine
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

const message = useMessage()

const handleCopyToken = () => {
  const token = {
    akariVersion: as.version,
    sgpServerId,
    observerEncryptionKey: data.playerCredentials.observerEncryptionKey,
    observerServerPort: data.playerCredentials.observerServerPort,
    observerServerIp: data.playerCredentials.observerServerIp,
    gameId: data.game.id,
    gameMode: data.game.gameMode
  }

  const str = JSON.stringify(token)

  navigator.clipboard
    .writeText(str)
    .then(() => {
      message.success(t('SpectateStatus.tokenSpectate.copied'))
    })
    .catch(() => {
      message.error(t('SpectateStatus.tokenSpectate.copyFailed'))
    })
}

const { summonerName } = useStreamerModeMaskedText()

const premadeInfo = computed(() => {
  if (!data) {
    return {}
  }

  let index = 0
  const teams: Record<number, string[]> = {}
  ;[...data.game.teamOne, ...data.game.teamTwo].forEach((player) => {
    if (!teams[player.teamParticipantId]) {
      teams[player.teamParticipantId] = []
    }
    teams[player.teamParticipantId].push(player.puuid)
  })

  return Object.entries(teams).reduce(
    (prev, cur) => {
      const [_teamId, puuids] = cur

      if (puuids.length < 2) {
        return prev
      }

      const teamName = PREMADE_TEAMS[index++]
      const color = PREMADE_TEAM_COLORS[teamName]
      puuids.forEach((puuid) => {
        prev[puuid] = {
          color,
          teamName
        }
      })

      return prev
    },
    {} as Record<string, any>
  )
})
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

  .premade-team-name {
    font-size: 11px;
    font-weight: bold;
    line-height: 11px;
    padding: 2px;
    border-radius: 2px;
    background-color: #ffffff20;
    min-width: 12px;
    text-align: center;
    margin-left: 4px;
  }

  .position-icon {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.8);
    margin-right: 2px;
  }

  .player-name {
    margin-left: 2px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.3s;
    padding: 0 2px;
    border-radius: 2px;

    .tag-line {
      font-size: 11px;
      margin-left: 2px;
    }

    .name {
      font-weight: bold;
    }

    &:hover {
      background-color: #ffffff20;
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
