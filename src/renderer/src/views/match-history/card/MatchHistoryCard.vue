<template>
  <div class="match-history-card-wrapper">
    <NModal size="small" v-model:show="isModalShow">
      <MiscellaneousPanel :game="game" />
    </NModal>
    <DefineSubTeam v-slot="{ participants, mode }">
      <div class="sub-team">
        <div class="player" v-for="p of participants" :key="p.participantId">
          <LcuImage class="image" :src="championIcon(p.championId)" />
          <div
            :title="p.identity.player.summonerName"
            class="name"
            :class="{ self: p.isSelf }"
            @click="() => handleToSummoner(p.identity.player.summonerId)"
          >
            {{ p.identity.player.summonerName }}
          </div>
        </div>
        <div
          class="placement"
          v-if="
            mode === 'CHERRY' &&
            participants &&
            participants.length &&
            participants[0].stats.subteamPlacement
          "
        >
          {{ participants[0].stats.subteamPlacement }}
        </div>
      </div>
    </DefineSubTeam>
    <div v-if="self" class="match-history-card" :class="composedResultClass">
      <div class="game">
        <div class="mode">
          {{ formattedModeText }}
        </div>
        <div
          class="begin-time"
          :title="dayjs(game.gameCreation).locale('zh-cn').format('YYYY-MM-DD HH:mm:ss')"
        >
          {{ formattedGameCreationRelativeTime }}
        </div>
        <div class="divider"></div>
        <div
          class="result"
          :class="{ 'first-place': self.participant.stats.subteamPlacement === 1 }"
        >
          {{ formattedResultText }}
        </div>
        <div class="duration">
          {{
            dayjs
              .duration(game.gameDuration * 1000)
              .locale('zh-cn')
              .format('m 分 s 秒')
          }}
        </div>
      </div>
      <div class="info">
        <div class="stats">
          <div class="champion">
            <LcuImage
              class="champion-icon"
              :src="championIcon(self.participant.championId)"
            ></LcuImage>
            <div class="champion-level">{{ self.participant.stats.champLevel }}</div>
          </div>
          <div class="summoner-spells">
            <SummonerSpellDisplay :spell-id="self.participant.spell1Id" :size="24" />
            <SummonerSpellDisplay :spell-id="self.participant.spell2Id" :size="24" />
          </div>
          <div
            class="perks"
            v-if="self.participant.stats.perkPrimaryStyle && self.participant.stats.perkSubStyle"
          >
            <PerkDisplay :perk-id="self.participant.stats.perk0" :size="24" />
            <!-- It should be 'perkstyle', but I still use class name 'perk' here. -->
            <PerkstyleDisplay :size="24" :perkstyle-id="self.participant.stats.perkSubStyle" />
          </div>
          <div class="kda-info">
            <div class="kda">
              <span class="k">{{ self.participant.stats.kills }}</span
              ><span class="divider">/</span
              ><span class="d">{{ self.participant.stats.deaths }}</span
              ><span class="divider">/</span
              ><span class="a">{{ self.participant.stats.assists }}</span>
            </div>
            <div
              class="kda-ratio"
              :class="{
                'perfect-kda':
                  self.participant.stats.deaths === 0 &&
                  self.participant.stats.assists !== 0 &&
                  self.participant.stats.kills !== 0
              }"
            >
              {{
                (
                  (self.participant.stats.kills + self.participant.stats.assists) /
                  (self.participant.stats.deaths || 1)
                ).toFixed(2)
              }}
              KDA
            </div>
          </div>
        </div>
        <div class="items">
          <ItemDisplay :size="24" :item-id="self.participant.stats.item0" />
          <ItemDisplay :size="24" :item-id="self.participant.stats.item1" />
          <ItemDisplay :size="24" :item-id="self.participant.stats.item2" />
          <ItemDisplay :size="24" :item-id="self.participant.stats.item3" />
          <ItemDisplay :size="24" :item-id="self.participant.stats.item4" />
          <ItemDisplay :size="24" :item-id="self.participant.stats.item5" />
          <ItemDisplay :size="24" is-trinket :item-id="self.participant.stats.item6" />
        </div>
      </div>
      <div class="summary" v-if="self.summary">
        <div class="kpr" title="在队伍中参与了击杀的程度">
          击杀参与率 {{ (self.summary.kpr * 100).toFixed(1) }} %
        </div>
        <div class="ddr" title="在队伍中对英雄造成的伤害占比">
          伤害比率 {{ (self.summary.ddr * 100).toFixed(1) }} %
        </div>
        <div class="dtr" title="在队伍中的承受所有伤害占比">
          承伤比率 {{ (self.summary.dtr * 100).toFixed(1) }} %
        </div>
        <div class="gr" title="在队伍中的金币占比">
          经济比率 {{ (self.summary.gr * 100).toFixed(1) }} %
        </div>
      </div>
      <div class="players">
        <template v-if="game.gameMode === 'CHERRY'">
          <div class="players-cherry" v-if="isDetailed">
            <template v-if="teams.subTeam0?.length">
              <SubTeam :mode="game.gameMode" :participants="teams.subTeam0.slice(0, 4)" />
              <SubTeam :mode="game.gameMode" :participants="teams.subTeam0.slice(4)" />
            </template>
            <template v-else>
              <div>
                <SubTeam :mode="game.gameMode" :participants="teams.subTeam1" />
                <SubTeam
                  :mode="game.gameMode"
                  :participants="teams.subTeam2"
                  style="margin-top: 8px"
                />
              </div>
              <div>
                <SubTeam :mode="game.gameMode" :participants="teams.subTeam3" />
                <SubTeam
                  :mode="game.gameMode"
                  :participants="teams.subTeam4"
                  style="margin-top: 8px"
                />
              </div>
            </template>
          </div>
        </template>
        <template v-else>
          <div class="players-normal" v-if="isDetailed">
            <SubTeam :mode="game.gameMode" :participants="teams.team1" />
            <SubTeam :mode="game.gameMode" :participants="teams.team2" />
          </div>
        </template>
      </div>
      <div class="show-more" @click="() => handleToggleShowDetailedGame()">
        <NIcon class="icon" @click.stop="() => handleShowMiscellaneous()" title="杂项"
          ><ListIcon
        /></NIcon>
        <NIcon class="icon" :title="isExpanded ? '收起' : '展开'">
          <ChevronUpIcon v-if="isExpanded" /><ChevronDownIcon v-else />
        </NIcon>
      </div>
    </div>
    <div v-if="!self" class="standalone-misc-btn">
      <NIcon
        class="icon standalone-misc-btn-icon"
        @click.stop="() => handleShowMiscellaneous()"
        title="杂项"
        ><ListIcon
      /></NIcon>
    </div>
    <template v-if="isExpanded">
      <template v-if="isDetailed">
        <CherryModeDetailedGame
          class="detailed-game"
          :game="game"
          :self-id="selfId"
          v-if="game.gameMode === 'CHERRY'"
        />
        <NormalNodeDetailedGame class="detailed-game" v-else :game="game" :self-id="selfId" />
      </template>
      <div v-else-if="isLoading" class="loading">加载中...</div>
      <div v-else class="loading">无法加载</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  List as ListIcon
} from '@vicons/ionicons5'
import { createReusableTemplate, useTimeoutPoll } from '@vueuse/core'
import dayjs from 'dayjs'
import { NIcon, NModal } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import LcuImage from '@renderer/components/LcuImage.vue'
import { championIcon } from '@renderer/features/game-data'
import { useGameDataStore } from '@renderer/features/stores/lcu/game-data'
import { Game, ParticipantIdentity } from '@renderer/types/match-history'

