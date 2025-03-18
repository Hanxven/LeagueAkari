<template>
  <div class="match-history-card-wrapper">
    <NModal size="small" v-model:show="isModalShow">
      <MiscellaneousPanel :game="game" />
    </NModal>
    <DefineSubTeam v-slot="{ participants, mode }">
      <div class="sub-team" :class="{ 'only-one-team': isOnlyOneTeam }" v-if="participants?.length">
        <div class="player" v-for="p of participants" :key="p.participantId">
          <LcuImage
            class="image"
            :src="championIconUri(p.championId)"
            :title="lcs.gameData.champions[p.championId]?.name"
          />
          <div
            :title="
              masked(
                summonerName(
                  p.identity.player.gameName || p.identity.player.summonerName,
                  p.identity.player.tagLine
                ),
                name(p.championId)
              )
            "
            class="name"
            :class="{ self: p.isSelf }"
            @click="() => emits('toSummoner', p.identity.player.puuid)"
            @mouseup.prevent="(event) => handleMouseUp(event, p.identity.player.puuid)"
            @mousedown="handleMouseDown"
          >
            {{
              masked(
                summonerName(
                  p.identity.player.gameName || p.identity.player.summonerName,
                  p.identity.player.tagLine
                ),
                name(p.championId)
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
        <div class="mode" :title="formattedModeText">
          {{ formattedModeText }}
        </div>
        <div
          class="begin-time"
          :title="
            dayjs(game.gameCreation)
              .locale(as.settings.locale.toLowerCase())
              .format('YYYY-MM-DD HH:mm:ss')
          "
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
              .locale(as.settings.locale.toLowerCase())
              .format(as.settings.locale.startsWith('zh') ? 'm 分 s 秒' : 'm [m] s [s]')
          }}
        </div>
      </div>
      <div class="info">
        <div class="stats">
          <div class="champion">
            <ChampionIcon
              class="champion-icon"
              :champion-id="self.participant.championId"
              :title="lcs.gameData.champions[self.participant.championId]?.name"
            ></ChampionIcon>
            <div class="champion-level">{{ self.participant.stats.champLevel }}</div>
          </div>
          <template v-if="game.gameMode === 'CHERRY' || game.gameMode === 'STRAWBERRY'">
            <div class="summoner-spells">
              <AugmentDisplay :augment-id="self.participant.stats.playerAugment1" :size="22" />
              <AugmentDisplay :augment-id="self.participant.stats.playerAugment2" :size="22" />
            </div>
            <div class="summoner-spells">
              <AugmentDisplay :augment-id="self.participant.stats.playerAugment3" :size="22" />
              <AugmentDisplay :augment-id="self.participant.stats.playerAugment4" :size="22" />
            </div>
            <div class="summoner-spells" v-if="game.gameMode === 'STRAWBERRY'">
              <AugmentDisplay :augment-id="self.participant.stats.playerAugment5" :size="22" />
              <AugmentDisplay :augment-id="self.participant.stats.playerAugment6" :size="22" />
            </div>
          </template>
          <template v-else>
            <div class="summoner-spells">
              <SummonerSpellDisplay :spell-id="self.participant.spell1Id" :size="22" />
              <SummonerSpellDisplay :spell-id="self.participant.spell2Id" :size="22" />
            </div>
            <div
              class="perks"
              v-if="self.participant.stats.perkPrimaryStyle && self.participant.stats.perkSubStyle"
            >
              <PerkDisplay :perk-id="self.participant.stats.perk0" :size="22" />
              <!-- It should be 'perkstyle', but I still use class name 'perk' here. -->
              <PerkstyleDisplay :size="22" :perkstyle-id="self.participant.stats.perkSubStyle" />
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
              <template v-if="self.participant.stats.deaths === 0">{{
                t('MatchHistoryCard.perfect')
              }}</template>
              <template v-else>
                {{
                  (
                    (self.participant.stats.kills + self.participant.stats.assists) /
                    (self.participant.stats.deaths || 1)
                  ).toFixed(2)
                }}
              </template>
              KDA
            </div>
          </div>
        </div>
        <div class="items">
          <ItemDisplay :size="22" :item-id="self.participant.stats.item0" />
          <ItemDisplay :size="22" :item-id="self.participant.stats.item1" />
          <ItemDisplay :size="22" :item-id="self.participant.stats.item2" />
          <ItemDisplay :size="22" :item-id="self.participant.stats.item3" />
          <ItemDisplay :size="22" :item-id="self.participant.stats.item4" />
          <ItemDisplay :size="22" :item-id="self.participant.stats.item5" />
          <ItemDisplay :size="22" is-trinket :item-id="self.participant.stats.item6" />
        </div>
      </div>
      <div class="summary" v-if="self.summary && game.gameMode !== 'STRAWBERRY'">
        <div
          class="kpr"
          :title="t('MatchHistoryCard.kprTitle', { rate: (self.summary.kpr * 100).toFixed(3) })"
        >
          {{ t('MatchHistoryCard.kpr', { rate: (self.summary.kpr * 100).toFixed() }) }}
        </div>
        <div
          class="ddr"
          :title="t('MatchHistoryCard.ddrTitle', { rate: (self.summary.ddr * 100).toFixed(3) })"
        >
          {{ t('MatchHistoryCard.ddr', { rate: (self.summary.ddr * 100).toFixed() }) }}
        </div>
        <div
          class="dtr"
          :title="t('MatchHistoryCard.dtrTitle', { rate: (self.summary.dtr * 100).toFixed(3) })"
        >
          {{ t('MatchHistoryCard.dtr', { rate: (self.summary.dtr * 100).toFixed() }) }}
        </div>
        <div
          class="gr"
          :title="t('MatchHistoryCard.grTitle', { rate: (self.summary.gr * 100).toFixed(3) })"
        >
          {{ t('MatchHistoryCard.gr', { rate: (self.summary.gr * 100).toFixed() }) }}
        </div>
      </div>
      <div class="players">
        <template v-if="game.gameMode === 'CHERRY'">
          <div class="players-cherry" v-if="isDetailed">
            <template v-if="teams.placement0?.length">
              <SubTeam
                :index="0"
                :mode="game.gameMode"
                :participants="teams.placement0.slice(0, 4)"
              />
              <SubTeam :index="1" :mode="game.gameMode" :participants="teams.placement0.slice(4)" />
            </template>
            <template v-else>
              <div>
                <SubTeam :index="0" :mode="game.gameMode" :participants="teams.placement1" />
                <SubTeam
                  :index="1"
                  :mode="game.gameMode"
                  :participants="teams.placement2"
                  style="margin-top: 8px"
                />
              </div>
              <div>
                <SubTeam :index="2" :mode="game.gameMode" :participants="teams.placement3" />
                <SubTeam
                  :index="3"
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
            <SubTeam :index="0" :mode="game.gameMode" :participants="teams.team1" />
            <SubTeam :index="1" :mode="game.gameMode" :participants="teams.team2" />
          </div>
        </template>
      </div>
      <div class="show-more" @click="() => handleToggleShowDetailedGame()">
        <NIcon
          class="icon"
          @click.stop="() => handleShowMiscellaneous()"
          :title="t('MatchHistoryCard.misc')"
          ><ListIcon
        /></NIcon>
        <NIcon
          class="icon"
          :class="{ rotated: isExpanded }"
          :title="isExpanded ? t('MatchHistoryCard.collapse') : t('MatchHistoryCard.expand')"
        >
          <ChevronDownIcon />
        </NIcon>
      </div>
    </div>
    <div v-if="!self" class="standalone-misc-btn">
      <NIcon
        class="icon standalone-misc-btn-icon"
        @click.stop="() => handleShowMiscellaneous()"
        :title="t('MatchHistoryCard.misc')"
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
          @to-summoner="(puuid, setCurrent) => emits('toSummoner', puuid, setCurrent)"
        />
        <StrawberryModeDetailedGame
          class="detailed-game"
          :game="game"
          :self-puuid="selfPuuid"
          v-else-if="game.gameMode === 'STRAWBERRY'"
          @to-summoner="(puuid, setCurrent) => emits('toSummoner', puuid, setCurrent)"
        />
        <NormalModeDetailedGame
          class="detailed-game"
          v-else
          :game="game"
          :self-puuid="selfPuuid"
          @to-summoner="(puuid, setCurrent) => emits('toSummoner', puuid, setCurrent)"
        />
      </template>
      <div v-else-if="isLoading" class="loading">{{ t('MatchHistoryCard.loading') }}</div>
      <div v-else class="loading">{{ t('MatchHistoryCard.error') }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import ItemDisplay from '@renderer-shared/components/widgets/ItemDisplay.vue'
import PerkDisplay from '@renderer-shared/components/widgets/PerkDisplay.vue'
import PerkstyleDisplay from '@renderer-shared/components/widgets/PerkstyleDisplay.vue'
import SummonerSpellDisplay from '@renderer-shared/components/widgets/SummonerSpellDisplay.vue'
import { useChampionInfo } from '@renderer-shared/compositions/useChampionInfo'
import { useStreamerModeMaskedText } from '@renderer-shared/compositions/useStreamerModeMaskedText'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { formatI18nOrdinal } from '@shared/i18n'
import { Game, ParticipantIdentity } from '@shared/types/league-client/match-history'
import { summonerName } from '@shared/utils/name'
import { ChevronDown as ChevronDownIcon, List as ListIcon } from '@vicons/ionicons5'
import { createReusableTemplate, useTimeoutPoll } from '@vueuse/core'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NIcon, NModal } from 'naive-ui'
import { computed, ref, watch } from 'vue'

import CherryModeDetailedGame from './CherryModeDetailedGame.vue'
import MiscellaneousPanel from './MiscellaneousPanel.vue'
import NormalModeDetailedGame from './NormalModeDetailedGame.vue'
import StrawberryModeDetailedGame from './StrawberryModeDetailedGame.vue'

const props = defineProps<{
  selfPuuid?: string
  isLoading: boolean
  isExpanded: boolean
  isDetailed: boolean
  game: Game
}>()

const { t } = useTranslation()

const emits = defineEmits<{
  setShowDetailedGame: [gameId: number, expand: boolean]
  loadDetailedGame: [gameId: number]
  toSummoner: [puuid: string, setCurrent?: boolean]
}>()

const [DefineSubTeam, SubTeam] = createReusableTemplate<{
  participants: (typeof teams.value)[keyof typeof teams.value]
  mode: string
  index: number
}>({ inheritAttrs: true })

const as = useAppCommonStore()

const { masked } = useStreamerModeMaskedText()

// 定期更新相对时间
const formattedGameCreationRelativeTime = ref('')
useTimeoutPoll(
  () => {
    formattedGameCreationRelativeTime.value = dayjs(props.game.gameCreation)
      .locale(as.settings.locale.toLowerCase())
      .fromNow()
  },
  60000,
  { immediate: true, immediateCallback: true }
)

watch(
  () => as.settings.locale,
  (locale) => {
    formattedGameCreationRelativeTime.value = dayjs(props.game.gameCreation)
      .locale(locale.toLowerCase())
      .fromNow()
  }
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

const formattedResultText = computed(() => {
  if (!self.value) {
    return null
  }

  if (props.game.gameMode === 'CHERRY') {
    return formatI18nOrdinal(self.value.participant.stats.subteamPlacement, as.settings.locale)
  }

  if (props.game.gameMode === 'PRACTICETOOL') {
    return '-'
  }

  if (props.game.endOfGameResult === 'Abort_AntiCheatExit') {
    return t('MatchHistoryCard.abort')
  }

  // 重开局
  if (self.value.participant.stats.gameEndedInEarlySurrender) {
    return `${t('MatchHistoryCard.remake')} (${self.value.participant.stats.win ? t('MatchHistoryCard.win') : t('MatchHistoryCard.lose')})`
  }

  if (self.value.participant.stats.win) {
    return t('MatchHistoryCard.win')
  } else {
    return self.value.participant.stats.gameEndedInSurrender
      ? t('MatchHistoryCard.surrender')
      : t('MatchHistoryCard.lose')
  }
})

const composedResultClass = computed(() => {
  if (!self.value) {
    return null
  }

  if (
    props.game.gameMode === 'PRACTICETOOL' ||
    props.game.endOfGameResult === 'Abort_AntiCheatExit' ||
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
    ? t('MatchHistoryCard.practiceTool')
    : (lcs.gameData.queues[props.game.queueId]?.name ?? props.game.queueId)
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

const isOnlyOneTeam = computed(() => {
  const tt = Object.values(teams.value)
  let teamThatHasPlayers = 0
  for (const t of tt) {
    if (t.length) {
      teamThatHasPlayers++
    }
  }

  return teamThatHasPlayers === 1
})

const handleShowMiscellaneous = () => {
  emits('loadDetailedGame', props.game.gameId)
  isModalShow.value = true
}

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

const lcs = useLeagueClientStore()

const handleToggleShowDetailedGame = () => {
  if (!props.isDetailed) {
    emits('loadDetailedGame', props.game.gameId)
  }
  emits('setShowDetailedGame', props.game.gameId, !props.isExpanded)
}

const { name } = useChampionInfo()
</script>

<style lang="less" scoped>
.match-history-card {
  display: flex;
  padding: 0px 0px 0px 12px;
  border-radius: 4px;
  box-sizing: border-box;
  background-color: #28344e;
  width: 740px;
  height: 96px;
  overflow: hidden;
}

.standalone-misc-btn {
  margin-left: auto;
  padding: 4px;
  border-radius: 2px;
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
  width: 112px;
  flex-shrink: 0;
  box-sizing: border-box;
  font-size: 12px;
  color: rgb(159, 159, 159);
  gap: 2px;

  .mode {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
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
  width: 212px;

  .stats {
    display: flex;
    gap: 4px;
  }

  .champion {
    flex-shrink: 0;
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
    height: 46px;
    width: 22px;
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
    gap: 2px;
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
  font-size: 11px;
  line-height: 14px;
  align-items: flex-start;
  gap: 2px;
  color: #9f9f9f;

  .kpr {
    color: #e84057;
    font-size: 12px;
  }
}

.players {
  flex: 1;

  .players-normal,
  .players-cherry {
    display: flex;
    height: 100%;
    align-items: center;
    gap: 16px;
    margin-right: 12px;
  }
}

.sub-team {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  width: 100px;
  position: relative;
  height: 100%;
  justify-content: center;

  &.only-one-team {
    width: 200px;
  }

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
      color: rgb(187, 187, 187);
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        color: #63e2b7;
      }
    }

    .name.self {
      cursor: default;
      font-weight: bold;
      color: white;
    }
  }
}

.show-more {
  display: flex;
  flex-shrink: 0;
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

  &.rotated {
    transform: rotate(180deg);
  }
}

.icon:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.win {
  border-left: 6px solid rgb(0, 105, 203);
  background-color: rgba(30, 39, 58, 0.9);

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
    background-color: #2f436e;
  }
}

.lose {
  border-left: 6px solid rgb(158, 48, 1);
  background-color: rgba(65, 39, 43, 0.9);

  .game {
    .mode {
      color: rgb(233, 96, 37);
    }

    .result {
      color: rgb(233, 96, 37);
    }
  }

  .show-more {
    background-color: rgb(112, 60, 71);
  }
}

.remake {
  border-left: 6px solid rgb(139, 139, 139);
  background-color: rgba(54, 54, 54, 0.8);

  .game {
    .mode {
      color: rgb(209, 209, 209);
    }

    .result {
      color: rgb(209, 209, 209);
    }
  }

  .show-more {
    background-color: rgb(121, 121, 121);
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
