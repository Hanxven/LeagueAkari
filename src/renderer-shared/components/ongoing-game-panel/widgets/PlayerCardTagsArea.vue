<template>
  <div class="tags">
    <div class="tag self" v-if="isSelf && ogs.frontendSettings.playerCardTags.showSelfTag">
      {{ t('PlayerInfoCard.self') }}
    </div>
    <NPopover
      v-if="
        ogs.frontendSettings.playerCardTags.showTaggedTag && savedInfo && !isSelf && savedInfo.tag
      "
      :delay="50"
      style="max-height: 240px"
    >
      <template #trigger>
        <div class="tag tagged">{{ t('PlayerInfoCard.tagged') }}</div>
      </template>
      <div class="tagged-text" style="max-width: 260px">
        {{ savedInfo.tag }}
      </div>
    </NPopover>
    <NPopover
      v-if="ogs.frontendSettings.playerCardTags.showPremadeTeamTag && premadeTeamId"
      :delay="50"
      style="max-height: 240px"
    >
      <template #trigger>
        <div
          class="tag"
          :style="{
            backgroundColor: premadeTeamId
              ? PREMADE_TEAM_COLORS[premadeTeamId]?.foregroundColor
              : '#ffffff40',
            color: PREMADE_TEAM_COLORS[premadeTeamId]?.color || '#fff'
          }"
          ref="premade-tag-el"
        >
          {{
            t('PlayerInfoCard.premade', {
              team: premadeTeamId
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{ t('PlayerInfoCard.premadePopover', { team: premadeTeamId }) }}
      </div>
    </NPopover>
    <NPopover
      :keep-alive-on-hover="false"
      :delay="50"
      v-if="
        ogs.frontendSettings.playerCardTags.showWinRateTeamTag &&
        analysis &&
        analysis.summary.count >= 16 &&
        analysis.summary.winRate >= 0.85
      "
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
      v-if="
        ogs.frontendSettings.playerCardTags.showMetTag &&
        savedInfo &&
        savedInfo.lastMetAt &&
        !isSelf
      "
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
              <th>{{ t('PlayerInfoCard.metPopover.gameStats') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in encounteredGames" :key="item.gameId">
              <td
                class="game-id-td"
                @click="
                  () =>
                    ogs.cachedGames[item.gameId]
                      ? emits('showGame', ogs.cachedGames[item.gameId], puuid)
                      : emits('showGameById', item.gameId, puuid)
                "
              >
                <div class="game-id-tag">
                  {{
                    t('PlayerInfoCard.metPopover.inspectByGameId', {
                      gameId: masked(
                        item.gameId.toString(),
                        (index + 1).toString().padStart(6, '●')
                      )
                    })
                  }}
                </div>
              </td>
              <td>
                {{ dayjs(item.updateAt).format('MM-DD HH:mm:ss') }} ({{
                  dayjs(item.updateAt).locale(as.settings.locale.toLowerCase()).fromNow()
                }})
              </td>
              <td>
                <template v-if="item.gameStats">
                  <div class="game-stats">
                    <span class="win-result" :class="item.gameStats.selfWinResult">{{
                      t(`PlayerInfoCard.metPopover.winResult.${item.gameStats.selfWinResult}`)
                    }}</span>
                    <span
                      v-if="item.gameStats.myPlacement"
                      class="win-result"
                      :class="item.gameStats.selfWinResult"
                    >
                      ({{ formatI18nOrdinal(item.gameStats.myPlacement, as.settings.locale) }})
                    </span>
                    <span
                      class="team"
                      :class="{
                        teammate: item.gameStats.sameTeam,
                        opponent: !item.gameStats.sameTeam
                      }"
                      >{{
                        item.gameStats.sameTeam
                          ? t(`PlayerInfoCard.metPopover.team.teammate`)
                          : t(`PlayerInfoCard.metPopover.team.opponent`)
                      }}</span
                    >
                    <PositionIcon
                      class="position-icon"
                      v-if="item.gameStats.selfPosition"
                      :position="item.gameStats.selfPosition"
                    />
                    <LcuImage
                      class="champion-icon"
                      :src="championIconUri(item.gameStats.selfChampionId)"
                    />
                    <div class="kda">
                      <span>{{ item.gameStats.selfKda.k }}</span>
                      <span>/</span>
                      <span>{{ item.gameStats.selfKda.d }}</span>
                      <span>/</span>
                      <span>{{ item.gameStats.selfKda.a }}</span>
                    </div>
                    <div class="divider"></div>
                    <span
                      v-if="item.gameStats.opponentPlacement"
                      class="win-result"
                      :class="item.gameStats.opponentWinResult"
                    >
                      ({{
                        formatI18nOrdinal(item.gameStats.opponentPlacement, as.settings.locale)
                      }})
                    </span>
                    <PositionIcon
                      class="position-icon"
                      v-if="item.gameStats.opponentPosition"
                      :position="item.gameStats.opponentPosition"
                    />
                    <LcuImage
                      class="champion-icon"
                      :src="championIconUri(item.gameStats.opponentChampionId)"
                    />
                    <div class="kda">
                      <span>{{ item.gameStats.opponentKda.k }}</span>
                      <span>/</span>
                      <span>{{ item.gameStats.opponentKda.d }}</span>
                      <span>/</span>
                      <span>{{ item.gameStats.opponentKda.a }}</span>
                    </div>
                  </div>
                </template>
                <template v-else>—</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </NPopover>
    <NPopover
      :keep-alive-on-hover="false"
      v-if="
        ogs.frontendSettings.playerCardTags.showPrivacyTag &&
        summoner?.privacy === 'PRIVATE' &&
        !isSelf
      "
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
      v-if="
        ogs.frontendSettings.playerCardTags.showWinningStreakTag &&
        analysis &&
        analysis.summary.winningStreak >= 3
      "
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
      v-if="
        ogs.frontendSettings.playerCardTags.showLosingStreakTag &&
        analysis &&
        analysis.summary.losingStreak >= 3
      "
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
      v-if="
        ogs.frontendSettings.playerCardTags.showGreatPerformanceTag &&
        analysis &&
        (analysis.akariScore.good || analysis.akariScore.great)
      "
      :delay="50"
    >
      <template #trigger>
        <div class="tag akari-loved" v-if="analysis.akariScore.good">
          {{ t('PlayerInfoCard.akariLoved.good') }}
        </div>
        <div class="tag akari-loved" v-else-if="analysis.akariScore.great">
          {{ t('PlayerInfoCard.akariLoved.great') }}
        </div>
      </template>
      <div class="popover-text" v-if="analysis.akariScore.good">
        {{ t('PlayerInfoCard.akariLoved.goodPopover') }}
      </div>
      <div class="popover-text" v-else-if="analysis.akariScore.great">
        {{ t('PlayerInfoCard.akariLoved.greatPopover') }}
      </div>
    </NPopover>
    <NPopover
      :keep-alive-on-hover="false"
      v-if="
        ogs.frontendSettings.playerCardTags.showSuspiciousFlashPositionTag &&
        isSuspiciousFlashPosition &&
        isSuspiciousFlashPosition.isSuspicious
      "
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
      v-if="
        ogs.frontendSettings.playerCardTags.showSoloDeathsTag &&
        soloKills &&
        soloKills.count >= Math.min(ogs.settings.gameTimelineLoadCount, 3) &&
        soloKills.avgSoloDeathsInEarlyGame >= SOLO_DEATHS_THRESHOLD
      "
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
        ({{ soloKills.details.map((d) => d.soloDeathsBefore.length).join(', ') }})
      </div>
    </NPopover>
    <NPopover
      :keep-alive-on-hover="false"
      v-if="
        ogs.frontendSettings.playerCardTags.showSoloKillsTag &&
        soloKills &&
        soloKills.count >= Math.min(ogs.settings.gameTimelineLoadCount, 3) &&
        soloKills.avgSoloKillsInEarlyGame >= SOLO_KILLS_THRESHOLD
      "
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
        ({{ soloKills.details.map((d) => d.soloKillsBefore.length).join(', ') }})
      </div>
    </NPopover>
    <NPopover
      :keep-alive-on-hover="false"
      v-if="ogs.frontendSettings.playerCardTags.showAverageTeamDamageTag && analysis"
      :delay="50"
    >
      <template #trigger>
        <div class="tag team-damage-share">
          {{
            t('PlayerInfoCard.teamDamageShare', {
              rate: (analysis.summary.averageDamageDealtToChampionShareOfTeam * 100).toFixed(0)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('PlayerInfoCard.teamDamageSharePopover', {
            rate: (analysis.summary.averageDamageDealtToChampionShareOfTeam * 100).toFixed(2),
            countV: analysis.summary.count
          })
        }}
      </div>
    </NPopover>
    <NPopover
      :keep-alive-on-hover="false"
      v-if="ogs.frontendSettings.playerCardTags.showAverageTeamDamageTag && analysis"
      :delay="50"
    >
      <template #trigger>
        <div class="tag team-damage-taken-share">
          {{
            t('PlayerInfoCard.teamDamageTakenShare', {
              rate: (analysis.summary.averageDamageTakenShareOfTeam * 100).toFixed(0)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('PlayerInfoCard.teamDamageTakenSharePopover', {
            rate: (analysis.summary.averageDamageTakenShareOfTeam * 100).toFixed(2),
            countV: analysis.summary.count
          })
        }}
      </div>
    </NPopover>
    <NPopover
      :keep-alive-on-hover="false"
      v-if="ogs.frontendSettings.playerCardTags.showAverageTeamDamageTag && analysis"
      :delay="50"
    >
      <template #trigger>
        <div class="tag team-gold-share">
          {{
            t('PlayerInfoCard.teamGoldShare', {
              rate: (analysis.summary.averageGoldShareOfTeam * 100).toFixed(0)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('PlayerInfoCard.teamGoldSharePopover', {
            rate: (analysis.summary.averageGoldShareOfTeam * 100).toFixed(2),
            countV: analysis.summary.count
          })
        }}
      </div>
    </NPopover>
    <NPopover
      :keep-alive-on-hover="false"
      v-if="ogs.frontendSettings.playerCardTags.showAverageDamageGoldEfficiencyTag && analysis"
      :delay="50"
    >
      <template #trigger>
        <div class="tag damage-gold-efficiency">
          {{
            t('PlayerInfoCard.damageGoldEfficiency', {
              rate: (analysis.summary.averageDamageGoldEfficiency * 100).toFixed(0)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('PlayerInfoCard.damageGoldEfficiencyPopover', {
            rate: (analysis.summary.averageDamageGoldEfficiency * 100).toFixed(2),
            countV: analysis.summary.count
          })
        }}
      </div>
    </NPopover>
    <NPopover
      :keep-alive-on-hover="false"
      v-if="
        ogs.frontendSettings.playerCardTags.showAverageEnemyMissingPingsTag &&
        analysis &&
        analysis.summary.averageEnemyMissingPings !== null
      "
      :delay="50"
    >
      <template #trigger>
        <div class="tag enemy-missing-pings">
          {{
            t('PlayerInfoCard.enemyMissingPings', {
              countV: truncateTailingZeros(analysis.summary.averageEnemyMissingPings)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('PlayerInfoCard.enemyMissingPingsPopover', {
            countV: analysis.summary.averageEnemyMissingPings.toFixed(3)
          })
        }}
      </div>
    </NPopover>
    <NPopover
      :keep-alive-on-hover="false"
      v-if="ogs.frontendSettings.playerCardTags.showAverageVisionScoreTag && analysis"
      :delay="50"
    >
      <template #trigger>
        <div class="tag vision-score">
          {{
            t('PlayerInfoCard.visionScore', {
              countV: truncateTailingZeros(analysis.summary.averageVisionScore)
            })
          }}
        </div>
      </template>
      <div class="popover-text">
        {{
          t('PlayerInfoCard.visionScorePopover', {
            countV: analysis.summary.averageVisionScore.toFixed(3)
          })
        }}
      </div>
    </NPopover>
    <NPopover
      :keep-alive-on-hover="false"
      v-if="
        as.settings.isInKyokoMode &&
        ogs.frontendSettings.playerCardTags.showAkariScoreTag &&
        analysis
      "
      :delay="50"
    >
      <template #trigger>
        <div class="tag akari-loved">Akari {{ analysis.akariScore.total.toFixed(1) }}</div>
      </template>
      <div class="popover-text">
        <div style="font-weight: bold">Akari Score: {{ analysis.akariScore.total.toFixed(1) }}</div>
        <div
          style="
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            row-gap: 2px;
            column-gap: 16px;
            margin-top: 4px;
          "
        >
          <div>Dmg: {{ analysis.akariScore.dmgScore.toFixed(2) }}</div>
          <div>Taken: {{ analysis.akariScore.dmgTakenScore.toFixed(2) }}</div>
          <div>Gold: {{ analysis.akariScore.goldScore.toFixed(2) }}</div>
          <div>CS: {{ analysis.akariScore.csScore.toFixed(2) }}</div>
          <div>K/P: {{ analysis.akariScore.participationScore.toFixed(2) }}</div>
          <div>KDA: {{ analysis.akariScore.kdaScore.toFixed(2) }}</div>
          <div>W/R: {{ analysis.akariScore.winRateScore.toFixed(2) }}</div>
        </div>
      </div>
    </NPopover>
  </div>
</template>

<script lang="ts" setup>
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import { useStreamerModeMaskedText } from '@renderer-shared/compositions/useStreamerModeMaskedText'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { SavedInfo, useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { formatI18nOrdinal } from '@shared/i18n'
import { Game } from '@shared/types/league-client/match-history'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import { MatchHistoryGameWithState, MatchHistoryGamesAnalysisAll } from '@shared/utils/analysis'
import { useElementHover } from '@vueuse/core'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'
import { computed, onDeactivated, useTemplateRef, watch } from 'vue'

import { PREMADE_TEAM_COLORS } from '../ongoing-game-utils'

const { puuid, analysis, matchHistory, premadeTeamId, summoner, savedInfo } = defineProps<{
  puuid: string
  isSelf?: boolean
  premadeTeamId?: string
  currentHighlightingPremadeTeamId?: string | null
  summoner?: SummonerInfo
  matchHistory?: MatchHistoryGameWithState[]
  analysis?: MatchHistoryGamesAnalysisAll
  savedInfo?: SavedInfo
}>()

const emits = defineEmits<{
  showGame: [game: Game, selfPuuid: string]
  showGameById: [gameId: number, selfPuuid: string]
  highlight: [premadeTeamId: string, boolean]
}>()

const { t } = useTranslation()

const ogs = useOngoingGameStore()
const as = useAppCommonStore()

const SOLO_DEATHS_THRESHOLD = 2
const SOLO_KILLS_THRESHOLD = 2
const EARLY_GAME_THRESHOLD_MINUTES = 14

const premadeTagElHovering = useElementHover(useTemplateRef('premade-tag-el'))
watch(
  () => premadeTagElHovering.value,
  (hovering) => {
    if (premadeTeamId) {
      emits('highlight', premadeTeamId, hovering)
    }
  }
)

const soloKills = computed(() => {
  if (!analysis || !matchHistory) {
    return null
  }

  if (
    !ogs.frontendSettings.playerCardTags.showSoloKillsTag &&
    !ogs.frontendSettings.playerCardTags.showSoloDeathsTag
  ) {
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

const encounteredGames = computed(() => {
  if (!savedInfo) {
    return []
  }

  const mapped = savedInfo.encounteredGames.map((record) => {
    const game = ogs.cachedGames[record.gameId]

    if (!game) {
      return { gameStats: null, ...record }
    }

    const sI = game.participantIdentities.find((p) => p.player.puuid === record.selfPuuid)
    const hI = game.participantIdentities.find((p) => p.player.puuid === record.puuid)

    if (!sI || !hI) {
      return { gameStats: null, ...record }
    }

    const s = game.participants.find((par) => par.participantId === sI.participantId)
    const h = game.participants.find((par) => par.participantId === hI.participantId)

    if (!s || !h) {
      return { gameStats: null, ...record }
    }

    // for cherry mode, all players are placed in the same team
    const sameTeam =
      game.gameMode === 'CHERRY'
        ? s.stats.playerSubteamId === h.stats.playerSubteamId
        : s.teamId === h.teamId

    let selfWinResult: string
    if (game.endOfGameResult === 'Abort_AntiCheatExit') {
      selfWinResult = 'abort'
    } else if (s.stats.gameEndedInEarlySurrender) {
      selfWinResult = 'remake'
    } else {
      selfWinResult = s.stats.win ? 'win' : 'lose'
    }

    let opponentWinResult: string
    if (game.endOfGameResult === 'Abort_AntiCheatExit') {
      opponentWinResult = 'abort'
    } else if (h.stats.gameEndedInEarlySurrender) {
      opponentWinResult = 'remake'
    } else {
      opponentWinResult = h.stats.win ? 'win' : 'lose'
    }

    const selfChampionId = s.championId
    const opponentChampionId = h.championId

    const date = game.gameCreation

    const selfKda = { k: s.stats.kills, d: s.stats.deaths, a: s.stats.assists }
    const opponentKda = { k: h.stats.kills, d: h.stats.deaths, a: h.stats.assists }

    // FOR SGP ONLY
    const selfPosition = s.stats.teamPosition || null
    const opponentPosition = h.stats.teamPosition || null

    return {
      gameStats: {
        gameId: game.gameId,
        selfChampionId,
        opponentChampionId,
        selfPosition,
        opponentPosition,
        selfWinResult,
        opponentWinResult,
        selfKda,
        opponentKda,
        sameTeam,
        date,
        mode: game.gameMode,
        myPlacement: s.stats.subteamPlacement,
        opponentPlacement: h.stats.subteamPlacement
      },
      ...record
    }
  })

  return mapped
})

const truncateTailingZeros = (num: number, precision = 1) => {
  const str = num.toFixed(precision)
  const trimmed = str.replace(/\.?0+$/, '')
  return trimmed
}

const { masked } = useStreamerModeMaskedText()

onDeactivated(() => {
  if (premadeTeamId) {
    emits('highlight', premadeTeamId, false)
  }
})
</script>

<style lang="less" scoped>
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

    &.team-damage-share {
      background-color: #692723;
    }

    &.team-damage-taken-share {
      background-color: #135225;
    }

    &.team-gold-share {
      background-color: #a73d2a;
    }

    &.damage-gold-efficiency {
      background-color: #8f411e;
    }

    &.enemy-missing-pings {
      background-color: #e7da30;
      color: #000;
    }

    &.vision-score {
      background-color: #2451a6;
    }
  }
}

.popover-text {
  font-size: 12px;
  max-width: 240px;
}

.popover-text.have-met-popover {
  max-width: unset;
  width: min-content;
}

.tagged-text {
  font-size: 12px;
  white-space: pre-wrap;
  max-width: 260px;
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
    padding: 2px 8px;
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

  .game-id-tag {
    padding: 2px 4px;
    line-height: 12px;
    font-size: 12px;
    background-color: #ffffff20;
    border-radius: 2px;
  }

  .game-stats {
    display: flex;
    gap: 4px;
    align-items: center;

    .champion-icon {
      width: 16px;
      height: 16px;
    }

    .position-icon {
      font-size: 16px;
    }

    .team,
    .win-result {
      font-size: 12px;
      line-height: 12px;
      font-weight: bold;
    }

    .team {
      margin-right: 8px;

      &.teammate {
        color: #4cc69d;
      }

      &.opponent {
        color: #ff6161;
      }
    }

    .win-result {
      &.win {
        color: #4cc69d;
      }

      &.lose {
        color: #ff6161;
      }

      &.abort,
      &.remake {
        color: #c0c0c0;
      }
    }

    .kda {
      color: #fffb;
      font-size: 11px;
      display: flex;
      gap: 2px;
    }

    .divider {
      margin: 0 4px;
      width: 1px;
      height: 12px;
      background-color: #ffffff40;
    }
  }
}
</style>