import '../lol-view.less'
import ItemDisplay from '../widgets/ItemDisplay.vue'
import PerkDisplay from '../widgets/PerkDisplay.vue'
import PerkstyleDisplay from '../widgets/PerkstyleDisplay.vue'
import SummonerSpellDisplay from '../widgets/SummonerSpellDisplay.vue'
import CherryModeDetailedGame from './CherryModeDetailedGame.vue'
import MiscellaneousPanel from './MiscellaneousPanel.vue'
import NormalNodeDetailedGame from './NormalModeDetailedGame.vue'

const props = defineProps<{
  selfId?: number
  isLoading: boolean
  isExpanded: boolean
  isDetailed: boolean
  game: Game
}>()

const [DefineSubTeam, SubTeam] = createReusableTemplate<{
  participants: (typeof teams.value)[keyof typeof teams.value]
  mode: string
}>({ inheritAttrs: true })

// 定期更新相对时间
const formattedGameCreationRelativeTime = ref('')
useTimeoutPoll(
  () => {
    formattedGameCreationRelativeTime.value = dayjs(props.game.gameCreation)
      .locale('zh-cn')
      .fromNow()
  },
  60000,
  { immediate: true }
)

const self = computed(() => {
  if (!props.selfId) {
    return null
  }

  // 查找对应的参与者 ID 和参与者信息
  const participantId = props.game.participantIdentities.find(
    (p) => p.player.summonerId === props.selfId
  )!.participantId

  const participant = props.game.participants.find((p) => participantId === p.participantId)!

  let summary: { kpr: number; ddr: number; dtr: number; gr: number } | null = null
  if (props.isDetailed) {
    const teamTotalStats = props.game.participants
      .filter((p) => {
        if (props.game.gameMode === 'CHERRY') {
          return participant.stats.playerSubteamId === p.stats.playerSubteamId
        } else {
          return participant.teamId === p.teamId
        }
      })
      .reduce(
        (acc, p) => {
          acc.kills += p.stats.kills
          acc.totalDamageDealtToChampions += p.stats.totalDamageDealtToChampions
          acc.totalDamageTaken += p.stats.totalDamageTaken
          acc.goldEarned += p.stats.goldEarned
          return acc
        },
        { kills: 0, totalDamageDealtToChampions: 0, totalDamageTaken: 0, goldEarned: 0 }
      )

    const kpr = (participant.stats.kills + participant.stats.assists) / (teamTotalStats.kills || 1)
    const ddr =
      participant.stats.totalDamageDealtToChampions /
      (teamTotalStats.totalDamageDealtToChampions || 1)
    const dtr = participant.stats.totalDamageTaken / (teamTotalStats.totalDamageTaken || 1)
    const gr = participant.stats.goldEarned / (teamTotalStats.goldEarned || 1)

    summary = { kpr, ddr, dtr, gr }
  }

  return {
    participant,
    summary
  }
})

