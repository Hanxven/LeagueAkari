<template>
  <div
    class="player-card"
    :class="{
      dimming:
        currentHighlightingPreMadeTeamId && currentHighlightingPreMadeTeamId !== preMadeTeamId
    }"
    :style="{
      width: `${FIXED_CARD_WIDTH}px`
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
      </div>
      <div class="name-group">
        <div class="name-tag" @click="() => emits('toSummoner', puuid)">
          <span
            class="name"
            :style="{
              color: preMadeTeamId
                ? PRE_MADE_TEAM_COLORS[preMadeTeamId]?.foregroundColor
                : undefined
            }"
            >{{ summoner?.gameName || summoner?.displayName || '—' }}</span
          >
          <span class="tag-line">#{{ summoner?.tagLine || '—' }}</span>
        </div>
        <div class="ranked">
          <template v-if="queueType !== 'CHERRY'">
            <div
              class="ranked-item"
              title="单排 / 双排"
              v-if="rankedSoloFlex.solo && rankedSoloFlex.solo.tier && rankedSoloFlex.solo !== 'NA'"
            >
              <img class="image" :src="RANKED_MEDAL_MAP[rankedSoloFlex.solo.tier]" alt="rank" />
              <span class="text">{{
                rankedSoloFlex.solo.division && rankedSoloFlex.solo.division !== 'NA'
                  ? `${TIER_TEXT[rankedSoloFlex.solo.tier]} ${rankedSoloFlex.solo.division}`
                  : `${TIER_TEXT[rankedSoloFlex.solo.tier]}`
              }}</span>
            </div>
            <div class="ranked-item unranked" title="单排 / 双排" v-else>
              <span class="text">未定级</span>
            </div>
            <div
              class="ranked-item"
              title="灵活组排"
              v-if="rankedSoloFlex.flex && rankedSoloFlex.flex.tier && rankedSoloFlex.flex !== 'NA'"
            >
              <img class="image" :src="RANKED_MEDAL_MAP[rankedSoloFlex.flex.tier]" alt="rank" />
              <span class="text">{{
                rankedSoloFlex.flex.division && rankedSoloFlex.flex.division !== 'NA'
                  ? `${TIER_TEXT[rankedSoloFlex.flex.tier]} ${rankedSoloFlex.flex.division}`
                  : `${TIER_TEXT[rankedSoloFlex.flex.tier]}`
              }}</span>
            </div>
            <div class="ranked-item unranked" title="灵活组排" v-else>
              <span class="text">未定级</span>
            </div>
          </template>
          <template v-else>
            <div
              class="ranked-item cherry"
              title="灵活组排"
              v-if="rankedSoloFlex.cherry && rankedSoloFlex.cherry.ratedRating"
            >
              <span class="text"
                >斗魂竞技场
                <span style="font-weight: bold">{{ rankedSoloFlex.cherry.ratedRating }}</span>
                分</span
              >
            </div>
            <div class="ranked-item unranked cherry" title="灵活组排" v-else>
              <span class="text">未定级</span>
            </div>
          </template>
        </div>
      </div>
    </div>
    <div class="stats">
      <template v-if="queueType === 'CHERRY'">
        <NPopover :keep-alive-on-hover="false" :disabled="!analysis" :delay="50">
          <template #trigger>
            <div
              class="win-rate-cherry gte-55"
              :class="{
                'gte-55': analysis.summary.winRate >= 0.55,
                'gt-45-lt-55': analysis.summary.winRate > 0.45 && analysis.summary.winRate < 0.55,
                'lte-45': analysis.summary.winRate <= 0.45
              }"
              title="前四率 & 第一率"
              v-if="analysis"
            >
              {{ analysis.summary.winRate.toFixed() }} %
              <span class="first-rate"
                >(第一 {{ analysis.summary.cherry.top1Rate.toFixed() }} %)</span
              >
            </div>
            <div v-else class="win-rate" title="胜率">— %</div>
          </template>
          <div class="popover-text" v-if="analysis">
            在近期 {{ analysis.summary.count }} 场对局中，该玩家的胜率为
            {{ (analysis.summary.winRate * 100).toFixed() }}
            %。其中，斗魂竞技场的 {{ analysis.summary.cherry.count }} 场对局中，该玩家的首位率是
            {{ analysis.summary.cherry.top1Rate }} %
          </div>
        </NPopover>
      </template>
      <template v-else>
        <NPopover :keep-alive-on-hover="false" :disabled="!analysis">
          <template #trigger>
            <div
              class="win-rate"
              :class="{
                'gte-55': analysis.summary.winRate >= 0.55,
                'gt-45-lt-55': analysis.summary.winRate > 0.45 && analysis.summary.winRate < 0.55,
                'lte-45': analysis.summary.winRate <= 0.45
              }"
              title="胜率"
              v-if="analysis"
            >
              {{ (analysis.summary.winRate * 100).toFixed() }} %
            </div>
            <div class="win-rate" v-else title="胜率">— %</div>
          </template>
          <div class="popover-text" v-if="analysis">
            在近期 {{ analysis.summary.count }} 场对局中，该玩家的胜率为
            {{ (analysis.summary.winRate * 100).toFixed() }} %
          </div>
        </NPopover>
      </template>
      <NPopover :keep-alive-on-hover="false" :disabled="!analysis" :delay="50">
        <template #trigger>
          <div class="kda" title="KDA">{{ analysis?.summary.averageKda.toFixed(2) || '—' }}</div>
        </template>
        <div class="popover-text" v-if="analysis">
          在近期 {{ analysis.summary.count }} 场对局中，该玩家的平均 KDA 是
          {{ analysis.summary.averageKda.toFixed(2) }}
        </div>
      </NPopover>
      <div
        class="position-info"
        :class="{
          complete: position.role,
          incomplete: !position.role
        }"
        v-if="
          position &&
          ((position.position && position.position !== 'NONE') ||
            (position.role && position.role.current !== 'NONE'))
        "
      >
        <div
          class="assignment-reason"
          v-if="position.role"
          :style="{
            'background-color':
              POSITION_ASSIGNMENT_REASON[position.role.assignmentReason]?.color || '#5b4694',
            color:
              POSITION_ASSIGNMENT_REASON[position.role.assignmentReason]?.foregroundColor ||
              '#ffffff'
          }"
        >
          {{
            POSITION_ASSIGNMENT_REASON[position.role.assignmentReason]?.name ||
            position.role.assignmentReason
          }}
        </div>
        <PositionIcon
          v-if="position.position !== 'NONE' || position.role?.current !== 'NONE'"
          :position="position.position || position.role?.current"
        />
        <template v-if="position.role">
          <div class="divider"></div>
          <PositionIcon :position="position.role.primary" />
          <PositionIcon
            v-if="position.role.secondary !== 'UNSELECTED'"
            :position="position.role.secondary"
          />
        </template>
      </div>
    </div>
    <div class="tags">
      <NPopover v-if="savedInfo && !isSelf && savedInfo.tag" :delay="50" style="max-height: 240px">
        <template #trigger>
          <div class="tag tagged">已标记</div>
        </template>
        <div class="tagged-text" style="max-width: 260px">
          {{ savedInfo.tag }}
        </div>
      </NPopover>
      <NPopover :keep-alive-on-hover="false" :delay="50" v-if="preMadeTeamId">
        <template #trigger>
          <div
            class="tag"
            :style="{
              'background-color': PRE_MADE_TEAM_COLORS[preMadeTeamId]?.foregroundColor || '#ffffff',
              color: PRE_MADE_TEAM_COLORS[preMadeTeamId]?.color || '#000000'
            }"
            ref="pre-made-tag-el"
          >
            预组队 {{ preMadeTeamId }}
          </div>
        </template>
        <div class="popover-text">推测该玩家位于 {{ preMadeTeamId }} 小队中</div>
      </NPopover>
      <NPopover
        :keep-alive-on-hover="false"
        :delay="50"
        v-if="analysis && analysis.summary.count >= 16 && analysis.summary.winRate >= 0.85"
      >
        <template #trigger>
          <div class="tag win-rate-team">极高胜率</div>
        </template>
        <div class="popover-text">
          该玩家的胜率高到不可置信。在近期 {{ analysis.summary.count }} 场的对局中，赢了
          {{ analysis.summary.win }} 场
        </div>
      </NPopover>
      <NPopover
        :keep-alive-on-hover="false"
        v-if="savedInfo && savedInfo.lastMetAt && !isSelf"
        :delay="50"
      >
        <template #trigger>
          <div class="tag have-met">遇到过</div>
        </template>
        <div class="popover-text">
          {{
            `曾在 ${dayjs(savedInfo.lastMetAt).locale('zh-cn').fromNow()} 遇见过，共遇见过 ${savedInfo.encounteredGames.length} 次`
          }}
        </div>
      </NPopover>
      <NPopover
        :keep-alive-on-hover="false"
        v-if="summoner?.privacy === 'PRIVATE' && !isSelf"
        :delay="50"
      >
        <template #trigger>
          <div class="tag privacy-private">生涯隐藏</div>
        </template>
        <div class="popover-text">
          该玩家设置了生涯为隐藏。这意味着他人无法查看该玩家的个人主页，包括战绩、成就点数等。另外，也不能观战该玩家
        </div>
      </NPopover>
      <NPopover
        :keep-alive-on-hover="false"
        v-if="analysis && analysis.summary.winningStreak >= 3"
        :delay="50"
      >
        <template #trigger>
          <div class="tag winning-streak">{{ analysis.summary.winningStreak }} 连胜</div>
        </template>
        <div class="popover-text">
          截止到现在，该玩家 {{ analysis.summary.winningStreak }} 连胜，很棒
        </div>
      </NPopover>
      <NPopover
        :keep-alive-on-hover="false"
        v-if="analysis && analysis.summary.losingStreak >= 3"
        :delay="50"
      >
        <template #trigger>
          <div class="tag losing-streak">{{ analysis.summary.losingStreak }} 连败</div>
        </template>
        <div class="popover-text">
          截止到现在，该玩家已经 {{ analysis.summary.losingStreak }} 连败了
        </div>
      </NPopover>
      <NPopover
        :keep-alive-on-hover="false"
        v-if="analysis && analysis.akariScore.good"
        :delay="50"
      >
        <template #trigger>
          <div class="tag akari-loved">表现突出</div>
        </template>
        <div class="popover-text">该玩家在近期对局中表现优异</div>
      </NPopover>
      <NPopover
        :keep-alive-on-hover="false"
        v-if="app.settings.isInKyokoMode && analysis"
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
            <div>胜率: {{ analysis.akariScore.winRateScore.toFixed(2) }}</div>
          </div>
        </div>
      </NPopover>
      <div class="tag self" v-if="isSelf">我</div>
    </div>
    <div class="frequent-used-champions">
      <NPopover :keep-alive-on-hover="false" v-for="c of frequentlyUsedChampions" :delay="50">
        <template #trigger>
          <ChampionIcon
            :ring-color="c.winRate >= 0.5 ? '#4cc69dc0' : '#ff6161c0'"
            :champion-id="c.id"
            ring
            class="frequent-used-champion"
          />
        </template>
        <div class="popover-text">
          <div style="font-weight: bold">{{ gameData.champions[c.id]?.name || c.id }}</div>
          <div>近期选用了 {{ c.count }} 次，胜率为 {{ (c.winRate * 100).toFixed() }} %</div>
        </div>
      </NPopover>
    </div>
    <div class="match-history">
      <NVirtualList style="height: 100%" :item-size="32" :items="matches" v-if="matches.length">
        <template #default="{ item }">
          <div
            class="match-item"
            :class="[getWinLoseClassName(item)]"
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
                {{ gameData.queues[item.game.queueId]?.name || item.game.queueId }}
              </div>
              <div class="line2">
                {{ dayjs(item.game.gameCreation).format('DD-MM HH:mm') }}
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
      <div class="placeholder" v-else>无战绩</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useAppStore } from '@renderer-shared/modules/app/store'
