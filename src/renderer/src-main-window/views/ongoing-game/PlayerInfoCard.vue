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
      borderColor: premadeTeamId ? PREMADE_TEAM_COLORS[premadeTeamId]?.borderColor : '#ffffff20'
    }"
  >
    <div class="player-info">
      <div class="profile-icon">
        <ChampionIcon
          :champion-id="championId"
          round
          ring
          ring-color="#ffffff50"
          class="champion"
        />
        <div class="level" v-if="summoner">{{ summoner.summonerLevel }}</div>
      </div>
      <div class="name-group">
        <div class="name-tag" @click="() => emits('toSummoner', puuid)" ref="pre-made-tag-el">
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
                  >{{ summoner?.gameName || summoner?.displayName || '—' }}</span
                >
                <span class="tag-line">#{{ summoner?.tagLine || '—' }}</span>
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
              <template v-if="queueType !== 'CHERRY'">
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
              <template v-else>
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
            </div>
          </template>
          <RankedTable v-if="rankedStats" :rankedStats="rankedStats" />
          <div v-else style="font-size: 12px">{{ t('common.PlayerInfoCard.empty') }}</div>
        </NPopover>
      </div>
    </div>
    <div class="stats">
      <template v-if="queueType === 'CHERRY'">
        <NPopover :keep-alive-on-hover="false" :disabled="!analysis" :delay="50">
          <template #trigger>
            <div
              class="win-rate-cherry gte-53"
              :class="{
                'gte-53': analysis.summary.winRate >= 0.53,
                'gt-47-lt-53': analysis.summary.winRate > 0.47 && analysis.summary.winRate < 0.53,
                'lte-47': analysis.summary.winRate <= 0.47
              }"
              :title="`${t('PlayerInfoCard.top4Rate')} & ${t('PlayerInfoCard.1stRate')}`"
              v-if="analysis"
            >
              {{ analysis.summary.winRate.toFixed() }} %
              <span class="first-rate"
                >({{
                  t('PlayerInfoCard.1st', { rate: analysis.summary.cherry.top1Rate.toFixed() })
                }})</span
              >
            </div>
            <div v-else class="win-rate">— %</div>
          </template>
          <div class="popover-text" v-if="analysis">
            {{
              t('PlayerInfoCard.cherryWinRatePopover', {
                countV: analysis.summary.count,
                winRate: (analysis.summary.winRate * 100).toFixed(),
                cherryCount: analysis.summary.cherry.count,
                top1Rate: analysis.summary.cherry.top1Rate
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
                'gte-53': analysis.summary.winRate >= 0.53,
                'gt-47-lt-53': analysis.summary.winRate > 0.47 && analysis.summary.winRate < 0.53,
                'lte-47': analysis.summary.winRate <= 0.47
              }"
            >
              {{ (analysis.summary.winRate * 100).toFixed() }}%<span class="game-count"
                >({{ analysis.summary.count }})</span
              >
            </div>
            <div class="win-rate" v-else>—%</div>
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
          <div class="kda">{{ analysis?.summary.averageKda.toFixed(2) || '—' }}</div>
        </template>
        <div class="popover-text" v-if="analysis">
          {{
            t('PlayerInfoCard.kdaPopover', {
              countV: analysis.summary.count,
              kda: analysis.summary.averageKda.toFixed(2),
              kills: analysis.summary.totalKills,
              deaths: analysis.summary.totalDeaths,
              assists: analysis.summary.totalAssists
            })
          }}
        </div>
      </NPopover>
      <NPopover v-if="positionInfo">
        <template #trigger>
          <div class="position-info">
            <!-- Left Current Position -->
            <PositionIcon
              v-if="positionInfo.current && positionInfo.current !== 'NONE'"
              :position="positionInfo.current"
            />
            <!-- Right Side Auxiliary Information -->
            <template v-if="positionInfo.recent && positionInfo.recent.length">
              <div class="divider"></div>
              <PositionIcon v-for="p of positionInfo.recent.slice(0, 2)" :position="p.position" />
            </template>
            <template v-else-if="positionInfo.role">
              <div class="divider"></div>
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
            <PositionIcon class="position-icon" :position="positionInfo.current || 'ALL'" />
            <span class="position-name">{{
              t(`common.lanes.${positionInfo.current || 'ALL'}`)
            }}</span>
            <div
              class="assignment-reason"
              v-if="positionInfo.role"
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
    <div class="tags">
      <div class="tag self" v-if="isSelf">{{ t('PlayerInfoCard.self') }}</div>
      <NPopover v-if="savedInfo && !isSelf && savedInfo.tag" :delay="50" style="max-height: 240px">
        <template #trigger>
          <div class="tag tagged">{{ t('PlayerInfoCard.tagged') }}</div>
        </template>
        <div class="tagged-text" style="max-width: 260px">
          {{ savedInfo.tag }}
        </div>
      </NPopover>
      <NPopover
        :keep-alive-on-hover="false"
        :delay="50"
        v-if="analysis && analysis.summary.count >= 16 && analysis.summary.winRate >= 0.85"
      >
        <template #trigger>
          <div class="tag win-rate-team">{{ t('PlayerInfoCard.highWinRate') }}</div>
        </template>
        <div class="popover-text">
          {{
            t('PlayerInfoCard.highWinRatePopover', {
              countV: analysis.summary.count,
              winCount: analysis.summary.win
            })
          }}
        </div>
      </NPopover>
      <NPopover
        v-if="savedInfo && savedInfo.lastMetAt && !isSelf"
        :delay="50"
        scrollable
        style="max-height: 240px"
      >
        <template #trigger>
          <div class="tag have-met">{{ t('PlayerInfoCard.met') }}</div>
        </template>
        <div class="popover-text have-met-popover">
          <div style="margin-bottom: 4px">
            {{
              t('PlayerInfoCard.metPopover.title', {
                date: dayjs(savedInfo.lastMetAt)
                  .locale(as.settings.locale.toLowerCase())
                  .format('YYYY-MM-DD HH:mm:ss'),
                countV: savedInfo.encounteredGames.length
              })
            }}
          </div>
          <table class="encountered-game-table">
            <colgroup>
              <col class="game-id-col" />
            </colgroup>
            <thead>
              <tr>
                <th>{{ t('PlayerInfoCard.metPopover.gameId') }}</th>
                <th>{{ t('PlayerInfoCard.metPopover.date') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in savedInfo.encounteredGames" :key="item.gameId">
                <td class="game-id-td" @click="() => emits('showGameById', item.gameId, puuid)">
                  {{ item.gameId }}
                </td>
                <td>
                  {{ dayjs(item.updateAt).format('MM-DD HH:mm:ss') }} ({{
                    dayjs(item.updateAt).locale(as.settings.locale.toLowerCase()).fromNow()
                  }})
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </NPopover>
      <NPopover
        :keep-alive-on-hover="false"
        v-if="summoner?.privacy === 'PRIVATE' && !isSelf"
        :delay="50"
      >
        <template #trigger>
          <div class="tag privacy-private">{{ t('PlayerInfoCard.private') }}</div>
        </template>
        <div class="popover-text">
          {{ t('PlayerInfoCard.privatePopover') }}
        </div>
      </NPopover>
      <NPopover
        :keep-alive-on-hover="false"
        v-if="analysis && analysis.summary.winningStreak >= 3"
        :delay="50"
      >
        <template #trigger>
          <div class="tag winning-streak">
            {{
              t('PlayerInfoCard.winningStreak', {
                countV: analysis.summary.winningStreak
              })
            }}
          </div>
        </template>
        <div class="popover-text">
          {{
            t('PlayerInfoCard.winningStreakPopover', {
              countV: analysis.summary.winningStreak
            })
          }}
        </div>
      </NPopover>
      <NPopover
        :keep-alive-on-hover="false"
        v-if="analysis && analysis.summary.losingStreak >= 3"
        :delay="50"
      >
        <template #trigger>
          <div class="tag losing-streak">
            {{
              t('PlayerInfoCard.losingStreak', {
                countV: analysis.summary.losingStreak
              })
            }}
          </div>
        </template>
        <div class="popover-text">
          {{
            t('PlayerInfoCard.losingStreakPopover', {
              countV: analysis.summary.losingStreak
            })
          }}
        </div>
      </NPopover>
      <NPopover
        :keep-alive-on-hover="false"
        v-if="analysis && (analysis.akariScore.good || analysis.akariScore.great)"
        :delay="50"
      >
        <template #trigger>
          <div class="tag akari-loved" v-if="analysis.akariScore.great">
            {{ t('PlayerInfoCard.akariLoved.great') }}
          </div>
          <div class="tag akari-loved" v-else-if="analysis.akariScore.good">
            {{ t('PlayerInfoCard.akariLoved.great') }}
          </div>
        </template>
        <div class="popover-text" v-if="analysis.akariScore.great">
          {{ t('PlayerInfoCard.akariLoved.greatPopover') }}
        </div>
        <div class="popover-text" v-else-if="analysis.akariScore.good">
          {{ t('PlayerInfoCard.akariLoved.goodPopover') }}
        </div>
      </NPopover>
      <NPopover
        :keep-alive-on-hover="false"
        v-if="isSuspiciousFlashPosition && isSuspiciousFlashPosition.isSuspicious"
        :delay="50"
      >
        <template #trigger>
          <div class="tag sus-flash">
            {{ t('PlayerInfoCard.suspiciousFlashPosition') }}
          </div>
        </template>
        <div class="popover-text">
          {{
            t('PlayerInfoCard.suspiciousFlashPositionPopover', {
              dCount: isSuspiciousFlashPosition.flashOnD,
              fCount: isSuspiciousFlashPosition.flashOnF
            })
          }}
        </div>
      </NPopover>
      <NPopover
        :keep-alive-on-hover="false"
        v-if="soloKills && soloKills.avgSoloDeathsInEarlyGame >= SOLO_DEATHS_THRESHOLD"
        :delay="50"
      >
        <template #trigger>
          <div class="tag too-many-solo-deaths">
            {{
              t('PlayerInfoCard.soloKills.tooManySoloDeathsInEarlyGame', {
                times: soloKills.avgSoloDeathsInEarlyGame.toFixed(0)
              })
            }}
          </div>
        </template>
        <div class="popover-text">
          {{
            t('PlayerInfoCard.soloKills.tooManySoloDeathsInEarlyGamePopover', {
              times: soloKills.avgSoloDeathsInEarlyGame.toFixed(2),
              countV: soloKills.count,
              minutes: EARLY_GAME_THRESHOLD_MINUTES
            })
          }}
        </div>
      </NPopover>
      <NPopover
        :keep-alive-on-hover="false"
        v-if="soloKills && soloKills.avgSoloKillsInEarlyGame >= SOLO_KILLS_THRESHOLD"
        :delay="50"
      >
        <template #trigger>
          <div class="tag too-many-solo-kills">
            {{
              t('PlayerInfoCard.soloKills.tooManySoloKillsInEarlyGame', {
                times: soloKills.avgSoloKillsInEarlyGame.toFixed(0)
              })
            }}
          </div>
        </template>
        <div class="popover-text">
          {{
            t('PlayerInfoCard.soloKills.tooManySoloKillsInEarlyGamePopover', {
              times: soloKills.avgSoloKillsInEarlyGame.toFixed(2),
              countV: soloKills.count,
              minutes: EARLY_GAME_THRESHOLD_MINUTES
            })
          }}
        </div>
      </NPopover>
      <NPopover
        :keep-alive-on-hover="false"
        v-if="as.settings.isInKyokoMode && analysis"
        :delay="50"
      >
        <template #trigger>
          <div class="tag akari-loved">Akari {{ analysis.akariScore.total.toFixed(1) }}</div>
        </template>
        <div class="popover-text">
          <div style="font-weight: bold">
            Akari Score: {{ analysis.akariScore.total.toFixed(1) }}
          </div>
          <div
            style="
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              row-gap: 2px;
              column-gap: 16px;
              margin-top: 4px;
            "
          >
            <div>伤害: {{ analysis.akariScore.dmgScore.toFixed(2) }}</div>
            <div>承伤: {{ analysis.akariScore.dmgTakenScore.toFixed(2) }}</div>
            <div>经济: {{ analysis.akariScore.goldScore.toFixed(2) }}</div>
            <div>补兵: {{ analysis.akariScore.csScore.toFixed(2) }}</div>
            <div>参团: {{ analysis.akariScore.participationScore.toFixed(2) }}</div>
            <div>KDA: {{ analysis.akariScore.kdaScore.toFixed(2) }}</div>
            <div>胜率: {{ analysis.akariScore.winRateScore.toFixed(2) }}</div>
          </div>
        </div>
      </NPopover>
    </div>
    <div class="frequent-used-champions" v-if="frequentlyUsedChampions.length">
      <NPopover :keep-alive-on-hover="false" v-for="c of frequentlyUsedChampions" :delay="50">
        <template #trigger>
          <div class="frequent-used-champion">
            <ChampionIcon
              :ring-color="c.winRate >= 0.5 ? '#2368ca' : '#c94f4f'"
              :champion-id="c.id"
              ring
              :ring-width="1"
              class="image"
            />
            <StarRoundIcon
              v-if="
                championMastery &&
                championMastery[c.id] &&
                championMastery[c.id].championLevel >= STARED_CHAMPION_LEVEL
              "
              class="star-icon"
            />
          </div>
        </template>
        <div class="champion-stats">
          <div class="champion-line">
            <ChampionIcon ring :ring-width="1" round class="champion-icon" :champion-id="c.id" />
            <div class="champion-name">{{ lcs.gameData.champions[c.id]?.name || c.id }}</div>
          </div>
          <div class="recent-plays">
            {{
              t('PlayerInfoCard.champion.winRate', {
                countV: c.count,
                winRate: (c.winRate * 100).toFixed()
              })
            }}
          </div>
          <template v-if="championMastery && championMastery[c.id]">
            <div class="mastery-points">
              <span class="level">{{
                t('PlayerInfoCard.champion.level', {
                  level: championMastery[c.id].championLevel
                })
              }}</span>
              <span class="points">{{
                t('PlayerInfoCard.champion.masteryPoints', {
                  points: championMastery[c.id].championPoints.toLocaleString()
                })
              }}</span>
            </div>
            <div class="milestones">
              <span
                class="milestone"
                v-for="m of toSortedMilestoneGrades(championMastery[c.id].milestoneGrades)"
                >{{ m }}</span
              >
            </div>
          </template>
        </div>
      </NPopover>
    </div>
    <div class="match-history">
      <NVirtualList style="height: 100%" :item-size="32" :items="matches" v-if="matches.length">
        <template #default="{ item }">
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
        {{ t('PlayerInfoCard.loadingMatchHistory') }}
      </div>
      <div class="placeholder" v-else>{{ t('PlayerInfoCard.empty') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { QueryStage, SavedInfo } from '@renderer-shared/shards/ongoing-game/store'
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
import { StarRound as StarRoundIcon } from '@vicons/material'
import { useElementHover } from '@vueuse/core'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NPopover, NVirtualList } from 'naive-ui'
import { computed, onDeactivated, useTemplateRef, watch } from 'vue'

import RankedTable from '@main-window/components/RankedTable.vue'
import PositionIcon from '@main-window/components/icons/position-icons/PositionIcon.vue'

import {
  FIXED_CARD_WIDTH_PX_LITERAL,
  PREMADE_TEAM_COLORS,
  RANKED_MEDAL_MAP
} from './ongoing-game-utils'

const { puuid, analysis, matchHistory, position, premadeTeamId, summoner, rankedStats, savedInfo } =
  defineProps<{
    puuid: string
    championId?: number
    isSelf?: boolean
    premadeTeamId?: string
    currentHighlightingPremadeTeamId?: string | null
    team?: string
    queueType?: string
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
const SOLO_DEATHS_THRESHOLD = 3
const SOLO_KILLS_THRESHOLD = 3
const EARLY_GAME_THRESHOLD_MINUTES = 14

const premadeTagElHovering = useElementHover(useTemplateRef('pre-made-tag-el'))
watch(premadeTagElHovering, (h) => {
  if (premadeTeamId) {
    emits('highlight', premadeTeamId, h)
  }
})

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

  if (!position || position.position === 'NONE') {
    return null
  }

  info.current = position.position
  info.role = position.role

  if (analysis?.positions) {
    const recentPositions = Object.entries(analysis.positions.positions)
      .map(([position, count]) => ({ position, count }))
      .filter((p) => p.count > 0)
      .toSorted((a, b) => b.count - a.count)

    info.recent = recentPositions
  }

  return info
})

const FREQUENT_USED_CHAMPIONS_MAX_COUNT = 9

const frequentlyUsedChampions = computed(() => {
  if (!analysis) {
    return []
  }

  const truncated = Object.values(analysis.champions)
    .toSorted((a, b) => {
      return b.count - a.count
    })
    .slice(0, FREQUENT_USED_CHAMPIONS_MAX_COUNT)

  return truncated
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
      division: solo.division
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
      division: flex.division
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
    }
  }
})

const isSuspiciousFlashPosition = computed(() => {
  if (!analysis) {
    return null
  }

  return {
    isSuspicious: analysis.summary.flashOnD && analysis.summary.flashOnF,
    flashOnD: analysis.summary.flashOnD,
    flashOnF: analysis.summary.flashOnF
  }
})

const soloKills = computed(() => {
  if (!analysis || !matchHistory) {
    return null
  }

  const sl = matchHistory
    .map(({ game }) => {
      const gameId = game.gameId
      const a = analysis.games[gameId]

      if (a && a.soloKills !== null && a.soloDeaths !== null) {
        return {
          gameId,
          soloKills: a.soloKills,
          soloDeaths: a.soloDeaths,
          soloKillsBefore: a.soloKills.filter(
            (k) => k.time < EARLY_GAME_THRESHOLD_MINUTES * 60 * 1000
          ),
          soloDeathsBefore: a.soloDeaths.filter(
            (d) => d.time < EARLY_GAME_THRESHOLD_MINUTES * 60 * 1000
          )
        }
      }

      return null
    })
    .filter((a) => a !== null)

  if (sl.length === 0) {
    return null
  }

  const avgSoloKills = sl.reduce((acc, cur) => acc + cur.soloKills.length, 0) / sl.length
  const avgSoloDeaths = sl.reduce((acc, cur) => acc + cur.soloDeaths.length, 0) / sl.length
  const avgSoloKillsInEarlyGame =
    sl.reduce((acc, cur) => acc + cur.soloKillsBefore.length, 0) / sl.length
  const avgSoloDeathsInEarlyGame =
    sl.reduce((acc, cur) => acc + cur.soloDeathsBefore.length, 0) / sl.length

  return {
    avgSoloKills,
    avgSoloDeaths,
    avgSoloKillsInEarlyGame,
    avgSoloDeathsInEarlyGame,
    count: sl.length,
    details: sl
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
  if (match.game.gameMode === 'PRACTICETOOL') {
    return 'na'
  }

  if (match.game.endOfGameResult === 'Abort_AntiCheatExit') {
    return 'na'
  }

  if (match.selfParticipant.stats.gameEndedInEarlySurrender) {
    return 'na'
  }

  return match.selfParticipant.stats.win ? 'win' : 'lose'
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

  return withSelfParticipantMatchHistory(matchHistory, puuid)
})
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
  border: 1px solid #ffffff20;
  background-color: #11111180;
  width: v-bind(FIXED_CARD_WIDTH_PX_LITERAL);
  overflow: hidden;

  transition: filter 0.2s;

  &.dimming {
    filter: brightness(0.3);
  }

  &.highlighting {
    filter: brightness(1.1);
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

      .text {
        font-size: 11px;
        color: #dfdfdf;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
    margin-left: 16px;

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

    .game-count {
      margin-left: 2px;
      color: #fffa;
      font-weight: normal;
      font-size: 9px;
    }
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

  .gte-53 {
    color: #4cc69d;
  }

  .gt-47-lt-53 {
    color: #dcdcdc;
  }

  .lte-47 {
    color: #ff6161;
  }

  .kda {
    flex: 1;
    font-size: 13px;
    color: #ffffffe0;
    font-weight: bold;
    text-align: center;
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;

  .tag {
    font-size: 11px;
    line-height: 11px;
    color: #ffffff;
    padding: 2px 4px;
    border-radius: 2px;

    &.tagged {
      background-color: #49914d;
    }

    &.primary {
      background-color: #5b4694;
    }

    &.win-rate-team {
      background-color: #7e2c85;
    }

    &.have-met {
      background-color: #5cacea;
      color: #000;
    }

    &.privacy-private {
      background-color: #870808;
    }

    &.winning-streak {
      background-color: #18571c;
      color: #fff;
    }

    &.losing-streak {
      background-color: #893b3b;
    }

    &.akari-loved {
      color: #ffffff;
      background-color: #b81b86;
    }

    &.sus-flash {
      color: #ffffff;
      background-color: #3a1bb8;
    }

    &.too-many-solo-deaths {
      color: #ffffff;
      background-color: #a81919;
    }

    &.too-many-solo-kills {
      color: #ffffff;
      background-color: #9019a8;
    }

    &.self {
      background-color: #37246c;
    }
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

    &:hover {
      filter: brightness(1.2);
    }

    &.win {
      background-color: #2369ca20;

      .win-lose {
        color: #4cc69d;
      }
    }

    &.lose {
      background-color: #c94f4f20;

      .win-lose {
        color: #ff6161;
      }
    }

    &.na {
      border-left-color: #c0c0c020;

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
    color: #999;
  }
}

.popover-text {
  font-size: 12px;
  max-width: 200px;
}

.popover-text.have-met-popover {
  max-width: unset;
  width: min-content;
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

.position-info-popover {
  .name-line {
    display: flex;
    align-items: flex-end;
    gap: 4px;

    .position-name {
      font-size: 14px;
      font-weight: bold;
    }

    .assignment-reason {
      margin-left: 8px;
      font-size: 11px;
      line-height: 11px;
      color: #ffffff;
      padding: 2px 4px;
      border-radius: 2px;
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

.encountered-game-table {
  border-collapse: collapse;
  border-spacing: 0;
  border: 1px solid #ffffff40;
  font-size: 12px;
  color: #d4d4d4;

  th,
  td {
    border: 1px solid #ffffff40;
    padding: 0 8px;
    text-align: center;
    white-space: nowrap;
  }

  .game-id-col {
    width: 120px;
  }

  .game-id-td:hover {
    color: #ffffff;
  }

  .game-id-td {
    transition: color 0.2s;
    cursor: pointer;
  }
}

.tagged-text {
  font-size: 12px;
  white-space: pre-wrap;
  max-width: 260px;
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
