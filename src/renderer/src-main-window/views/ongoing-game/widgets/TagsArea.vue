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
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in savedInfo.encounteredGames" :key="item.gameId">
              <td
                class="game-id-td"
                @click="
                  () =>
                    ogs.cachedGames[item.gameId]
                      ? emits('showGame', ogs.cachedGames[item.gameId], puuid)
                      : emits('showGameById', item.gameId, puuid)
                "
              >
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
    <NPopover :keep-alive-on-hover="false" v-if="as.settings.isInKyokoMode && analysis" :delay="50">
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
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { SavedInfo, useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { Game } from '@shared/types/league-client/match-history'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import { MatchHistoryGameWithState, MatchHistoryGamesAnalysisAll } from '@shared/utils/analysis'
import { useElementHover } from '@vueuse/core'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'
import { computed, useTemplateRef, watch } from 'vue'

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
</style>
