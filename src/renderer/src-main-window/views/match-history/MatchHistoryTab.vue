<template>
  <div class="player-page">
    <PlayerTagEditModal
      :puuid="tab.puuid"
      :summoner="tab.summoner"
      :tags="tab.tags"
      v-model:show="isShowingTagEditModal"
      @submit="(id) => handleTagEdited(id)"
    />
    <NModal v-model:show="isShowingRankedModal">
      <div class="ranked-modal">
        <div class="blocks">
          <RankedDisplay
            v-for="r of tab.rankedStats?.queueMap"
            :key="r.queueType"
            class="ranked"
            :ranked-entry="r"
          />
        </div>
        <RankedTable v-if="tab.rankedStats" :ranked-stats="tab.rankedStats" />
      </div>
    </NModal>
    <Transition name="fade">
      <div class="player-header-simplified" v-if="shouldShowTinyHeader">
        <div class="header-simplified-inner">
          <LcuImage
            class="small-profile-icon"
            :src="tab.summoner ? profileIconUri(tab.summoner.profileIconId) : undefined"
          />
          <span class="small-game-name">{{ tab.summoner?.gameName }}</span>
          <span class="small-tag-line">#{{ tab.summoner?.tagLine }}</span>
          <div class="header-simplified-actions">
            <NButton
              round
              class="header-button"
              size="small"
              :title="t('MatchHistoryTab.prevPage')"
              @click="handleLoadMatchHistoryPage((tab.matchHistoryPage?.page || 2) - 1)"
              :disabled="
                !tab.matchHistoryPage || tab.matchHistoryPage.page <= 1 || tab.isLoadingMatchHistory
              "
              tertiary
            >
              <template #icon>
                <NIcon><NavigateBeforeOutlinedIcon /></NIcon>
              </template>
            </NButton>
            <NButton
              :title="t('MatchHistoryTab.nextPage')"
              size="small"
              round
              class="header-button"
              @click="handleLoadMatchHistoryPage((tab.matchHistoryPage?.page || 1) + 1)"
              :disabled="!tab.matchHistoryPage || tab.isLoadingMatchHistory"
              tertiary
            >
              <template #icon>
                <NIcon><NavigateNextOutlinedIcon /></NIcon>
              </template>
            </NButton>
            <NButton
              tertiary
              class="header-button"
              :title="t('MatchHistoryTab.refreshPage')"
              size="small"
              round
              :loading="isSomethingLoading"
              @click="() => handleRefresh()"
            >
              <template #icon>
                <NIcon><RefreshIcon /></NIcon>
              </template>
            </NButton>
          </div>
        </div>
      </div>
    </Transition>
    <NScrollbar x-scrollable ref="scroll" @scroll="(e) => handleMainContentScroll(e)">
      <div class="inner-container" ref="inner-container">
        <div class="profile">
          <div class="header-profile">
            <div class="profile-image">
              <LcuImage
                class="profile-image-icon"
                :src="tab.summoner ? profileIconUri(tab.summoner.profileIconId) : undefined"
              />
              <div class="profile-image-lv" v-if="tab.summoner">
                {{ tab.summoner.summonerLevel }}
              </div>
            </div>
            <div class="profile-name">
              <div class="game-name-line">
                <CopyableText
                  class="game-name"
                  :class="{ 'long-name': tab.summoner && tab.summoner.gameName.length >= 12 }"
                  :text="summonerName(tab.summoner?.gameName, tab.summoner?.tagLine, '-')"
                  >{{ tab.summoner?.gameName || '-' }}</CopyableText
                >
                <NPopover v-if="tab.spectatorData && isSmallScreen" display-directive="show">
                  <template #trigger>
                    <IndicatorPulse />
                  </template>
                  <div style="width: 256px">
                    <SpectateStatus
                      :is-cross-region="!isOnSelfSgpServer"
                      :sgp-server-id="tab.sgpServerId"
                      :data="tab.spectatorData"
                      :puuid="tab.puuid"
                      @to-summoner="(puuid) => handleToSummoner(puuid)"
                      @launch-spectator="handleLaunchSpectator"
                    />
                  </div>
                </NPopover>
              </div>
              <span class="tag-line">#{{ tab.summoner?.tagLine || '-' }}</span>
            </div>
          </div>
          <div class="header-ranked" v-if="tab.rankedStats">
            <RankedDisplay
              class="ranked"
              :small="isSmallScreen"
              :ranked-entry="tab.rankedStats?.queueMap['RANKED_SOLO_5x5']"
            />
            <RankedDisplay
              class="ranked"
              :small="isSmallScreen"
              :ranked-entry="tab.rankedStats?.queueMap['RANKED_FLEX_SR']"
            />
            <div class="ranked-more">
              <NButton
                :focusable="false"
                :title="t('MatchHistoryTab.rankedMore')"
                size="small"
                secondary
                @click="isShowingRankedModal = true"
              >
                <template #icon>
                  <MoreHorizFilledIcon />
                </template>
              </NButton>
            </div>
          </div>
          <div class="buttons-container">
            <NButton
              secondary
              class="square-button"
              :title="t('MatchHistoryTab.tagPlayer')"
              @click="handleTagPlayer"
              v-if="!isSelfTab && isOnSelfSgpServer"
            >
              <template #icon>
                <NIcon><EditIcon /></NIcon>
              </template>
            </NButton>
            <NButton
              secondary
              class="square-button"
              :title="t('MatchHistoryTab.refreshPage')"
              :loading="isSomethingLoading"
              @click="handleRefresh"
            >
              <template #icon>
                <NIcon><RefreshIcon /></NIcon>
              </template>
            </NButton>
          </div>
        </div>
        <div class="show-on-smaller-screen">
          <NInputNumber
            size="small"
            placeholder=""
            style="width: 48px"
            v-model:value="inputtingPage"
            @blur="handleInputBlur"
            @keyup.enter="() => handleLoadMatchHistoryPage(inputtingPage || 1)"
            :disabled="tab.isLoadingMatchHistory"
            :min="1"
            :show-button="false"
          />
          <NButton
            size="small"
            :title="t('MatchHistoryTab.prevPage')"
            @click="handleLoadMatchHistoryPage((tab.matchHistoryPage?.page || 2) - 1)"
            :disabled="
              !tab.matchHistoryPage || tab.matchHistoryPage.page <= 1 || tab.isLoadingMatchHistory
            "
            secondary
            >{{ t('MatchHistoryTab.prevPage') }}</NButton
          >
          <NButton
            :title="t('MatchHistoryTab.nextPage')"
            size="small"
            @click="() => handleLoadMatchHistoryPage((tab.matchHistoryPage?.page || 1) + 1)"
            :disabled="tab.isLoadingMatchHistory"
            secondary
            >{{ t('MatchHistoryTab.nextPage') }}</NButton
          >
          <NSelect
            :value="tab.matchHistoryPage?.pageSize"
            @update:value="handleChangePageSize"
            :disabled="tab.isLoadingMatchHistory"
            class="page-select"
            size="small"
            style="width: 108px"
            :options="pageSizeOptions"
            :consistent-menu-width="false"
          ></NSelect>
          <NSelect
            v-if="mhs.settings.matchHistoryUseSgpApi && currentSgpServerSupported.matchHistory"
            size="small"
            :value="tab.matchHistoryPage?.tag || 'all'"
            style="width: 160px"
            @update:value="handleChangeSgpTag"
            :disabled="tab.isLoadingMatchHistory"
            :options="sgpTagOptions"
          ></NSelect>
        </div>
        <div class="content">
          <div class="left">
            <div class="left-content-item">
              <div class="left-content-item-content">
                <div style="display: flex; gap: 4px">
                  <NInputNumber
                    size="small"
                    placeholder=""
                    style="flex: 1"
                    v-model:value="inputtingPage"
                    @blur="handleInputBlur"
                    @keyup.enter="() => handleLoadMatchHistoryPage(inputtingPage || 1)"
                    :disabled="tab.isLoadingMatchHistory"
                    :min="1"
                    :show-button="false"
                  />
                  <NButton
                    size="small"
                    :title="t('MatchHistoryTab.prevPage')"
                    @click="handleLoadMatchHistoryPage((tab.matchHistoryPage?.page || 2) - 1)"
                    :disabled="
                      !tab.matchHistoryPage ||
                      tab.matchHistoryPage.page <= 1 ||
                      tab.isLoadingMatchHistory
                    "
                    secondary
                    >{{ t('MatchHistoryTab.prevPage') }}</NButton
                  >
                  <NButton
                    :title="t('MatchHistoryTab.nextPage')"
                    size="small"
                    @click="handleLoadMatchHistoryPage((tab.matchHistoryPage?.page || 1) + 1)"
                    :disabled="!tab.matchHistoryPage || tab.isLoadingMatchHistory"
                    secondary
                    >{{ t('MatchHistoryTab.nextPage') }}</NButton
                  >
                  <NSelect
                    :value="tab.matchHistoryPage?.pageSize"
                    @update:value="handleChangePageSize"
                    :disabled="tab.isLoadingMatchHistory"
                    class="page-select"
                    size="small"
                    placeholder=""
                    style="width: 86px"
                    :consistent-menu-width="false"
                    :options="pageSizeOptions"
                  ></NSelect>
                </div>
                <NSelect
                  v-if="
                    currentSgpServerSupported.matchHistory && mhs.settings.matchHistoryUseSgpApi
                  "
                  size="small"
                  :value="tab.matchHistoryPage?.tag"
                  @update:value="handleChangeSgpTag"
                  :disabled="tab.isLoadingMatchHistory"
                  style="margin-top: 8px"
                  :options="sgpTagOptions"
                ></NSelect>
              </div>
            </div>
            <div
              class="left-content-item privacy-private"
              v-if="!isSelfTab && tab.summoner && tab.summoner.privacy === 'PRIVATE'"
            >
              <div class="left-content-item-title">{{ t('MatchHistoryTab.private.title') }}</div>
              <div class="left-content-item-content">
                {{ t('MatchHistoryTab.private.content') }}
              </div>
            </div>
            <div
              v-for="tagInfo of tab.tags"
              :key="tagInfo.selfPuuid"
              class="left-content-item tagged-player"
            >
              <div class="left-content-item-title">
                <span> {{ t('MatchHistoryTab.tagged.title') }}</span>
                <span
                  v-if="!tagInfo.markedBySelf"
                  class="marked-by-other"
                  @click="handleToSummoner(tagInfo.selfPuuid)"
                >
                  {{ t('MatchHistoryTab.tagged.taggedByOther') }}
                </span>
                <NPopconfirm
                  type="warning"
                  @positive-click="handleRemoveTag(tagInfo.puuid, tagInfo.selfPuuid)"
                >
                  <template #trigger>
                    <NIcon class="remove-tag">
                      <DeleteIcon />
                    </NIcon>
                  </template>
                  {{ t('MatchHistoryTab.tagged.deletePopconfirm') }}
                </NPopconfirm>
              </div>
              <NScrollbar class="tagged-player-n-scrollbar">
                <div class="left-content-item-content">{{ tagInfo.tag }}</div>
              </NScrollbar>
            </div>
            <div
              class="left-content-item"
              v-if="currentSgpServerSupported.common && tab.spectatorData"
            >
              <SpectateStatus
                :is-cross-region="!isOnSelfSgpServer"
                :sgp-server-id="tab.sgpServerId"
                :data="tab.spectatorData"
                :puuid="tab.puuid"
                @to-summoner="(puuid, setCurrent) => handleToSummoner(puuid, setCurrent)"
                @launch-spectator="handleLaunchSpectator"
              />
            </div>
            <div class="left-content-item" v-if="analysis.matchHistory">
              <div class="left-content-item-title">{{ t('MatchHistoryTab.stats.title') }}</div>
              <div class="left-content-item-content">
                <div class="stat-item" v-if="as.settings.isInKyokoMode" title="Akari's insight">
                  <span class="stat-item-label">{{ t('MatchHistoryTab.stats.akariScore') }}</span>
                  <span class="stat-item-content" :class="{ 'n-a': analysis.akariScore === null }">
                    <template v-if="analysis.akariScore !== null">
                      <LeagueAkariSpan bold :text="analysis.akariScore.total.toFixed(2)" />
                    </template>
                    <template v-else>{{ t('MatchHistoryTab.stats.na') }}</template>
                  </span>
                </div>
                <div class="stat-item">
                  <span class="stat-item-label">{{ t('MatchHistoryTab.stats.avgKda') }}</span>
                  <NPopover>
                    <template #trigger>
                      <span class="stat-item-content">{{
                        analysis.matchHistory.summary.averageKda.toFixed(2)
                      }}</span>
                    </template>
                    {{ analysis.matchHistory.summary.totalKills }} /
                    {{ analysis.matchHistory.summary.totalDeaths }} /
                    {{ analysis.matchHistory.summary.totalAssists }}
                  </NPopover>
                </div>
                <div class="stat-item">
                  <span class="stat-item-label">{{ t('MatchHistoryTab.stats.avgKp') }}</span>
                  <span class="stat-item-content"
                    >{{
                      (analysis.matchHistory.summary.averageKillParticipationRate * 100).toFixed()
                    }}
                    %</span
                  >
                </div>
                <div class="stat-item">
                  <span class="stat-item-label">{{ t('MatchHistoryTab.stats.avgDmg') }}</span>
                  <span class="stat-item-content"
                    >{{
                      (
                        analysis.matchHistory.summary.averageDamageDealtToChampionShareOfTeam * 100
                      ).toFixed()
                    }}
                    %</span
                  >
                </div>
                <div class="stat-item">
                  <span class="stat-item-label">{{ t('MatchHistoryTab.stats.avgDmgTaken') }}</span>
                  <span class="stat-item-content"
                    >{{
                      (analysis.matchHistory.summary.averageDamageTakenShareOfTeam * 100).toFixed()
                    }}
                    %</span
                  >
                </div>
                <div class="stat-item">
                  <span class="stat-item-label">{{ t('MatchHistoryTab.stats.avgGold') }}</span>
                  <span class="stat-item-content"
                    >{{
                      (analysis.matchHistory.summary.averageGoldShareOfTeam * 100).toFixed()
                    }}
                    %</span
                  >
                </div>
                <div class="stat-item">
                  <span class="stat-item-label">{{ t('MatchHistoryTab.stats.avgCs') }}</span>
                  <span class="stat-item-content"
                    >{{
                      (analysis.matchHistory.summary.averageCsShareOfTeam * 100).toFixed()
                    }}
                    %</span
                  >
                </div>
                <div class="stat-item">
                  <span class="stat-item-label">{{ t('MatchHistoryTab.stats.winLose') }}</span>
                  <span class="stat-item-content"
                    >{{ analysis.matchHistory.summary.win }} {{ t('MatchHistoryTab.stats.win') }}
                    {{ analysis.matchHistory.summary.lose }}
                    {{ t('MatchHistoryTab.stats.lose') }} ({{
                      (analysis.matchHistory.summary.winRate * 100).toFixed()
                    }}
                    %)
                  </span>
                </div>
                <div class="stat-item" v-if="frequentlyUsedChampions.length">
                  <span class="stat-item-label">{{ t('MatchHistoryTab.stats.champions') }}</span>
                  <div class="stat-item-content-champions">
                    <NPopover
                      v-for="c of frequentlyUsedChampions"
                      :key="c.id"
                      :delay="50"
                      :keep-alive-on-hover="false"
                    >
                      <template #trigger>
                        <div class="champion-slot">
                          <LcuImage
                            style="width: 100%; height: 100%"
                            :src="championIconUri(c.id)"
                          />
                          <div class="champion-used-count">{{ c.count }}</div>
                        </div>
                      </template>
                      <div class="stat-item-content-champion">
                        <div>
                          {{ lcs.gameData.champions[c.id]?.name }} · {{ c.count }}
                          {{ t('MatchHistoryTab.stats.times') }}
                        </div>
                        <div class="win-lose-box">
                          <span class="win">{{ c.win }} {{ t('MatchHistoryTab.stats.win') }}</span>
                          <span class="lose"
                            >{{ c.lose }} {{ t('MatchHistoryTab.stats.lose') }}</span
                          >
                          <span
                            >({{ t('MatchHistoryTab.stats.wr') }}
                            {{ (c.winRate * 100).toFixed() }} %)</span
                          >
                        </div>
                      </div>
                    </NPopover>
                  </div>
                </div>
              </div>
            </div>
            <div class="left-content-item" v-if="recentlyPlayers.teammates.length">
              <div class="left-content-item-title">
                {{ t('MatchHistoryTab.recentPlayers.teammatesTitle') }}
              </div>
              <div class="left-content-item-content">
                <div
                  class="recently-played-item"
                  v-for="p of recentlyPlayers.teammates"
                  :key="p.targetPuuid"
                >
                  <LcuImage
                    style="width: 18px; height: 18px"
                    :src="profileIconUri(p.targetProfileIconId)"
                  />
                  <div
                    class="name-and-tag"
                    @click="() => handleToSummoner(p.targetPuuid)"
                    @mouseup.prevent="(event) => handleMouseUp(event, p.targetPuuid)"
                    @mousedown="handleMouseDown"
                  >
                    <span class="game-name-line">{{ p.targetGameName }}</span>
                    <span class="tag-line">#{{ p.targetTagLine }}</span>
                  </div>
                  <span class="win-or-lose"
                    >{{ p.win }} {{ t('MatchHistoryTab.recentPlayers.win') }} {{ p.lose }}
                    {{ t('MatchHistoryTab.recentPlayers.lose') }}</span
                  >
                </div>
              </div>
            </div>
            <div class="left-content-item" v-if="recentlyPlayers.opponents.length">
              <div class="left-content-item-title">
                {{ t('MatchHistoryTab.recentPlayers.opponentsTitle') }}
              </div>
              <div class="left-content-item-content">
                <div
                  class="recently-played-item"
                  v-for="p of recentlyPlayers.opponents"
                  :key="p.targetPuuid"
                >
                  <LcuImage
                    style="width: 18px; height: 18px"
                    :src="profileIconUri(p.targetProfileIconId)"
                  />
                  <div
                    class="name-and-tag"
                    @click="() => handleToSummoner(p.targetPuuid)"
                    @mouseup.prevent="(event) => handleMouseUp(event, p.targetPuuid)"
                    @mousedown="handleMouseDown"
                  >
                    <span class="game-name-line">{{ p.targetGameName }}</span>
                    <span class="tag-line">#{{ p.targetTagLine }}</span>
                  </div>
                  <span class="win-or-lose"
                    >{{ p.win }} {{ t('MatchHistoryTab.recentPlayers.win') }} {{ p.lose }}
                    {{ t('MatchHistoryTab.recentPlayers.lose') }}</span
                  >
                </div>
              </div>
            </div>
          </div>
          <div class="right" ref="right">
            <MatchHistoryCard
              class="match-history-card-item"
              @set-show-detailed-game="handleToggleShowDetailedGame"
              @load-detailed-game="(_) => loadDetailedGame(g)"
              @to-summoner="(puuid, setCurrent) => handleToSummoner(puuid, setCurrent)"
              :self-puuid="tab.puuid"
              :is-detailed="g.isDetailed"
              :is-loading="g.isLoading"
              :is-expanded="g.isExpanded"
              :game="g.game"
              v-for="g of tab.matchHistoryPage?.games"
              :key="g.game.gameId"
            />
            <div
              class="match-history-empty-placeholder"
              v-if="!tab.matchHistoryPage || tab.matchHistoryPage.games.length === 0"
            >
              <NSpin v-if="tab.isLoadingMatchHistory" />
              <span v-else>{{ t('MatchHistoryTab.matchHistory.empty') }}</span>
            </div>
          </div>
        </div>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import CopyableText from '@renderer-shared/components/CopyableText.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { GameClientRenderer } from '@renderer-shared/shards/game-client'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri, profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { RiotClientRenderer } from '@renderer-shared/shards/riot-client'