const chineseNumber = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
const formattedResultText = computed(() => {
  if (!self.value) {
    return null
  }

  if (props.game.gameMode === 'CHERRY') {
    const ranking = self.value.participant.stats.subteamPlacement
    if (ranking < 1) {
      return `第 ? 名 (数据错误)`
    }
    return `第${chineseNumber[self.value.participant.stats.subteamPlacement - 1]}名`
  }

  if (props.game.gameMode === 'PRACTICETOOL') {
    return '-'
  }

  // 重开局
  if (self.value.participant.stats.gameEndedInEarlySurrender) {
    return `重开 (${self.value.participant.stats.win ? '胜利' : '失败'})`
  }

  if (self.value.participant.stats.win) {
    return '胜利'
  } else {
    return self.value.participant.stats.gameEndedInSurrender ? '投降' : '失败'
  }
})

const composedResultClass = computed(() => {
  if (!self.value) {
    return null
  }

  if (
    props.game.gameMode === 'PRACTICETOOL' ||
    self.value.participant.stats.gameEndedInEarlySurrender
  ) {
    return { remake: true }
  }

  if (self.value.participant.stats.win) {
    return { win: true }
  } else {
    return { lose: true }
  }
})

const formattedModeText = computed(() => {
  return props.game.gameMode === 'PRACTICETOOL'
    ? '训练模式'
    : gameData.queues[props.game.queueId].name ?? props.game.queueId
})

const isModalShow = ref(false)

const teams = computed(() => {
  const identities: Record<string, ParticipantIdentity> = {}
  props.game.participantIdentities.forEach((identity) => {
    identities[identity.participantId] = identity
  })

  const all = props.game.participants.map((participant) => {
    return {
      ...participant,
      isSelf: identities[participant.participantId].player.summonerId === props.selfId,
      identity: identities[participant.participantId]
    }
  })

  if (props.game.gameMode === 'CHERRY') {
    return {
      subTeam0: all.filter((p) => p.stats.playerSubteamId == 0),
      subTeam1: all.filter((p) => p.stats.playerSubteamId == 1),
      subTeam2: all.filter((p) => p.stats.playerSubteamId == 2),
      subTeam3: all.filter((p) => p.stats.playerSubteamId == 3),
      subTeam4: all.filter((p) => p.stats.playerSubteamId == 4)
    }
  } else {
    return {
      team1: all.filter((p) => p.teamId === 100),
      team2: all.filter((p) => p.teamId === 200)
    }
  }
})

const handleShowMiscellaneous = () => {
  emits('loadDetailedGame', props.game.gameId)
  isModalShow.value = true
}

const gameData = useGameDataStore()

const handleToggleShowDetailedGame = () => {
  if (!props.isDetailed) {
    emits('loadDetailedGame', props.game.gameId)
  }
  emits('setShowDetailedGame', props.game.gameId, !props.isExpanded)
}

const emits = defineEmits<{
  (e: 'setShowDetailedGame', gameId: number, expand: boolean)
  (e: 'loadDetailedGame', gameId: number)
}>()

const router = useRouter()
const handleToSummoner = (summonerId: number) => {
  if (summonerId === 0) {
    return
  }
  router.replace(`/match-history/${summonerId}`)
}
</script>

<style lang="less" scoped>
.match-history-card {
  display: flex;
  padding: 0px 0px 0px 8px;
  border-radius: 4px;
  box-sizing: border-box;
  background-color: rgb(52, 52, 52);
  height: 96px;
  overflow: hidden;
}

.standalone-misc-btn {
  margin-left: auto;
  padding: 4px;
  border-radius: 4px;
  width: 32px;
  background-color: rgb(52, 52, 52);

  .standalone-misc-btn-icon {
    display: block;
    margin: auto;
    cursor: pointer;
  }
}

