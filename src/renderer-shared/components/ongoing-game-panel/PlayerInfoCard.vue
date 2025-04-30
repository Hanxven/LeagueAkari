<template>
  <div
    class="player-card"
    :class="{
      dimming:
        currentHighlightingPremadeTeamId && currentHighlightingPremadeTeamId !== premadeTeamId,
      highlighting:
        currentHighlightingPremadeTeamId && currentHighlightingPremadeTeamId === premadeTeamId
    }"
    :style="{
      borderColor: premadeTeamId ? PREMADE_TEAM_COLORS[premadeTeamId]?.borderColor : '#ffffff60'
    }"
  >
    <div
      class="premade-deco"
      :style="{
        backgroundColor: premadeTeamId
          ? PREMADE_TEAM_COLORS[premadeTeamId]?.foregroundColor
          : undefined
      }"
    ></div>
    <div class="player-info">
      <div class="profile-icon">
        <ChampionIcon
          :champion-id="championId || -1"
          round
          ring
          ring-color="#ffffff50"
          class="champion"
        />
        <div class="level" v-if="summoner">{{ summoner.summonerLevel }}</div>
      </div>
      <div class="name-group">
        <div class="name-tag" @click="() => emits('toSummoner', puuid)" ref="premade-title-el">
          <NPopover
            :keep-alive-on-hover="false"
            :delay="50"
            :disabled="premadeTeamId === undefined"
          >
            <template #trigger>
              <!-- 内部容器用于平衡 popover 的位置 -->
              <div class="name-tag-inner">
                <span
                  class="name"
                  :style="{
                    color: premadeTeamId
                      ? PREMADE_TEAM_COLORS[premadeTeamId]?.foregroundColor
                      : undefined
                  }"
                  >{{
                    masked(
                      summoner?.gameName || summoner?.displayName || '—',
                      name(championId || -1)
                    )
                  }}</span
                >
                <span class="tag-line" v-if="!as.settings.streamerMode"
                  >#{{ summoner?.tagLine || '—' }}</span
                >
              </div>
            </template>
            <div class="popover-text">
              {{ t('PlayerInfoCard.premadePopover', { team: premadeTeamId }) }}
            </div>
          </NPopover>
        </div>
        <NPopover :keep-alive-on-hover="false" :delay="50">
          <template #trigger>
            <div class="ranked">
              <template v-if="queueType === 'CHERRY' && rankedSoloFlex.cherry">
                <div
                  class="ranked-item cherry"
                  v-if="rankedSoloFlex.cherry && rankedSoloFlex.cherry.ratedRating"
                >
                  <span class="text"
                    >{{ t('common.queueTypes.CHERRY') }}
                    <span style="font-weight: bold">{{ rankedSoloFlex.cherry.ratedRating }}</span>
                    Pt</span
                  >
                </div>
                <div class="ranked-item unranked cherry" v-else>
                  <span class="text">{{ t('common.shortTiers.UNRANKED') }}</span>
                </div>
              </template>
              <template v-else>
                <div
                  class="ranked-item"
                  v-if="
                    rankedSoloFlex.solo && rankedSoloFlex.solo.tier && rankedSoloFlex.solo !== 'NA'
                  "
                >
                  <img class="image" :src="RANKED_MEDAL_MAP[rankedSoloFlex.solo.tier]" alt="rank" />
                  <span class="text">{{ rankedSoloFlex.solo.text }}</span>
                </div>
                <div class="ranked-item unranked" v-else>
                  <span class="text">{{ t('common.shortTiers.UNRANKED') }}</span>
                </div>
                <div
                  class="ranked-item"
                  v-if="
                    rankedSoloFlex.flex && rankedSoloFlex.flex.tier && rankedSoloFlex.flex !== 'NA'
                  "
                >
                  <img class="image" :src="RANKED_MEDAL_MAP[rankedSoloFlex.flex.tier]" alt="rank" />
                  <span class="text">{{ rankedSoloFlex.flex.text }}</span>
                </div>
                <div class="ranked-item unranked" v-else>
                  <span class="text">{{ t('common.shortTiers.UNRANKED') }}</span>
                </div>
              </template>
            </div>
          </template>
          <RankedTable v-if="rankedStats" :rankedStats="rankedStats" />
          <div v-else style="font-size: 12px">{{ t('PlayerInfoCard.empty') }}</div>
        </NPopover>
      </div>
    </div>
    <div class="stats">
      <template v-if="queueType === 'CHERRY'">
        <NPopover :keep-alive-on-hover="false" :disabled="!analysis" :delay="50">
          <template #trigger>
            <div
              class="win-rate-cherry"
              :class="{
                good: analysis.summary.winRate >= 0.53,
                normal: analysis.summary.winRate > 0.47 && analysis.summary.winRate < 0.53,
                bad: analysis.summary.winRate <= 0.47
              }"
              :title="`${t('PlayerInfoCard.top4Rate')} & ${t('PlayerInfoCard.1stRate')}`"
              v-if="analysis"
            >
              {{ (analysis.summary.winRate * 100).toFixed() }} %
              <span class="top1-rate"
                >/
                {{
                  t('PlayerInfoCard.1st', {
                    rate: (analysis.summary.cherry.top1Rate * 100).toFixed()
                  })
                }}</span
              >
              <span class="game-count">({{ analysis.summary.count }})</span>
            </div>
            <div v-else class="win-rate">— %</div>
          </template>
          <div class="popover-text" v-if="analysis">
            {{
              t('PlayerInfoCard.cherryWinRatePopover', {
                countV: analysis.summary.count,
                winRate: (analysis.summary.winRate * 100).toFixed(2),
                cherryCount: analysis.summary.cherry.count,
                top1Rate: (analysis.summary.cherry.top1Rate * 100).toFixed(2)
              })
            }}
          </div>
        </NPopover>
      </template>
      <template v-else>
        <NPopover :keep-alive-on-hover="false" :disabled="!analysis">
          <template #trigger>
            <div
              v-if="analysis"
              class="win-rate"
              :class="{
                good: analysis.summary.winRate >= 0.53,
                normal: analysis.summary.winRate > 0.47 && analysis.summary.winRate < 0.53,
                bad: analysis.summary.winRate <= 0.47
              }"
            >
              {{ (analysis.summary.winRate * 100).toFixed() }}%
              <span class="game-count">({{ analysis.summary.count }})</span>
            </div>
            <div class="win-rate" v-else>— %</div>
          </template>
          <div class="popover-text" v-if="analysis">
            {{
              t('PlayerInfoCard.winRatePopover', {
                countV: analysis.summary.count,
                winRate: (analysis.summary.winRate * 100).toFixed(),
                wins: analysis.summary.win,
                losses: analysis.summary.lose
              })
            }}
          </div>
        </NPopover>
      </template>
      <NPopover :keep-alive-on-hover="false" :disabled="!analysis" :delay="50">
        <template #trigger>
          <div
            class="kda"
            :class="{
              good: kdaIqr === 'over',
              normal: kdaIqr === null,
              bad: kdaIqr === 'below'
            }"
          >
            {{ analysis?.summary.averageKda.toFixed(2) || '—' }}
          </div>
        </template>
        <div class="popover-text" v-if="analysis">
          {{
            t('PlayerInfoCard.kdaPopover', {
              countV: analysis.summary.count,
              kda: analysis.summary.averageKda.toFixed(2),
              kills: (analysis.summary.totalKills / analysis.summary.count || 1).toFixed(2),
              deaths: (analysis.summary.totalDeaths / analysis.summary.count || 1).toFixed(2),
              assists: (analysis.summary.totalAssists / analysis.summary.count || 1).toFixed(2)
            })
          }}
          (KDA CV: {{ analysis.summary.kdaCv.toFixed(2) }})
        </div>
      </NPopover>
      <NPopover v-if="positionInfo">
        <template #trigger>
          <div
            class="position-info"
            :class="{
              autofill: positionInfo.role && positionInfo.role.assignmentReason === 'AUTOFILL'
            }"
          >
            <!-- AUTOFILL highlighter -->
            <div
              class="assignment-reason"
              v-if="positionInfo.role && positionInfo.role.assignmentReason === 'AUTOFILL'"
              :style="{
                'background-color': positionAssignmentReason.AUTOFILL_SHORT?.color,
                color: positionAssignmentReason.AUTOFILL_SHORT?.foregroundColor
              }"
            >
              {{ positionAssignmentReason.AUTOFILL_SHORT?.name }}
            </div>
            <!-- Left Current Position -->
            <template v-if="positionInfo.current && positionInfo.current !== 'NONE'">
              <PositionIcon :position="positionInfo.current" />
              <div
                class="divider"
                v-if="(positionInfo.recent && positionInfo.recent.length) || positionInfo.role"
              ></div>
            </template>
            <!-- Right Side Auxiliary Information -->
            <template v-if="positionInfo.recent && positionInfo.recent.length">
              <PositionIcon v-for="p of positionInfo.recent.slice(0, 3)" :position="p.position" />
            </template>
            <template v-else-if="positionInfo.role">
              <PositionIcon :position="positionInfo.role.primary" />
              <PositionIcon
                v-if="positionInfo.role.secondary !== 'UNSELECTED'"
                :position="positionInfo.role.secondary"
              />
            </template>
          </div>
        </template>
        <div class="position-info-popover">
          <div class="name-line">
            <PositionIcon
              v-if="positionInfo.current && positionInfo.current !== 'NONE'"
              class="position-icon"
              :position="positionInfo.current || 'ALL'"
            />
            <span class="position-name">{{
              t(`common.lanes.${positionInfo.current || 'ALL'}`)
            }}</span>
            <div
              class="assignment-reason"
              v-if="positionInfo.role && positionInfo.role.assignmentReason !== 'NONE'"
              :style="{
                'background-color':
                  positionAssignmentReason[positionInfo.role.assignmentReason]?.color || '#5b4694',
                color:
                  positionAssignmentReason[positionInfo.role.assignmentReason]?.foregroundColor ||
                  '#ffffff'
              }"
            >
              {{
                positionAssignmentReason[positionInfo.role.assignmentReason]?.name ||
                positionInfo.role.assignmentReason
              }}
            </div>
          </div>
          <div v-if="positionInfo.recent && positionInfo.recent.length" class="recent-play">
            <span class="label">{{ t('PlayerInfoCard.position.recentlyPlayed') }}</span>
            <PositionIcon
              class="position-icon"
              v-for="p of positionInfo.recent"
              :position="p.position"
            />
          </div>
          <div v-if="positionInfo.role" class="assignment">
            <span class="label">{{ t('PlayerInfoCard.position.selection') }}</span>
            <PositionIcon class="position-icon" :position="positionInfo.role.primary" />
            <PositionIcon
              class="position-icon"
              v-if="positionInfo.role.secondary !== 'UNSELECTED'"
              :position="positionInfo.role.secondary"
            />
          </div>
        </div>
      </NPopover>
    </div>
    <PlayerCardTagsArea
      :analysis="analysis"
      :puuid="puuid"
      :is-self="isSelf"
      :match-history="matchHistory"
      :premade-team-id="premadeTeamId"
      :current-highlighting-premade-team-id="currentHighlightingPremadeTeamId"
      :saved-info="savedInfo"
      :summoner="summoner"
      @show-game="(game, puuid) => emits('showGame', game, puuid)"
      @show-game-by-id="(gameId, puuid) => emits('showGameById', gameId, puuid)"
      @highlight="(premadeTeamId, hovering) => emits('highlight', premadeTeamId, hovering)"
    />
    <div class="frequent-used-champions" v-if="championUsage.length">
      <NPopover :keep-alive-on-hover="false" v-for="c of championUsage" :delay="50">
        <template #trigger>
          <div class="frequent-used-champion">
            <ChampionIcon
              :ring-color="
                c.analysis ? (c.analysis.winRate >= 0.5 ? '#2368ca' : '#c94f4f') : undefined
              "
              :champion-id="c.id"
              ring
              :ring-width="1"
              class="image"
            />
            <StarRoundIcon
              v-if="c.mastery && c.mastery.championLevel >= STARED_CHAMPION_LEVEL"
              class="star-icon"
            />
          </div>
        </template>
        <div class="champion-stats">
          <div class="champion-line">
            <ChampionIcon ring :ring-width="1" round class="champion-icon" :champion-id="c.id" />
            <div class="champion-name">{{ lcs.gameData.champions[c.id]?.name || c.id }}</div>
          </div>
          <div class="recent-plays" v-if="c.analysis">
            {{
              t('PlayerInfoCard.champion.winRate', {
                countV: c.analysis.count,
                winRate: (c.analysis.winRate * 100).toFixed()
              })
            }}
          </div>
          <template v-if="c.mastery">
            <div class="mastery-points">
              <span class="level">{{
                t('PlayerInfoCard.champion.level', {
                  level: c.mastery.championLevel
                })
              }}</span>
              <span class="points">{{
                t('PlayerInfoCard.champion.masteryPoints', {
                  points: c.mastery.championPoints.toLocaleString()
                })
              }}</span>
            </div>
            <div class="milestones">
              <span
                class="milestone"
                v-for="m of toSortedMilestoneGrades(c.mastery.milestoneGrades)"
                >{{ m }}</span
              >
            </div>
          </template>
        </div>
      </NPopover>
    </div>
    <div class="match-history">
      <NVirtualList
        key-field="gameId"
        style="height: 100%"
        :item-size="32"
        :items="matches"
        v-if="matches.length"
      >
        <template #default="{ item, index }">
          <div
            class="match-item"
            :class="getWinLoseClassName(item)"
            :key="item.game.gameId"
            @click="
              () =>
                item.isDetailed
                  ? emits('showGame', item.game, puuid)
                  : emits('showGameById', item.game.gameId, puuid)
            "
          >
            <div class="ordinal">#{{ index + 1 }}</div>
            <ChampionIcon :champion-id="item.selfParticipant.championId" class="champion-icon" />
            <div class="queue-name-date">
              <div class="queue-name">
                {{ lcs.gameData.queues[item.game.queueId]?.name || item.game.queueId }}
              </div>
              <div class="line2">
                {{ dayjs(item.game.gameCreation).format('MM-DD HH:mm') }}
                <span class="win-lose">{{ getWinResultText(item) }}</span>
              </div>
            </div>
            <div class="kda">
              {{ item.selfParticipant.stats.kills }} / {{ item.selfParticipant.stats.deaths }} /
              {{ item.selfParticipant.stats.assists }}
            </div>
          </div>
        </template>
      </NVirtualList>
      <div class="placeholder" v-else-if="matchHistoryLoading === 'loading'">
        <div class="loading">
          <NSpin :size="16" />
          <span>{{ t('PlayerInfoCard.loadingMatchHistory') }}</span>
        </div>
      </div>
      <div class="placeholder error-loading" v-else-if="matchHistoryLoading === 'error'">
        <NIcon><WarningIcon /></NIcon>
        <span>{{ t('PlayerInfoCard.errorLoadingMatchHistory') }}</span>
      </div>
      <div class="placeholder" v-else>{{ t('PlayerInfoCard.empty') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import RankedTable from '@renderer-shared/components/RankedTable.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useChampionInfo } from '@renderer-shared/compositions/useChampionInfo'
import { useStreamerModeMaskedText } from '@renderer-shared/compositions/useStreamerModeMaskedText'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import {
  QueryStage,
  SavedInfo,
  useOngoingGameStore
} from '@renderer-shared/shards/ongoing-game/store'
import { formatI18nOrdinal } from '@shared/i18n'
import { Mastery } from '@shared/types/league-client/champion-mastery'
import { Game } from '@shared/types/league-client/match-history'
import { RankedStats } from '@shared/types/league-client/ranked'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import {
  MatchHistoryGameWithState,
  MatchHistoryGamesAnalysisAll,
  SelfParticipantGame,
  withSelfParticipantMatchHistory
} from '@shared/utils/analysis'
import { ParsedRole } from '@shared/utils/ranked'
import { Warning as WarningIcon } from '@vicons/ionicons5'
import { StarRound as StarRoundIcon } from '@vicons/material'
import { useElementHover } from '@vueuse/core'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NIcon, NPopover, NSpin, NVirtualList } from 'naive-ui'
import { computed, onDeactivated, useTemplateRef, watch } from 'vue'

import {
  FIXED_CARD_WIDTH_PX_LITERAL,
  PREMADE_TEAM_COLORS,
  RANKED_MEDAL_MAP
} from './ongoing-game-utils'
import PlayerCardTagsArea from './widgets/PlayerCardTagsArea.vue'

const {
  puuid,
  analysis,
  matchHistory,
  position,
  premadeTeamId,
  summoner,
  rankedStats,
  savedInfo,
  championMastery,
  queueType
} = defineProps<{
  puuid: string
  championId?: number
  isSelf?: boolean
  premadeTeamId?: string
  currentHighlightingPremadeTeamId?: string | null
  team?: string
  queueType?: string
  kdaIqr?: 'below' | 'over' | null
  position?: {
    position: string
    role: ParsedRole | null
  }
  summoner?: SummonerInfo
  rankedStats?: RankedStats
  championMastery?: Record<number, Mastery>
  matchHistory?: MatchHistoryGameWithState[]
  matchHistoryLoading?: string
  analysis?: MatchHistoryGamesAnalysisAll
  savedInfo?: SavedInfo
  queryStage: QueryStage
}>()

const emits = defineEmits<{
  toSummoner: [puuid: string]
  showGame: [game: Game, selfPuuid: string]
  showGameById: [gameId: number, selfPuuid: string]
  showSavedInfo: [puuid: string]
  highlight: [premadeTeamId: string, boolean]
}>()

const { t } = useTranslation()

const STARED_CHAMPION_LEVEL = 60

const ogs = useOngoingGameStore()

const premadeTitleElHovering = useElementHover(useTemplateRef('premade-title-el'))
watch(
  () => premadeTitleElHovering.value,
  (hovering) => {
    if (premadeTeamId) {
      emits('highlight', premadeTeamId, hovering)
    }
  }
)

// 以防路由时高亮状态未清除
onDeactivated(() => {
  if (premadeTeamId) {
    emits('highlight', premadeTeamId, false)
  }
})

const lcs = useLeagueClientStore()
const as = useAppCommonStore()

const positionInfo = computed(() => {
  const info = {
    current: null as string | null,
    role: null as ParsedRole | null,
    recent: [] as { position: string; count: number }[]
  }

  if (!position?.position || position.position === 'NONE') {
    return null
  }

  info.current = position.position
  info.role = position.role

  if (analysis?.positions) {
    const recentPositions = Object.entries(analysis.positions.positions)
      .map(([position, count]) => ({ position, count }))
      .filter((p) => p.position !== 'NONE' && p.count > 0)
      .toSorted((a, b) => b.count - a.count)

    info.recent = recentPositions
  }

  return info
})

const FREQUENT_USED_CHAMPIONS_MAX_COUNT = 9

const championUsage = computed(() => {
  if (ogs.frontendSettings.showChampionUsage === 'recent') {
    if (!analysis) {
      return []
    }

    const truncated = Object.values(analysis.champions)
      .toSorted((a, b) => {
        return b.count - a.count
      })
      .slice(0, FREQUENT_USED_CHAMPIONS_MAX_COUNT)
      .map((c) => ({
        id: c.id,
        analysis: c,
        mastery: championMastery && championMastery[c.id]
      }))

    return truncated
  } else if (ogs.frontendSettings.showChampionUsage === 'mastery') {
    if (!championMastery) {
      return []
    }

    const truncated = Object.values(championMastery)
      .toSorted((a, b) => {
        return b.championPoints - a.championPoints
      })
      .slice(0, FREQUENT_USED_CHAMPIONS_MAX_COUNT)
      .map((m) => ({
        id: m.championId,
        analysis: analysis?.champions[m.championId],
        mastery: m
      }))

    return truncated
  }

  return []
})

const rankedSoloFlex = computed(() => {
  if (!rankedStats) {
    return {
      solo: null,
      flex: null,
      cherry: null
    }
  }

  const result: Record<string, any> = {}

  const solo = rankedStats.queueMap['RANKED_SOLO_5x5']
  const flex = rankedStats.queueMap['RANKED_FLEX_SR']
  const cherry = rankedStats.queueMap['CHERRY']

  if (solo) {
    const soloText =
      solo.division && solo.division !== 'NA'
        ? `${t(`common.shortTiers.${solo.tier || 'UNRANKED'}`)} ${solo.division}`
        : `${t(`common.shortTiers.${solo.tier || 'UNRANKED'}`)}`

    result.solo = {
      text: soloText,
      tier: solo.tier,
      division: solo.division,
      lp: solo.leaguePoints
    }
  }

  if (flex) {
    const flexText =
      flex.division && flex.division !== 'NA'
        ? `${t(`common.shortTiers.${flex.tier || 'UNRANKED'}`)} ${flex.division}`
        : `${t(`common.shortTiers.${flex.tier || 'UNRANKED'}`)}`

    result.flex = {
      text: flexText,
      tier: flex.tier,
      division: flex.division,
      lp: flex.leaguePoints
    }
  }

  if (cherry) {
    result.cherry = {
      ratedRating: cherry.ratedRating
    }
  }

  return result
})

const MILESTONE_ORDER = [
  'S+',
  'S',
  'S-',
  'A+',
  'A',
  'A-',
  'B+',
  'B',
  'B-',
  'C+',
  'C',
  'C-',
  'D+',
  'D',
  'D-'
]

const positionAssignmentReason = computed(() => {
  return {
    FILL_SECONDARY: {
      name: t('common.positionAssignmentReason.FILL_SECONDARY'),
      color: '#82613b',
      foregroundColor: '#ffffff'
    },
    FILL_PRIMARY: {
      name: t('common.positionAssignmentReason.FILL_PRIMARY'),
      color: '#5b4694',
      foregroundColor: '#ffffff'
    },
    PRIMARY: {
      name: t('common.positionAssignmentReason.PRIMARY'),
      color: '#5b4694',
      foregroundColor: '#ffffff'
    },
    SECONDARY: {
      name: t('common.positionAssignmentReason.SECONDARY'),
      color: '#5b4694',
      foregroundColor: '#ffffff'
    },
    AUTOFILL: {
      name: t('common.positionAssignmentReason.AUTOFILL'),
      color: '#944646',
      foregroundColor: '#ffffff'
    },
    AUTOFILL_SHORT: {
      name: t('common.positionAssignmentReason.AUTOFILL_SHORT'),
      color: '#944646',
      foregroundColor: '#ffffff'
    }
  }
})

const toSortedMilestoneGrades = (arr: string[]) => {
  const deduplicated = Array.from(new Set(arr))

  const newArr = deduplicated.toSorted((a, b) => {
    const aIndex = MILESTONE_ORDER.indexOf(a)
    const bIndex = MILESTONE_ORDER.indexOf(b)

    if (aIndex === -1 && bIndex === -1) {
      return 0
    }

    if (aIndex === -1) {
      return 1
    }

    if (bIndex === -1) {
      return -1
    }

    return aIndex - bIndex
  })

  return newArr
}

const getWinLoseClassName = (match: SelfParticipantGame) => {
  const classes: string[] = []

  if (ogs.frontendSettings.showMatchHistoryItemBorder) {
    classes.push('bordered')
  }

  if (match.game.gameMode === 'PRACTICETOOL') {
    classes.push('na')
    return classes
  }

  if (match.game.endOfGameResult === 'Abort_AntiCheatExit') {
    classes.push('na')
    return classes
  }

  if (match.selfParticipant.stats.gameEndedInEarlySurrender) {
    classes.push('na')
    return classes
  }

  if (match.selfParticipant.stats.win) {
    classes.push('win')
  } else {
    classes.push('lose')
  }

  return classes
}

const getWinResultText = (match: SelfParticipantGame) => {
  if (match.game.gameMode === 'PRACTICETOOL') {
    return t('PlayerInfoCard.matchHistory.winResult.na')
  }

  if (match.game.endOfGameResult === 'Abort_AntiCheatExit') {
    return t('PlayerInfoCard.matchHistory.winResult.abort')
  }

  if (match.selfParticipant.stats.gameEndedInEarlySurrender) {
    return t('PlayerInfoCard.matchHistory.winResult.remake')
  }

  if (match.game.gameMode === 'CHERRY') {
    if (match.selfParticipant.stats.subteamPlacement === 0) {
      return '?'
    }

    return formatI18nOrdinal(match.selfParticipant.stats.subteamPlacement, as.settings.locale)
  }

  return match.selfParticipant.stats.win
    ? t('PlayerInfoCard.matchHistory.winResult.win')
    : t('PlayerInfoCard.matchHistory.winResult.lose')
}

const matches = computed(() => {
  if (!matchHistory) {
    return []
  }

  return withSelfParticipantMatchHistory(matchHistory, puuid).map((game) => ({
    ...game,
    gameId: game.game.gameId
  }))
})

const { masked } = useStreamerModeMaskedText()
const { name } = useChampionInfo()
</script>

<style lang="less" scoped>
.player-card {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 8px;
  height: 360px;
  border-radius: 4px;
  box-sizing: border-box;
  border: 1px solid #ffffff60;
  background-color: #11111180;
  width: v-bind(FIXED_CARD_WIDTH_PX_LITERAL);
  overflow: hidden;
  backdrop-filter: blur(4px);

  transition: filter 0.2s;

  &.dimming {
    filter: brightness(0.3);
  }

  &.highlighting {
    filter: brightness(1.1);
  }

  .premade-deco {
    position: absolute;
    right: 0;
    top: 0;
    width: 16px;
    height: 16px;
    transform: translate(50%, -50%) rotate(45deg);
    z-index: 0;
  }
}

.player-info {
  display: flex;
  margin-bottom: 4px;

  .profile-icon {
    position: relative;
    position: relative;
    margin-right: 8px;
  }

  .champion {
    width: 42px;
    height: 42px;
  }

  .level {
    position: absolute;
    bottom: 0;
    right: 0;
    transform: translateX(35%);
    background-color: #00000080;
    font-size: 10px;
    border-radius: 4px;
    padding: 0 4px;
  }

  .position-icon {
    position: absolute;
    bottom: 0;
    right: 0;
    background-color: #00000080;
    font-size: 16px;
  }

  .name-group {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 0;
    justify-content: center;
    gap: 4px;

    .name-tag {
      transition: filter 0.3s;
      cursor: pointer;

      // 内部容器用于平衡 popover 的位置
      .name-tag-inner {
        max-width: 100%;
        width: fit-content;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &:hover {
        filter: brightness(1.2);
      }
    }

    .name {
      font-weight: bold;
      font-size: 13px;
      color: #e8e8e8;
    }

    .tag-line {
      font-size: 12px;
      color: #999;
      margin-left: 4px;
    }
  }

  .ranked {
    display: flex;
    gap: 4px;

    .ranked-item {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      width: 0;

      .image {
        width: 16px;
        height: 16px;
        margin-right: 4px;
      }

      .text,
      .lp {
        font-size: 11px;
        color: #dfdfdf;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .lp {
        font-size: 10px;
        margin-left: 4px;
      }

      &.unranked {
        .text {
          color: #999;
        }
      }

      &.cherry {
        justify-content: flex-start;
      }
    }
  }
}

.stats {
  display: flex;
  align-items: center;
  margin-bottom: 4px;

  .position-info {
    display: flex;
    gap: 2px;
    font-size: 16px;
    align-items: center;
    flex: 1;
    justify-content: center;

    &:not(.autofill) {
      margin-left: 16px;
    }

    .divider {
      margin: 0 2px;
      width: 1px;
      height: 12px;
      background-color: #ffffff40;
    }
  }

  .win-rate {
    font-size: 13px;
    font-weight: bold;
    text-align: center;
    flex: 1;
  }

  .win-rate-cherry {
    font-size: 13px;
    font-weight: bold;
    text-align: center;
    flex: 1;

    .top1-rate {
      font-size: 11px;
      font-weight: normal;
    }
  }

  .win-rate,
  .win-rate-cherry {
    .game-count {
      margin-left: 4px;
      color: #fffa;
      font-weight: normal;
      font-size: 9px;
    }
  }

  .good {
    color: #4cc69d;
  }

  .normal {
    color: #dcdcdc;
  }

  .bad {
    color: #ff6161;
  }

  .kda {
    flex: 1;
    font-size: 13px;
    font-weight: bold;
    text-align: center;
  }
}

.frequent-used-champions {
  display: flex;
  gap: 4px;
  width: 100%;
  box-sizing: border-box;
  align-items: center;
  margin-bottom: 4px;

  .frequent-used-champion {
    position: relative;
    height: 20px;
    width: 20px;

    .image {
      width: 100%;
      height: 100%;
      border-radius: 2px;
    }

    .star-icon {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      color: #fff838;
    }
  }
}

.match-history {
  display: flex;
  flex: 1;
  width: 100%;
  height: 0;
  gap: 2px;
  margin-top: 4px; // 再补一点间距, 合计 8px

  .match-item {
    position: relative;
    display: flex;
    align-items: center;
    height: 30px;
    padding: 2px;
    box-sizing: border-box;
    background-color: #ffffff10;
    border-radius: 2px;
    padding-left: 8px;
    transition: filter 0.3s;
    cursor: pointer;
    margin-bottom: 2px;
    box-sizing: border-box;

    .ordinal {
      opacity: 0;
      position: absolute;
      font-size: 10px;
      color: #ffffff40;
      bottom: 0;
      right: 0;
    }

    &:hover {
      .ordinal {
        opacity: 1;
      }
    }

    &:hover {
      filter: brightness(1.2);
    }

    &.bordered.win {
      border: #2369cab0 1px solid;
    }

    &.bordered.lose {
      border: #c94f4fb0 1px solid;
    }

    &.bordered.na {
      border: #c0c0c0b0 1px solid;
    }

    &.win {
      background-color: #2369ca30;

      .win-lose {
        color: #4cc69d;
      }
    }

    &.lose {
      background-color: #c94f4f30;

      .win-lose {
        color: #ff6161;
      }
    }

    &.na {
      border-left-color: #c0c0c030;

      .win-lose {
        color: #c0c0c0;
      }
    }

    .win-lose {
      margin-left: 4px;
    }

    .champion-icon {
      margin-right: 4px;
    }

    .queue-name-date {
      width: 100px;
      margin-right: 4px;
    }

    .queue-name {
      font-size: 12px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      color: #e8e8e8;
    }

    .line2 {
      font-size: 10px;
      color: #d6d6d6;
    }

    .kda {
      font-size: 12px;
    }
  }

  .champion-icon,
  .frequent-champion-icon {
    width: 24px;
    height: 24px;
    background-color: #4b5b7d;
    border-radius: 2px;
  }

  .placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    font-size: 12px;
    color: #ffffffa0;
    gap: 4px;

    .loading {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    &.error-loading {
      position: relative;
      left: -4px;
      color: #ff8a3c;
    }
  }
}

.popover-text {
  font-size: 12px;
  max-width: 200px;
}

.champion-stats {
  max-width: 260px;

  .champion-line {
    display: flex;
    gap: 8px;
    font-size: 12px;
    align-items: center;
    margin-bottom: 4px;

    .champion-icon {
      width: 22px;
      height: 22px;
    }

    .champion-name {
      font-size: 12px;
      color: #e8e8e8;
      font-weight: bold;
    }
  }

  .recent-plays {
    font-size: 12px;
  }

  .mastery-points {
    display: flex;
    gap: 4px;
    align-items: center;
    margin-top: 4px;

    .level {
      border-radius: 2px;
      background-color: #b94ecf;
      font-size: 11px;
      padding: 0 4px;
    }

    .points {
      font-size: 12px;
    }
  }

  .milestones {
    display: flex;
    gap: 2px;
    flex-wrap: wrap;
    margin-top: 4px;

    .milestone {
      border-radius: 2px;
      background-color: #4e82cf;
      font-size: 11px;
      padding: 0 4px;
    }
  }
}

.assignment-reason {
  white-space: nowrap;
  font-size: 11px;
  line-height: 11px;
  color: #ffffff;
  padding: 2px 4px;
  border-radius: 2px;
}

.position-info-popover {
  .name-line {
    display: flex;
    align-items: flex-end;
    gap: 4px;

    .position-name {
      font-size: 14px;
      font-weight: bold;
    }

    margin-bottom: 8px;
  }

  .recent-play,
  .assignment {
    display: flex;
    align-items: center;
  }

  .label {
    font-size: 12px;
    margin-right: 8px;
    width: 64px;
  }

  .position-icon {
    font-size: 18px;
    color: #fff;
  }
}

.premade-team-deco {
  position: absolute;
  right: 0;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: -1;
}
</style>