import { SavedPlayerInfo } from '@renderer-shared/modules/core-functionality/store'
import { useGameDataStore } from '@renderer-shared/modules/lcu-state-sync/game-data'
import { Game } from '@shared/types/lcu/match-history'
import { RankedStats } from '@shared/types/lcu/ranked'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import {
  MatchHistoryGameWithState,
  MatchHistoryGamesAnalysisAll,
  SelfParticipantGame,
  withSelfParticipantMatchHistory
} from '@shared/utils/analysis'
import { ParsedRole } from '@shared/utils/ranked'
import { useElementHover } from '@vueuse/core'
import dayjs from 'dayjs'
import { NPopover, NVirtualList } from 'naive-ui'
import { computed, useTemplateRef, watch, watchEffect } from 'vue'

import PositionIcon from '@main-window/components/icons/position-icons/PositionIcon.vue'

import {
  CHINESE_NUMBERS,
  FIXED_CARD_WIDTH,
  POSITION_ASSIGNMENT_REASON,
  PRE_MADE_TEAM_COLORS,
  RANKED_MEDAL_MAP,
  TIER_TEXT
} from './ongoing-game-utils'

const { puuid, analysis, matchHistory, position, preMadeTeamId, rankedStats } = defineProps<{
  puuid: string
  championId?: number
  isSelf?: boolean
  preMadeTeamId?: string
  currentHighlightingPreMadeTeamId?: string | null
  team?: string
  queueType?: string
  position?: {
    position: string
    role: ParsedRole | null
  }
  summoner?: SummonerInfo
  rankedStats?: RankedStats
  matchHistory?: MatchHistoryGameWithState[]
  analysis?: MatchHistoryGamesAnalysisAll
  savedInfo?: SavedPlayerInfo
}>()