.game {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 120px;
  box-sizing: border-box;
  font-size: 12px;
  color: rgb(159, 159, 159);

  .mode {
    font-weight: bold;
  }

  .result {
    font-weight: bold;
  }

  .divider {
    margin: 2px 0;
    height: 1px;
    width: 60%;
    background-color: rgb(91, 91, 91);
  }
}

.info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  width: 208px;

  .stats {
    display: flex;
    gap: 4px;
  }

  .champion {
    position: relative;
    height: 50px;
    width: 50px;
  }

  .champion-icon {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }

  .champion-level {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    line-height: 20px;
    text-align: center;
    font-size: 12px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.621);
  }

  .summoner-spells,
  .perks {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 50px;
    width: 24px;
    gap: 2px;
  }

  .perk {
    border-radius: 4px;
    aspect-ratio: 1;
  }

  .kda-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100px;
  }

  .kda {
    display: flex;

    .k,
    .d,
    .a {
      font-weight: bold;
      font-size: 14px;
    }

    .divider {
      color: rgb(159, 159, 159);
      font-size: 14px;
      margin: 0 4px;
    }

    .k {
      color: rgb(68, 160, 246);
    }

    .d {
      color: rgb(200, 81, 30);
    }

    .a {
      color: rgb(159, 159, 159);
    }
  }

  .kda-ratio {
    font-size: 12px;
    color: rgb(159, 159, 159);
  }

  .kda-radio.perfect-kda {
    color: rgb(92, 169, 241);
  }

  .items {
    display: flex;
    gap: 4px;
    width: min-content;
  }
}

.summary {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 126px;
  font-size: 12px;

  .kpr {
    color: rgb(223, 223, 223);
  }

  .ddr {
    color: rgb(236, 152, 92);
  }

  .dtr {
    color: rgb(98, 201, 94);
  }

  .gr {
    color: rgb(227, 180, 119);
  }
}

.players {
  flex: 1;

  .players-normal {
    display: flex;
    height: 100%;
    align-items: center;
    gap: 16px;
  }

  .players-cherry {
    display: flex;
    height: 100%;
    align-items: center;
    gap: 16px;
  }
}

.sub-team {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  width: 128px;
  position: relative;

  .placement {
    position: absolute;
    bottom: -4px;
    left: -4px;
    font-size: 10px;
    background-color: rgba(0, 0, 0, 0.35);
    border-radius: 50%;
    width: 14px;
    height: 14px;
    line-height: 14px;
    text-align: center;
  }

  .player {
    display: flex;
    line-height: 18px;

    .image {
      height: 16px;
      width: 16px;
      border-radius: 4px;
      margin-right: 4px;
    }

    .name {
      flex: 1;
      width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
      color: rgb(225, 225, 225);
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        color: rgb(167, 167, 255);
      }
    }

    .name.self {
      cursor: default;
      font-weight: 700;
      color: white;
    }
  }
}

.show-more {
  display: flex;
  flex-direction: column;
  gap: 2px;
  justify-content: center;
  align-items: center;
  width: 40px;
  cursor: pointer;
}

.icon {
  padding: 2px;
  font-size: 16px;
  color: rgb(214, 214, 214);
  font-weight: bold;
  transition: background-color 0.3s ease;
  background-color: transparent;
  border-radius: 2px;
}

.icon:hover {
  background-color: rgba(255, 255, 255, 0.17);
}

.win {
  border-left: 6px solid rgb(0, 105, 203);

  .game {
    .mode {
      color: rgb(92, 169, 241);
    }

    .result {
      color: rgb(92, 169, 241);
    }

    .result.first-place {
      color: rgb(86, 218, 214);
    }
  }

  .show-more {
    background-color: rgb(0, 105, 203);
  }
}

.lose {
  border-left: 6px solid rgb(203, 61, 0);

  .game {
    .mode {
      color: rgb(233, 96, 37);
    }

    .result {
      color: rgb(233, 96, 37);
    }
  }

  .show-more {
    background-color: rgb(202, 73, 17);
  }
}

.remake {
  border-left: 6px solid rgb(139, 139, 139);

  .game {
    .mode {
      color: rgb(209, 209, 209);
    }

    .result {
      color: rgb(209, 209, 209);
    }
  }

  .show-more {
    background-color: rgb(150, 150, 150);
  }
}

.small-text {
  font-size: 12px;
}

.detailed-game {
  margin-top: 4px;
}

.loading {
  display: flex;
  height: 100px;
  justify-content: center;
  align-items: center;
  margin-top: 4px;
  background-color: #343434;
  border-radius: 4px;
  font-size: 12px;
}
</style>
