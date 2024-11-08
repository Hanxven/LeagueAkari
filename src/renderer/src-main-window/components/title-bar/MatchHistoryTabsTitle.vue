<template>
  <div class="match-history-tabs-title">
    <template v-if="lcs.isConnected">
      <SearchSummonerModal v-model:show="searchSummonerModalShow" />
      <NScrollbar
        :class="$style['scroll-bar']"
        x-scrollable
        :content-class="$style['scroll-bar-content']"
        @wheel="handleWheel"
        ref="scrollbar"
      >
        <div class="mh-tabs">
          <NPopover v-for="tab of mhs.tabs" :key="tab.id">
            <template #trigger>
              <div
                class="tab"
                :class="{ active: mhs.currentTabId === tab.id }"
                @click="handleTabChange(tab.id)"
                @mouseup="handleMouseUp($event, tab.id)"
              >
                <Transition name="fade" mode="out-in">
                  <NSpin v-if="isTabLoading(tab)" :size="12" class="tab-icon" />
                  <LcuImage
                    class="tab-icon"
                    v-else-if="ogs.championSelections && ogs.championSelections[tab.puuid]"
                    :src="championIconUri(ogs.championSelections[tab.puuid])"
                  />
                  <LcuImage
                    class="tab-icon"
                    v-else-if="tab.summoner"
                    :src="profileIconUri(tab.summoner.profileIconId)"
                  />
                  <div v-else class="tab-icon"></div>
                </Transition>
                <template v-if="tab.summoner">
                  <div class="summoner-name">
                    <span class="game-name">{{ tab.summoner.gameName }}</span>
                    <span class="tag-line"> #{{ tab.summoner.tagLine }}</span>
                  </div>
                </template>
                <template v-else>
                  <span>{{ tab.id.slice(0, 16) }}...</span>
                </template>
                <NIcon @click.stop="mhs.closeTab(tab.id)" class="close-icon"><CloseIcon /></NIcon>
              </div>
            </template>
            <div class="tab-popover">{{ tab.summoner?.puuid || tab.id }}</div>
          </NPopover>
        </div>
      </NScrollbar>
      <div class="divider" />
      <div class="search-area" @click="searchSummonerModalShow = true">
        <NIcon class="search-icon"><SearchIcon /></NIcon>
        <span class="search-label">搜索玩家</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri, profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { Close as CloseIcon, Search as SearchIcon } from '@vicons/carbon'
import { NIcon, NPopover, NScrollbar, NSpin } from 'naive-ui'
import { ref, useTemplateRef } from 'vue'

import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'
import { TabState, useMatchHistoryTabsStore } from '@main-window/shards/match-history-tabs/store'

import SearchSummonerModal from '../search-summoner-modal/SearchSummonerModal.vue'

const mhs = useMatchHistoryTabsStore()
const ogs = useOngoingGameStore()
const lcs = useLeagueClientStore()
const lc = useInstance<LeagueClientRenderer>('league-client-renderer')
const mh = useInstance<MatchHistoryTabsRenderer>('match-history-tabs-renderer')

const scrollBarEl = useTemplateRef('scrollbar')

const handleWheel = (e: WheelEvent) => {
  scrollBarEl.value?.scrollBy({
    left: e.deltaY * 0.75 // 这个速度会舒服一点
  })
}

const searchSummonerModalShow = ref(false)

const handleMouseUp = (event: MouseEvent, unionId: string) => {
  if (event.button === 1) {
    mhs.closeTab(unionId)
  }
}

const isTabLoading = (tab: TabState) => {
  return (
    tab.isLoadingMatchHistory ||
    tab.isLoadingRankedStats ||
    tab.isLoadingSavedInfo ||
    tab.isLoadingSpectatorData ||
    tab.isLoadingSummoner
  )
}

const { navigateToTab } = mh.useNavigateToTab()

const handleTabChange = async (unionId: string) => {
  navigateToTab(unionId)
}
</script>

<style lang="less" scoped>
.match-history-tabs-title {
  display: flex;
  align-items: center;
  height: 100%;
}

.mh-tabs {
  display: flex;
  flex: 1;
  width: 0;
  height: 100%;
  align-items: center;
  width: max-content;
  gap: 2px;
}

.tab {
  height: 24px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0 4px 0 8px;
  box-sizing: border-box;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
  line-height: 1;
  filter: brightness(0.55);

  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  .tab-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 4px;
    width: 16px;
    height: 16px;
  }

  .close-icon {
    margin-left: 4px;
    font-size: 16px;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    border-radius: 2px;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }

  .summoner-name {
    display: flex;
    align-items: flex-end;
  }

  .game-name {
    font-size: 12px;
    font-weight: bold;
    color: rgba(255, 255, 255, 1);
    margin-right: 4px;
  }

  .tag-line {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.8);
  }

  &.active {
    filter: brightness(1);
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.tab-popover {
  font-size: 12px;
  font-weight: bold;
}

.search-area {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  -webkit-app-region: no-drag;
  padding: 0px 12px 0px 10px;
  border: 1px solid rgba(255, 255, 255, 0);
  border-radius: 2px;
  height: 24px; // same as tab height
  box-sizing: border-box;
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  line-height: 1;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    color 0.2s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.4);
    color: rgba(255, 255, 255, 1);
  }

  &:active {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .search-icon {
    font-size: 12px;
    margin-right: 4px;
    transition: color 0.2s;
  }

  .search-label {
    font-size: 12px;
    transition: color 0.2s;
  }
}

.divider {
  width: 1px;
  height: 40%;
  box-sizing: border-box;
  margin: 0 8px;
  background-color: rgba(255, 255, 255, 0.15);
}
</style>

<style lang="less" module>
.scroll-bar {
  height: 100%;
  display: flex;
  align-items: center;

  :global(.n-scrollbar-container) {
    width: auto;
    -webkit-app-region: no-drag;
  }

  :global(.n-scrollbar-rail.n-scrollbar-rail--horizontal) {
    height: 4px;
  }

  :global(.n-scrollbar-rail.n-scrollbar-rail--horizontal .n-scrollbar-rail__scrollbar) {
    height: 2px;
  }
}

.scroll-bar-content {
  height: 100%;
  min-width: 0 !important;
}

.fade-enter-active {
  position: relative;
  transition: opacity 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
}

.fade-enter-to {
  opacity: 1;
}
</style>