const emits = defineEmits<{
  toSummoner: [puuid: string]
  showGame: [game: Game, selfPuuid: string]
  showGameById: [gameId: number, selfPuuid: string]
  showSavedInfo: [puuid: string]
  highlight: [preMadeTeamId: string, boolean]
}>()

const preMadeTagElHovering = useElementHover(useTemplateRef('pre-made-tag-el'))
watch(preMadeTagElHovering, (h) => {
  if (preMadeTeamId) {
    emits('highlight', preMadeTeamId, h)
  }
})

const gameData = useGameDataStore()
const app = useAppStore()

const FREQUENT_USED_CHAMPIONS_COUNT = 9

const frequentlyUsedChampions = computed(() => {
  if (!analysis) {
    return []
  }

  const truncated = Object.values(analysis.champions)
    .toSorted((a, b) => {
      return b.count - a.count
    })
    .slice(0, FREQUENT_USED_CHAMPIONS_COUNT)

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

  // console.log(rankedStats)

  const result: Record<string, any> = {}

  const solo = rankedStats.queueMap['RANKED_SOLO_5x5']
  const flex = rankedStats.queueMap['RANKED_FLEX_SR']
  const cherry = rankedStats.queueMap['CHERRY']

  if (solo) {
    result.solo = {
      tier: solo.tier,
      division: solo.division
    }
  }

  if (flex) {
    result.flex = {
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

const getWinLoseClassName = (match: SelfParticipantGame) => {
  if (match.game.gameMode === 'PRACTICETOOL') {
    return 'na'
  }

  if (match.selfParticipant.stats.gameEndedInEarlySurrender) {
    return 'na'
  }

  return match.selfParticipant.stats.win ? 'win' : 'lose'
}

const getWinResultText = (match: SelfParticipantGame) => {
  if (match.game.gameMode === 'PRACTICETOOL') {
    return '—'
  }

  if (match.selfParticipant.stats.gameEndedInEarlySurrender) {
    return '重'
  }

  if (match.game.gameMode === 'CHERRY') {
    if (match.selfParticipant.stats.subteamPlacement === 0) {
      return '?'
    }

    return CHINESE_NUMBERS[Math.max(match.selfParticipant.stats.subteamPlacement - 1, 0)]
  }

  return match.selfParticipant.stats.win ? '胜' : '败'
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
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 8px;
  height: 360px;
  border-radius: 4px;
  box-sizing: border-box;
  border: 1px solid #ffffff40;
  background-color: #11111180;
  width: v-bind(FIXED_CARD_WIDTH);
  gap: 4px;

  transition: filter 0.2s;

  &.dimming {
    filter: brightness(0.3);
  }
}

.player-info {
  display: flex;

  .profile-icon {
    position: relative;
    margin-right: 8px;
  }

  .champion {
    width: 42px;
    height: 42px;
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
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: filter 0.3s;
      cursor: pointer;

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

  .position-info {
    display: flex;
    gap: 2px;
    font-size: 16px;
    align-items: center;

    &.complete {
      margin-left: 16px;
    }

    &.incomplete {
      flex: 1;
    }

    .assignment-reason {
      font-size: 11px;
      line-height: 11px;
      color: #ffffff;
      padding: 2px 4px;
      border-radius: 2px;
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

  .gte-55 {
    color: #4cc69d;
  }

  .gt-45-lt-55 {
    color: #dcdcdc;
  }

  .lte-45 {
    color: #ff6161;
  }

  .kda {
    flex: 1;
    font-size: 13px;
    color: #dfdfdf;
    text-align: center;
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

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
      background-color: #64bcff;
      color: #000;
    }

    &.privacy-private {
      background-color: #ca0000;
    }

    &.winning-streak {
      background-color: #59e8b8;
      color: #000;
    }

    &.losing-streak {
      background-color: #ffffff50;
      background-color: #893b3b;
    }

    &.akari-loved {
      color: #ffffff;
      background-color: #dc50af;
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
  height: 28px;
  box-sizing: border-box;
  align-items: center;

  .frequent-used-champion {
    width: 20px;
    height: 20px;
    border-radius: 2px;
  }
}

.match-history {
  display: flex;
  flex: 1;
  width: 100%;
  height: 0;
  gap: 2px;
  // border: 1px dashed white;

  .match-item {
    display: flex;
    align-items: center;
    height: 30px;
    padding: 2px;
    box-sizing: border-box;
    background-color: #ffffff10;
    border-radius: 2px;
    padding-left: 8px;
    border-left: 4px solid;
    transition: filter 0.3s;
    cursor: pointer;
    margin-bottom: 2px;

    &:hover {
      filter: brightness(1.2);
    }

    &.win {
      border-left-color: #4cc69d;

      .win-lose {
        color: #4cc69d;
      }
    }

    &.lose {
      border-left-color: #ff6161;

      .win-lose {
        color: #ff6161;
      }
    }

    &.na {
      border-left-color: #c0c0c0;

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

.tagged-text {
  font-size: 12px;
  white-space: pre-wrap;
  max-width: 260px;
}
</style>
