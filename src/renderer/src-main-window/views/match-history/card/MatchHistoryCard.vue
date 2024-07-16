<template>
  <div class="match-history-card-wrapper">
    <NModal size="small" v-model:show="isModalShow">
      <MiscellaneousPanel :game="game" />
    </NModal>
    <DefineSubTeam v-slot="{ participants, mode }">
      <div class="sub-team">
        <div class="player" v-for="p of participants" :key="p.participantId">
          <LcuImage
            class="image"
            :src="championIcon(p.championId)"
            :title="gameData.champions[p.championId]?.name"
          />
          <div
            :title="
              summonerName(
                p.identity.player.gameName || p.identity.player.summonerName,
                p.identity.player.tagLine
              )
            "
            class="name"
            :class="{ self: p.isSelf }"
            @click="() => handleToSummoner(p.identity.player.puuid)"
          >
            {{
              summonerName(
                p.identity.player.gameName || p.identity.player.summonerName,
                p.identity.player.tagLine
              )
            }}
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
              :title="gameData.champions[self.participant.championId]?.name"
            ></LcuImage>
            <div class="champion-level">{{ self.participant.stats.champLevel }}</div>
          </div>
          <template v-if="game.gameMode === 'CHERRY' || game.gameMode === 'STRAWBERRY'">
            <div class="summoner-spells">
              <AugmentDisplay :augment-id="self.participant.stats.playerAugment1" :size="24" />
              <AugmentDisplay :augment-id="self.participant.stats.playerAugment2" :size="24" />
            </div>
            <div class="summoner-spells">
              <AugmentDisplay :augment-id="self.participant.stats.playerAugment3" :size="24" />
              <AugmentDisplay :augment-id="self.participant.stats.playerAugment4" :size="24" />
            </div>
            <div class="summoner-spells" v-if="game.gameMode === 'STRAWBERRY'">
              <AugmentDisplay :augment-id="self.participant.stats.playerAugment5" :size="24" />
              <AugmentDisplay :augment-id="self.participant.stats.playerAugment6" :size="24" />
            </div>
          </template>
          <template v-else>
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
          </template>

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
      <div class="summary" v-if="self.summary && game.gameMode !== 'STRAWBERRY'">
        <div
          class="tag kpr"
          :title="`在队伍中参与了击杀的程度 ${(self.summary.kpr * 100).toFixed(3)} %`"
        >
          {{ (self.summary.kpr * 100).toFixed() }} % 击杀
        </div>
        <div
          class="tag ddr"
          :title="`在队伍中对英雄造成的伤害占比 ${(self.summary.ddr * 100).toFixed(3)} %`"
        >
          {{ (self.summary.ddr * 100).toFixed() }} % 伤害
        </div>
        <div
          class="tag dtr"
          :title="`在队伍中的承受所有伤害占比 ${(self.summary.dtr * 100).toFixed(3)} %`"
        >
          {{ (self.summary.dtr * 100).toFixed() }} % 承受
        </div>
        <div class="tag gr" :title="`在队伍中的金币占比 ${(self.summary.gr * 100).toFixed(3)} %`">
          {{ (self.summary.gr * 100).toFixed() }} % 金币
        </div>
      </div>
      <div class="players">
        <template v-if="game.gameMode === 'CHERRY'">
          <div class="players-cherry" v-if="isDetailed">
            <template v-if="teams.placement0?.length">
              <SubTeam :mode="game.gameMode" :participants="teams.placement0.slice(0, 4)" />
              <SubTeam :mode="game.gameMode" :participants="teams.placement0.slice(4)" />
            </template>
            <template v-else>
              <div>
                <SubTeam :mode="game.gameMode" :participants="teams.placement1" />
                <SubTeam
                  :mode="game.gameMode"
                  :participants="teams.placement2"
                  style="margin-top: 8px"
                />
              </div>
              <div>
                <SubTeam :mode="game.gameMode" :participants="teams.placement3" />
                <SubTeam
                  :mode="game.gameMode"
                  :participants="teams.placement4"
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
          :self-puuid="selfPuuid"
          v-if="game.gameMode === 'CHERRY'"
        />
        <StrawberryModeDetailedGame
          class="detailed-game"
          :game="game"
          :self-puuid="selfPuuid"
          v-else-if="game.gameMode === 'STRAWBERRY'"
        />
        <NormalNodeDetailedGame class="detailed-game" v-else :game="game" :self-puuid="selfPuuid" />
      </template>
      <div v-else-if="isLoading" class="loading">加载中...</div>
      <div v-else class="loading">无法加载</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { EMPTY_PUUID } from '@shared/constants/common'
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import AugmentDisplay from '@shared/renderer/components/widgets/AugmentDisplay.vue'
import ItemDisplay from '@shared/renderer/components/widgets/ItemDisplay.vue'
import PerkDisplay from '@shared/renderer/components/widgets/PerkDisplay.vue'
import PerkstyleDisplay from '@shared/renderer/components/widgets/PerkstyleDisplay.vue'
import SummonerSpellDisplay from '@shared/renderer/components/widgets/SummonerSpellDisplay.vue'
import { championIcon } from '@shared/renderer/modules/game-data'
import { useGameDataStore } from '@shared/renderer/modules/lcu-state-sync/game-data'
import { Game, ParticipantIdentity } from '@shared/types/lcu/match-history'
import { summonerName } from '@shared/utils/name'
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