import { SavedPlayerRenderer } from '@renderer-shared/shards/saved-player'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import {
  analyzeMatchHistory,
  analyzeMatchHistoryPlayers,
  calculateAkariScore
} from '@shared/utils/analysis'
import { summonerName } from '@shared/utils/name'
import { Delete as DeleteIcon } from '@vicons/carbon'
import { Edit20Filled as EditIcon } from '@vicons/fluent'
import { RefreshSharp as RefreshIcon } from '@vicons/ionicons5'
import {
  MoreHorizFilled as MoreHorizFilledIcon,
  NavigateBeforeOutlined as NavigateBeforeOutlinedIcon,
  NavigateNextOutlined as NavigateNextOutlinedIcon
} from '@vicons/material'
import { useIntervalFn, useMediaQuery } from '@vueuse/core'
import { toBlob } from 'html-to-image'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NIcon,
  NInputNumber,
  NModal,
  NPopconfirm,
  NPopover,
  NScrollbar,
  NSelect,
  NSpin,
  useMessage,
  useNotification
} from 'naive-ui'
import { computed, markRaw, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import { h } from 'vue'

import PlayerTagEditModal from '@main-window/components/PlayerTagEditModal.vue'
import RankedTable from '@main-window/components/RankedTable.vue'
import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'
import {
  GameDataState,
  TabState,
  useMatchHistoryTabsStore
} from '@main-window/shards/match-history-tabs/store'

import MatchHistoryCard from './card/MatchHistoryCard.vue'
import IndicatorPulse from './widgets/IndicatorPulse.vue'
import RankedDisplay from './widgets/RankedDisplay.vue'
import SpectateStatus from './widgets/SpectateStatus.vue'

const { tab } = defineProps<{
  tab: TabState
}>()

const { t } = useTranslation()

const lc = useInstance<LeagueClientRenderer>('league-client-renderer')
const rc = useInstance<RiotClientRenderer>('riot-client-renderer')
const sgp = useInstance<SgpRenderer>('sgp-renderer')
const mh = useInstance<MatchHistoryTabsRenderer>('match-history-tabs-renderer')
const log = useInstance<LoggerRenderer>('logger-renderer')
const sp = useInstance<SavedPlayerRenderer>('saved-player-renderer')
const gc = useInstance<GameClientRenderer>('game-client-renderer')
const app = useInstance<AppCommonRenderer>('app-common-renderer')

const lcs = useLeagueClientStore()
const mhs = useMatchHistoryTabsStore()
const sgps = useSgpStore()

const notification = useNotification()

const VIEW_NAMESPACE = 'view:MatchHistoryTab'

const currentSgpServerSupported = computed(() => {
  return (
    sgps.availability.sgpServers.servers[tab.sgpServerId] || { common: false, matchHistory: false }
  )
})

const isOnSelfSgpServer = computed(() => {
  return sgps.availability.sgpServerId === tab.sgpServerId
})

const isSelfTab = computed(() => {
  return lcs.summoner.me?.puuid === tab.puuid
})

const analysis = computed(() => {
  const matchHistory = analyzeMatchHistory(tab.matchHistoryPage?.games || [], tab.puuid)
  const players = analyzeMatchHistoryPlayers(tab.matchHistoryPage?.games || [], tab.puuid)

  return {
    matchHistory: matchHistory,
    playerRelationship: players,
    akariScore: matchHistory ? calculateAkariScore(matchHistory) : null
  }
})

const loadSummoner = async () => {
  if (tab.isLoadingSummoner) {
    return
  }

  try {
    tab.isLoadingSummoner = true

    // 在非当前登录服务器的情况下, 需要借用 RC 和 SGP API 来补全召唤师信息 (仅限腾讯服之间)
    if (sgps.availability.sgpServerId !== tab.sgpServerId) {
      if (!sgps.isTokenReady) {
        return
      }

      // 需要 SGP API 支持
      if (currentSgpServerSupported.value.common) {
        const data = await sgp.getSummonerLcuFormat(tab.puuid, tab.sgpServerId)

        if (!data) {
          return
        }

        const { data: ns } = await rc.api.playerAccount.getPlayerAccountNameset([tab.puuid])

        if (ns.namesets.length === 0) {
          throw new Error(t('MatchHistoryTab.summoner404'))
        }

        data.gameName = ns.namesets[0].gnt.gameName
        data.tagLine = ns.namesets[0].gnt.tagLine
        tab.summoner = markRaw(data)
      }
    } else {
      const { data } = await lc.api.summoner.getSummonerByPuuid(tab.puuid)
      tab.summoner = markRaw(data)
    }
  } catch (error: any) {
    notification.warning({
      title: () => t('MatchHistoryTab.failedToLoadTitle'),
      content: () =>
        t('MatchHistoryTab.failedToLoadSummoner', {
          reason: error.message
        }),
      duration: 4000
    })
    log.warn(VIEW_NAMESPACE, '拉取召唤师信息失败', error)
  } finally {
    tab.isLoadingSummoner = false
  }
}

/**
 * 战绩信息, 目前无法在腾讯服务器跨区查询
 */
const loadRankedStats = async () => {
  if (!isOnSelfSgpServer.value) {
    return
  }

  if (tab.isLoadingRankedStats) {
    return
  }

  try {
    tab.isLoadingRankedStats = true
    const { data } = await lc.api.ranked.getRankedStats(tab.puuid)
    tab.rankedStats = markRaw(data)
  } catch (error: any) {
    notification.warning({
      title: () => t('MatchHistoryTab.failedToLoadTitle'),
      content: () =>
        t('MatchHistoryTab.failedToLoadRankedStats', {
          reason: error.message
        }),
      duration: 4000
    })
    log.warn(VIEW_NAMESPACE, '拉取排位信息失败', error)
  } finally {
    tab.isLoadingRankedStats = false
  }
}

const loadSummonerProfile = async () => {
  // TODO try to support SGP API
  if (!isOnSelfSgpServer.value) {
    return
  }

  if (tab.isLoadingSummonerProfile) {
    return
  }

  try {
    tab.isLoadingSummonerProfile = true
    const { data } = await lc.api.summoner.getSummonerProfile(tab.puuid)
    tab.summonerProfile = markRaw(data)
  } catch (error: any) {
    notification.warning({
      title: () => t('MatchHistoryTab.failedToLoadTitle'),
      content: () =>
        t('MatchHistoryTab.failedToLoadSummonerProfile', {
          reason: error.message
        }),
      duration: 4000
    })
    log.warn(VIEW_NAMESPACE, '拉取召唤师信息失败', error)
  } finally {
    tab.isLoadingSummonerProfile = false
  }
}

const loadMatchHistory = async (page?: number, pageSize?: number, tag?: string) => {
  if (tab.isLoadingMatchHistory) {
    return
  }

  page = page || 1
  pageSize = pageSize || tab.matchHistoryPage?.pageSize || 20
  tag = tag || tab.matchHistoryPage?.tag || 'all'

  try {
    tab.isLoadingMatchHistory = true

    // 在优先使用 SGP API 查询战绩时, 且当前的 SGP Server 记录在案, 则使用之
    if (mhs.settings.matchHistoryUseSgpApi && currentSgpServerSupported.value.matchHistory) {
      if (!sgps.isTokenReady) {
        return
      }

      const data = await sgp.getMatchHistoryLcuFormat(
        tab.puuid,
        (page - 1) * pageSize,
        pageSize,
        tag === 'all' ? undefined : tag,
        tab.sgpServerId
      )
      tab.matchHistoryPage = {
        page,
        pageSize,
        tag: tag || 'all',
        source: 'sgp',
        games: data.games.games.map((g) => ({
          isDetailed: true,
          isLoading: false,
          isExpanded: false,
          hasError: false,
          game: markRaw(g)
        }))
      }
    } else {
      // 若否, 则使用 LCU API, 仅限当前登录大区
      if (sgps.availability.sgpServerId === tab.sgpServerId) {
        const { data } = await lc.api.matchHistory.getMatchHistory(
          tab.puuid,
          (page - 1) * pageSize,
          page * pageSize - 1
        )

        tab.matchHistoryPage = {
          page,
          pageSize,
          tag: 'all',
          source: 'lcu',
          games: data.games.games.map((g) => ({
            isDetailed: false,
            isLoading: false,
            isExpanded: false,
            hasError: false,
            game: markRaw(g)
          }))
        }

        const tasks = tab.matchHistoryPage.games.map(async (g) => {
          const cached = mhs.detailedGameLruMap.get(g.game.gameId)
          if (cached) {
            g.game = markRaw(cached)
            g.isDetailed = true
            return
          }

          try {
            g.isLoading = true
            const { data: game } = await lc.api.matchHistory.getGame(g.game.gameId)
            g.game = markRaw(game)
            g.isDetailed = true
            mhs.detailedGameLruMap.set(g.game.gameId, game)
          } catch (error) {
            g.hasError = true
            log.warn(VIEW_NAMESPACE, '拉取详细战绩信息失败', error)
          } finally {
            g.isLoading = false
          }
        })

        await Promise.all(tasks)
      }
    }
  } catch (error: any) {
    notification.warning({
      title: () => t('MatchHistoryTab.failedToLoadTitle'),
      content: () => {
        if (tab.sgpServerId === 'TENCENT_HN1') {
          return t('MatchHistoryTab.failedToLoadMatchHistoryHN1', {
            reason: error.message
          })
        } else {
          return t('MatchHistoryTab.failedToLoadMatchHistory', {
            reason: error.message
          })
        }
      },
      duration: 6000
    })
    log.warn(VIEW_NAMESPACE, '拉取战绩信息失败', error)
  } finally {
    tab.isLoadingMatchHistory = false
  }
}

const loadDetailedGame = async (dataState: GameDataState) => {
  if (dataState.isDetailed || dataState.isLoading) {
    return
  }

  dataState.isLoading = true

  try {
    const cached = mhs.detailedGameLruMap.get(dataState.game.gameId)
    if (cached) {
      dataState.game = markRaw(cached)
      dataState.isDetailed = true
      return
    }

    if (mhs.settings.matchHistoryUseSgpApi && currentSgpServerSupported.value.matchHistory) {
      const data = await sgp.getGameSummaryLcuFormat(dataState.game.gameId, tab.sgpServerId)
      dataState.game = markRaw(data)
      dataState.isDetailed = true
    } else {
      if (sgps.availability.sgpServerId === tab.sgpServerId) {
        const { data } = await lc.api.matchHistory.getGame(dataState.game.gameId)
        dataState.game = markRaw(data)
        dataState.isDetailed = true
      }
    }
  } catch (error: any) {
    notification.warning({
      title: () => t('MatchHistoryTab.failedToLoadTitle'),
      content: () =>
        t('MatchHistoryTab.failedToLoadMatchHistoryGame', {
          reason: error.message
        }),
      duration: 4000
    })
  } finally {
    dataState.isLoading = false
  }
}

const loadTags = async () => {
  if (tab.isLoadingTags) {
    return
  }

  if (!lcs.summoner.me) {
    return
  }

  tab.isLoadingTags

  try {
    const data = await sp.getPlayerTags({
      puuid: tab.puuid,
      selfPuuid: lcs.summoner.me.puuid
    })
    tab.tags = markRaw(data)
  } catch (error: any) {
    notification.warning({
      title: () => t('MatchHistoryTab.failedToLoadTitle'),
      content: () =>
        t('MatchHistoryTab.failedToLoadTags', {
          reason: error.message
        }),
      duration: 4000
    })
  } finally {
    tab.isLoadingTags = false
  }
}

// 1100px - is same in which defined in CSS
const isSmallScreen = useMediaQuery(`(max-width: 1100px)`)

const scrollEl = useTemplateRef('scroll')
const rightEl = useTemplateRef('right')
const innerContainerEl = useTemplateRef('inner-container')

const as = useAppCommonStore()

const handleToggleShowDetailedGame = (gameId: number, expand: boolean) => {
  const thatGame = tab.matchHistoryPage?.games.find((g) => g.game.gameId === gameId)
  if (thatGame) {
    thatGame.isExpanded = expand
  }
}

const isShowingRankedModal = ref(false)

const isSomethingLoading = computed(() => {
  return (
    tab.isLoadingMatchHistory ||
    tab.isLoadingRankedStats ||
    tab.isLoadingSavedInfo ||
    tab.isLoadingSpectatorData ||
    tab.isLoadingSummoner ||
    tab.isLoadingSummonerProfile
  )
})

const scrollToRightElTop = () => {
  if (rightEl.value && innerContainerEl.value) {
    const top = rightEl.value.offsetTop
    const padding = parseInt(window.getComputedStyle(innerContainerEl.value).paddingTop, 10)
    const relativeTop = top - padding

    if (relativeTop && relativeTop < mainContentScrollTop.value) {
      scrollEl.value?.scrollTo({ top: relativeTop })
    }
  }
}

const handleRefresh = async () => {
  try {
    const mhFn = async () => {
      await loadMatchHistory()
      scrollToRightElTop()
    }

    await Promise.all([
      loadSummoner(),
      loadRankedStats(),
      loadSummonerProfile(),
      mhFn(),
      loadTags(),
      updateSpectatorData()
    ])
  } catch {}
}

const handleLoadMatchHistoryPage = async (page?: number) => {
  await loadMatchHistory(page)
  scrollToRightElTop()
}

const inputtingPage = ref(tab.matchHistoryPage?.page)
const handleInputBlur = () => {
  inputtingPage.value = tab.matchHistoryPage?.page
}

const pageSizeOptions = computed(() => [
  {
    label: t('MatchHistoryTab.itemPerPage', { countV: 10 }),
    value: 10
  },
  {
    label: t('MatchHistoryTab.itemPerPage', { countV: 20 }),
    value: 20
  },
  {
    label: t('MatchHistoryTab.itemPerPage', { countV: 30 }),
    value: 30
  },
  {
    label: t('MatchHistoryTab.itemPerPage', { countV: 40 }),
    value: 40
  },
  {
    label: t('MatchHistoryTab.itemPerPage', { countV: 50 }),
    value: 50
  },
  {
    label: t('MatchHistoryTab.itemPerPage', { countV: 100 }),
    value: 100
  },
  {
    label: t('MatchHistoryTab.itemPerPage', { countV: 200 }),
    value: 200
  }
])

const handleChangePageSize = async (pageSize: number) => {
  await loadMatchHistory(tab.matchHistoryPage?.page, pageSize, tab.matchHistoryPage?.tag)
}

watch(
  () => tab.matchHistoryPage?.page,
  (page) => {
    inputtingPage.value = page
  }
)

const sgpTagOptions = computed(() => {
  return [
    {
      label: t('common.sgpMatchHistoryTags.all'),
      value: 'all'
    },
    {
      label: lcs.gameData.queues[420]?.name || t('common.sgpMatchHistoryTags.q_420', 'q_420'),
      value: `q_420`
    },
    {
      label: lcs.gameData.queues[430]?.name || t('common.sgpMatchHistoryTags.q_430', 'q_430'),
      value: `q_430`
    },
    {
      label: lcs.gameData.queues[440]?.name || t('common.sgpMatchHistoryTags.q_440', 'q_440'),
      value: `q_440`
    },
    {
      label: lcs.gameData.queues[450]?.name || t('common.sgpMatchHistoryTags.q_450', 'q_450'),
      value: `q_450`
    },

    {
      label: lcs.gameData.queues[1700]?.name || t('common.sgpMatchHistoryTags.q_1700', 'q_1700'),
      value: 'q_1700'
    },
    {
      label: lcs.gameData.queues[490]?.name || t('common.sgpMatchHistoryTags.q_490', 'q_490'),
      value: `q_490`
    },
    {
      label: lcs.gameData.queues[1900]?.name || t('common.sgpMatchHistoryTags.q_1900', 'q_1900'),
      value: `q_1900`
    },
    {
      label: lcs.gameData.queues[900]?.name || t('common.sgpMatchHistoryTags.q_900', 'q_900'),
      value: `q_900`
    }
  ]
})

const handleChangeSgpTag = async (tag: string) => {
  await loadMatchHistory(tab.matchHistoryPage?.page, tab.matchHistoryPage?.pageSize, tag)
}

const isShowingTagEditModal = ref(false)
const handleTagPlayer = async () => {
  isShowingTagEditModal.value = true
}
const handleTagEdited = async (tag: string | null) => {
  if (!lcs.summoner.me || !lcs.auth) {
    return
  }

  try {
    await sp.updatePlayerTag({
      puuid: tab.puuid,
      selfPuuid: lcs.summoner.me.puuid,
      tag: tag,
      rsoPlatformId: lcs.auth.rsoPlatformId,
      region: lcs.auth.region
    })
    isShowingTagEditModal.value = false

    message.success(() => t('MatchHistoryTab.operationSuccessTitle'))
    await loadTags()
  } catch (error: any) {
    notification.warning({
      title: () => t('MatchHistoryTab.failedToLoadTitle'),
      content: () =>
        t('MatchHistoryTab.failedToUpdateTag', {
          reason: error.message
        }),
      duration: 4000
    })
    log.warn(VIEW_NAMESPACE, '标记玩家失败', error)
  }
}

const handleRemoveTag = async (puuid: string, selfPuuid: string) => {
  try {
    await sp.updatePlayerTag({
      puuid,
      selfPuuid,
      tag: null
    })
    isShowingTagEditModal.value = false

    message.success(() => t('MatchHistoryTab.operationSuccessTitle'))
    await loadTags()
  } catch (error: any) {
    notification.warning({
      title: () => t('MatchHistoryTab.failedToLoadTitle'),
      content: () =>
        t('MatchHistoryTab.failedToDeleteTag', {
          reason: error.message
        }),
      duration: 4000
    })
    log.warn(VIEW_NAMESPACE, '标记玩家失败', error)
  }
}

// 对于使用到 SGP API 的接口, 在 token 准备好后, 再次加载数据
// 仅作为 workaround
watch(
  () => sgps.isTokenReady,
  async (current, prev) => {
    if (current && !prev) {
      const fn1 = async () => {
        if (sgps.availability.sgpServerId !== tab.sgpServerId && tab.summoner === null) {
          await loadSummoner()
        }
      }

      const fn2 = async () => {
        if (
          mhs.settings.matchHistoryUseSgpApi &&
          currentSgpServerSupported.value.matchHistory &&
          tab.matchHistoryPage === null
        ) {
          await loadMatchHistory()
        }
      }

      const fn3 = async () => {
        if (sgps.availability.serversSupported.common && tab.spectatorData === null) {
          await updateSpectatorData()
        }
      }

      await Promise.all([fn1(), fn2(), fn3()])
    }
  }
)

handleRefresh()

const FREQUENT_USE_CHAMPION_THRESHOLD = 1
const RECENTLY_PLAYED_PLAYER_THRESHOLD = 2

const frequentlyUsedChampions = computed(() => {
  const a = analysis.value.matchHistory
  if (!a) {
    return []
  }

  return Object.values(a.champions)
    .filter((c) => c.count >= FREQUENT_USE_CHAMPION_THRESHOLD)
    .sort((a, b) => {
      if (a.count !== b.count) {
        return b.count - a.count
      }

      return b.win - a.win
    })
})

const recentlyPlayers = computed(() => {
  const relationship = analysis.value.playerRelationship

  const processPlayers = (isOpponent: boolean) => {
    return Object.values(relationship)
      .filter((a) => a.games.length >= RECENTLY_PLAYED_PLAYER_THRESHOLD)
      .map((a) => {
        const filteredGames = a.games.filter((g) => g.isOpponent === isOpponent)
        return { ...a, games: filteredGames }
      })
      .filter((a) => a.games.length >= RECENTLY_PLAYED_PLAYER_THRESHOLD)
      .map((a) => {
        const win = a.games.filter((g) => g.win).length
        const lose = a.games.filter((g) => !g.win).length
        return { ...a, win, lose }
      })
      .sort((a, b) => {
        if (a.games.length !== b.games.length) {
          return b.games.length - a.games.length
        }
        return b.win - a.win
      })
  }

  const teammates = processPlayers(false)
  const opponents = processPlayers(true)

  return { teammates, opponents }
})

const { navigateToTabByPuuidAndSgpServerId } = mh.useNavigateToTab()

const handleToSummoner = (puuid: string, setCurrent = true) => {
  if (setCurrent) {
    navigateToTabByPuuidAndSgpServerId(puuid, tab.sgpServerId)
  } else {
    mh.createTab(puuid, tab.sgpServerId, false)
  }
}

const handleMouseDown = (event: MouseEvent) => {
  if (event.button === 1) {
    event.preventDefault()
  }
}

const handleMouseUp = (event: MouseEvent, puuid: string) => {
  if (event.button === 1) {
    handleToSummoner(puuid, false)
  }
}

const SHOW_TINY_HEADER_THRESHOLD = 160
const mainContentScrollTop = ref(0)
const handleMainContentScroll = (e: Event) => {
  mainContentScrollTop.value = (e.target as HTMLElement).scrollTop
}

const shouldShowTinyHeader = computed(() => mainContentScrollTop.value > SHOW_TINY_HEADER_THRESHOLD)

// 从这里开始, 将逐渐移除对全局状态的依赖
const UPDATE_SPECTATOR_DATA_INTERVAL = 60 * 1000 // 1 分钟
const updateSpectatorData = async () => {
  // 仅仅在当前大区支持 SGP API 时才更新
  if (!sgps.availability.serversSupported.common) {
    return
  }

  if (!sgps.isTokenReady) {
    return
  }

  try {
    const data = await sgp.getSpectatorGameflow(tab.puuid, tab.sgpServerId)

    if (data === null) {
      tab.spectatorData = null
      return
    }

    tab.spectatorData = markRaw(data)
  } catch (error) {
    if (
      (error as Error).name === 'AxiosError' &&
      ((error as any).response?.status === 404 || (error as any).response?.status === 400)
    ) {
      tab.spectatorData = null
      return
    }

    // 静默失败, 打印日志
    log.warn(VIEW_NAMESPACE, `获取观战数据失败: ${tab.puuid} ${tab.sgpServerId}`, error)
  }
}
const { resume: resumeSpectator, pause: pauseSpectator } = useIntervalFn(
  updateSpectatorData,
  UPDATE_SPECTATOR_DATA_INTERVAL,
  { immediateCallback: true }
)

watch(
  () => sgps.availability.serversSupported.common,
  (ya) => {
    if (ya) {
      resumeSpectator()
    } else {
      pauseSpectator()
    }
  },
  { immediate: true }
)

const handleLaunchSpectator = async (_: string, useLcuApi: boolean) => {
  try {
    if (useLcuApi) {
      await lc.api.spectator.launchSpectator(tab.puuid)
      notification.success({
        title: () => t('MatchHistoryTab.operationSuccessTitle'),
        content: () => t('MatchHistoryTab.spectatorCalledUp'),
        duration: 4000
      })
    } else {
      if (tab.spectatorData) {
        await gc.launchSpectator({
          locale: 'zh_CN',
          gameId: tab.spectatorData.game.id,
          gameMode: tab.spectatorData.game.gameMode,
          observerEncryptionKey: tab.spectatorData.playerCredentials.observerEncryptionKey,
          observerServerIp: tab.spectatorData.playerCredentials.observerServerIp,
          observerServerPort: tab.spectatorData.playerCredentials.observerServerPort,
          sgpServerId: tab.sgpServerId
        })
        notification.success({
          title: () => t('MatchHistoryTab.operationSuccessTitle'),
          content: () => t('MatchHistoryTab.spectatorCalledUpByCmd'),
          duration: 4000
        })
      }
    }
  } catch (error: any) {
    notification.warning({
      title: () => t('MatchHistoryTab.operationFailedTitle'),
      content: () => t('MatchHistoryTab.failedToCallUpSpectator', { reason: error.message }),
      duration: 4000
    })

    log.warn(VIEW_NAMESPACE, `无法调起客户端进程: ${(error as Error).message}`, error)
  }
}

// workaround: KeepAlive 下 Naive UI 滚动条复位问题
watch(
  () => mhs.currentTabId,
  (tabId) => {
    if (tabId === tab.id) {
      nextTick(() => {
        scrollEl.value?.scrollTo({ top: mainContentScrollTop.value })
      })
    }
  },
  { immediate: true }
)

const message = useMessage()

const handleScreenshot = async () => {
  if (!innerContainerEl.value) {
    return
  }

  try {
    tab.isTakingScreenshot = true

    // 经过测试, 性能非常差
    const blob = await toBlob(innerContainerEl.value, {
      style: {
        margin: '0',
        backgroundColor:
          getComputedStyle(document.documentElement).getPropertyValue(
            '--background-color-primary'
          ) || '#000'
      }
    })

    if (!blob) {
      message.warning(() => t('MatchHistoryTab.failedToTakeScreenshotNoData'))
      return
    }

    await app.writeClipboardImage(await blob.arrayBuffer())
    message.success(() => t('MatchHistoryTab.copiedToClipboard'))
  } catch (error: any) {
    if (error instanceof Error) {
      message.error(() =>
        t('MatchHistoryTab.failedToTakeScreenshot', {
          reason: error.message
        })
      )
    } else {
      message.error(() =>
        t('MatchHistoryTab.failedToTakeScreenshot', {
          reason: ''
        })
      )
    }
  } finally {
    tab.isTakingScreenshot = false
  }
}

defineExpose({
  id: tab.id,
  puuid: tab.puuid,
  sgpServerId: tab.sgpServerId,
  refresh: handleRefresh,
  screenshot: handleScreenshot
})
</script>

<style lang="less" scoped>
@container-width: 1064px;

.player-page {
  position: relative;
  height: 100%;
}

.ranked-modal {
  display: flex;
  align-items: center;
  flex-direction: column;
  border-radius: 4px;
  background-color: rgba(25, 25, 28, 0.98);
  padding: 16px;

  .blocks {
    margin-bottom: 16px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .ranked {
    background-color: #f4f4f40e;
  }
}

.profile {
  display: flex;
  align-items: center;
  height: 140px;
  box-sizing: border-box;
  padding: 20px 20px 12px 20px;
}

.player-header-simplified {
  position: absolute;
  left: 0;
  right: 0;
  height: 64px;
  z-index: 1;
  background-color: rgba(#000, 0.4);
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);

  .header-simplified-inner {
    display: flex;
    align-items: center;
    height: 100%;
    width: @container-width;
    padding: 0 16px;
    box-sizing: border-box;
    margin: 0 auto;

    .small-profile-icon {
      width: 32px;
      height: 32px;
      border-radius: 4px;
    }

    .small-game-name {
      font-size: 16px;
      margin-left: 8px;
    }

    .small-tag-line {
      position: relative;
      top: 2px;
      font-size: 14px;
      margin-left: 6px;
      color: #858585;
    }

    @media (max-width: 1100px) {
      width: 764px;
    }
  }

  .header-simplified-actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }
}

.inner-container {
  height: 100%;
  width: @container-width;
  margin: 0 auto;
  padding: 28px 0 0 0;

  .content {
    display: flex;
  }

  .show-on-smaller-screen {
    display: none;
    padding: 0px 12px;

    @media (max-width: 1100px) {
      display: flex;
      justify-content: flex-end;
      gap: 4px;
    }
  }

  @media (max-width: 1100px) {
    width: 764px;
  }
}

.content .left {
  position: relative;
  flex: 1;
  padding: 12px 0 12px 12px;

  @media (max-width: 1100px) {
    display: none;
  }
}

.left-content-item {
  padding: 8px 16px;
  margin-bottom: 8px;
  background-color: #ffffff10;
  border-radius: 4px;

  .left-content-item-title {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .left-content-item-content {
    font-size: 13px;
    color: #dcdcdc;
  }
}

.left-content-item.privacy-private {
  background-color: #781f1f60;
}

.left-content-item.tagged-player {
  background-color: #00407d60;

  .left-content-item-content {
    white-space: pre-wrap;
  }

  :deep(.tagged-player-n-scrollbar) {
    max-height: 100px;
  }

  .marked-by-other {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    text-decoration: underline;
    transition: color 0.2s;
    cursor: pointer;
    margin-left: 4px;
    align-self: flex-end;

    &:hover {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .remove-tag {
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    margin-left: auto;
    transition: color 0.2s;

    &:hover {
      color: rgba(255, 255, 255, 1);
    }
  }
}

.left-content-item .tagged-by-other-summoner {
  display: flex;
  font-size: 12px;
  color: #858585;
  margin-bottom: 4px;

  .left-span {
    margin-right: 4px;
  }

  .profile-icon {
    width: 16px;
    height: 16px;
    border-radius: 2px;
  }
}

.recently-played-item,
.tagged-by-other-summoner {
  .name-and-tag {
    display: flex;
    align-items: flex-end;
    cursor: pointer;
  }

  .game-name-line {
    font-size: 12px;
    color: #fff;
    margin-left: 4px;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: all 0.2s;
  }

  .tag-line {
    font-size: 11px;
    color: #858585;
    margin-left: 2px;
    transition: all 0.2s;
  }

  .name-and-tag:hover {
    .game-name,
    .tag-line {
      filter: brightness(1.2);
    }
  }
}

.content .right {
  padding: 12px 12px;

  .right-content-title {
    display: flex;
    align-items: center;
    height: 40px;
    font-size: 22px;
    font-weight: bold;
    margin-bottom: 16px;
    color: #dcdcdc;
  }

  .match-history-empty-placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    width: 740px;
    background-color: #ffffff05;
    color: rgb(83, 83, 83);
  }

  .match-history-card-item {
    margin-bottom: 4px;
  }
}

.header-profile {
  display: flex;
  flex: 1;
  height: 64px;

  .profile-image {
    position: relative;
    width: 64px;
    height: 64px;
  }

  .profile-image .profile-image-icon {
    width: 100%;
    height: 100%;
    border-radius: 4px;
    margin-bottom: 2px;
  }

  .profile-image .profile-image-lv {
    font-size: 10px;
    color: #fff;
    position: absolute;
    bottom: -4px;
    right: -4px;
    background-color: #00000060;
    padding: 2px 4px;
    border-radius: 4px;
  }

  .profile-name {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-self: center;
    margin-left: 12px;

    .game-name-line {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .profile-name .game-name {
    font-size: 20px;
    color: #fff;
    font-weight: bold;
  }

  .profile-name .game-name.long-name {
    font-size: 14px;
  }

  .profile-name .tag-line {
    position: relative;
    font-size: 14px;
    color: #858585;
  }
}

.header-ranked {
  position: relative;
  display: flex;
  gap: 12px;

  .ranked-more {
    position: absolute;
    bottom: -6px;
    right: -8px;
  }

  .ranked {
    background-color: #ffffff04;
  }
}

.stat-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  .stat-item-label {
    font-size: 12px;
    color: #a2a2a2;
  }

  .stat-item-content {
    margin-left: auto;
    font-size: 13px;
    color: #fff;
    text-align: right;

    &.n-a {
      filter: brightness(0.6);
    }
  }

  .stat-item-content-champions {
    max-width: 110px;
    margin-left: auto;
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    justify-content: end;

    .champion-slot {
      position: relative;
      width: 20px;
      height: 20px;
    }

    .champion-used-count {
      position: absolute;
      bottom: -4px;
      right: -2px;
      font-size: 10px;
      color: #d3d3d3;
      background-color: #00000060;
      padding: 0 2px;
      border-radius: 2px;
    }
  }
}

.recently-played-item {
  display: flex;
  align-items: center;

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  .win-or-lose {
    margin-left: auto;
    font-size: 12px;
    color: #acacac;
  }
}

.buttons-container {
  display: flex;
  margin-left: 32px;
  gap: 8px;
  justify-content: flex-end;
}

.square-button {
  width: 42px;
  height: 42px;
}

.header-button {
  width: 32px;
  height: 32px;
}

.stat-item-content-champion {
  font-size: 12px;

  .win-lose-box {
    display: flex;
    gap: 4px;
    margin-top: 2px;
  }

  .win {
    color: #239b23;
  }

  .lose {
    color: #c76713;
  }
}
</style>