import '../lol-view.less'
import CherryModeDetailedGame from './CherryModeDetailedGame.vue'
import MiscellaneousPanel from './MiscellaneousPanel.vue'
import NormalNodeDetailedGame from './NormalModeDetailedGame.vue'
import StrawberryModeDetailedGame from './StrawberryModeDetailedGame.vue'

const props = defineProps<{
  selfPuuid?: string
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
  if (!props.selfPuuid) {
    return null
  }

  const participantId = props.game.participantIdentities.find(
    (p) => p.player.puuid === props.selfPuuid
  )?.participantId

  if (!participantId) {
    return null
  }

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
    : gameData.queues[props.game.queueId]?.name ?? props.game.queueId
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
      isSelf: identities[participant.participantId].player.puuid === props.selfPuuid,
      identity: identities[participant.participantId]
    }
  })

  if (props.game.gameMode === 'CHERRY') {
    return {
      placement0: all.filter((p) => p.stats.playerSubteamId == 0),
      placement1: all.filter((p) => p.stats.subteamPlacement == 1),
      placement2: all.filter((p) => p.stats.subteamPlacement == 2),
      placement3: all.filter((p) => p.stats.subteamPlacement == 3),
      placement4: all.filter((p) => p.stats.subteamPlacement == 4)
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
const handleToSummoner = (puuid: string) => {
  if (!puuid || puuid === EMPTY_PUUID) {
    return
  }

  router.replace(`/match-history/${puuid}`)
}
</script>

<style lang="less" scoped>
.match-history-card {
  display: flex;
  padding: 0px 0px 0px 8px;
  border-radius: 4px;
  box-sizing: border-box;
  background-color: rgb(45, 45, 45);
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
  width: 240px;

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
  padding: 10px 0;
  width: 126px;
  font-size: 10px;
  line-height: 14px;
  align-items: flex-start;
  gap: 2px;

  .kpr {
    border-color: rgba(211, 211, 211, 0.4);
    background-color: rgba(211, 211, 211, 0.1);
    color: rgb(228, 228, 228);
  }

  .ddr {
    border-color: rgba(209, 134, 81, 0.4);
    background-color: rgba(209, 134, 81, 0.1);
    color: rgb(235, 161, 108);
  }

  .dtr {
    border-color: rgba(88, 184, 84, 0.4);
    background-color: rgba(88, 184, 84, 0.1);
    color: rgb(119, 224, 115);
  }

  .gr {
    border-color: rgba(206, 164, 109, 0.4);
    background-color: rgba(206, 164, 109, 0.1);
    color: rgb(226, 185, 133);
  }

  .tag {
    padding: 0px 8px;
    border-radius: 6px;
    box-sizing: border-box;
    border-width: 1px;
    border-style: solid;
    width: 80px;
    text-align: center;
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
        color: #63e2b7;
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
  border-left: 6px solid rgb(158, 48, 1);

  .game {
    .mode {
      color: rgb(233, 96, 37);
    }

    .result {
      color: rgb(233, 96, 37);
    }
  }

  .show-more {
    background-color: rgb(158, 48, 1);
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
