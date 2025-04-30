<template>
  <div class="match-history-tabs-title">
    <SearchSummonerModal v-model:show="searchSummonerModalShow" @to-summoner="handleToSummoner" />
    <NDropdown
      placement="bottom-start"
      trigger="manual"
      :show="contextMenuState.show"
      :x="contextMenuState.x"
      :y="contextMenuState.y"
      :options="contextMenuOptions"
      @clickoutside="contextMenuState.show = false"
      size="small"
      @select="handleContextMenuSelect"
      :theme-overrides="{ color: '#222e', fontSizeSmall: '13px', optionHeightSmall: '26px' }"
    />
    <template v-if="lcs.isConnected">
      <NScrollbar
        :class="$style['scroll-bar']"
        x-scrollable
        :content-class="$style['scroll-bar-content']"
        @wheel="handleWheel"
        ref="scrollbar"
      >
        <div class="mh-tabs">
          <NPopover
            :disabled="true || contextMenuState.show"
            v-for="(tab, index) of mhs.tabs"
            :key="tab.id"
            ref="tabs-ref"
            :delay="1000"
          >
            <template #trigger>
              <div
                class="tab"
                :data-id="tab.id"
                draggable="true"
                :class="{
                  active: mhs.currentTabId === tab.id,
                  'drag-hover': currentDragHoverTabId === tab.id
                }"
                @contextmenu="handleContextMenu($event, tab.id)"
                @click="handleTabChange(tab.id)"
                @mouseup="handleMouseUp($event, tab.id)"
                @dragstart="handleTabDragStart($event, tab.id)"
                @drop="handleTabDrop($event, tab.id)"
                @dragover="handleTabDragOver($event, tab.id)"
                @dragleave="handleTagDragLeave($event, tab.id)"
                @dragend="handleTagDragEnd($event, tab.id)"
              >
                <NBadge
                  dot
                  :show="tab.spectatorData !== null"
                  :size="4"
                  color="#00ff00"
                  processing
                  :offset="[-20, 2]"
                >
                  <Transition name="fade" mode="out-in">
                    <NSpin v-if="tabLoadingStateMap[tab.id]" :size="12" class="tab-icon" />
                    <ChampionIcon
                      class="tab-icon"
                      v-else-if="ogs.championSelections && ogs.championSelections[tab.puuid]"
                      :stretched="false"
                      :champion-id="ogs.championSelections[tab.puuid]"
                    />
                    <LcuImage
                      class="tab-icon"
                      v-else-if="tab.summoner"
                      :src="profileIconUri(tab.summoner.profileIconId)"
                    />
                    <div v-else class="tab-icon tab-icon-placeholder"></div>
                  </Transition>
                </NBadge>
                <div class="sgp-server" v-if="isNeedToShowSgpServer">
                  {{
                    sgps.sgpServerConfig.serverNames[as.settings.locale]?.[tab.sgpServerId] ||
                    tab.sgpServerId
                  }}
                </div>
                <template v-if="tab.summoner">
                  <StreamerModeMaskedText>
                    <template #masked>
                      <div class="summoner-name">
                        <span class="game-name-line">{{ summonerName(tab.puuid, index) }}</span>
                      </div>
                    </template>
                    <div class="summoner-name">
                      <span class="game-name-line">{{ tab.summoner.gameName }}</span>
                      <span class="tag-line"> #{{ tab.summoner.tagLine }}</span>
                    </div>
                  </StreamerModeMaskedText>
                </template>
                <template v-else-if="tabLoadingStateMap[tab.id]">
                  <span class="empty-placeholder-text"
                    >{{ t('MatchHistoryTabsTitle.loading') }}.</span
                  >
                </template>
                <template v-else>
                  <span class="empty-placeholder-text">{{ tab.id.slice(0, 16) }}...</span>
                </template>
                <NIcon @click.stop="mhs.closeTab(tab.id)" class="close-icon"><CloseIcon /></NIcon>
              </div>
            </template>
            <!-- TODO 提供一个悬停查看 -->
            <div class="tab-popover">{{ 'placeholder' }}</div>
          </NPopover>
        </div>
      </NScrollbar>
      <div class="divider" />
      <NPopconfirm
        :disabled="!as.settings.streamerMode || warningShown"
        @positive-click="handleShowSearchSummonerModalInPopconfirm"
        :positive-button-props="{
          type: 'warning',
          size: 'tiny'
        }"
        :negative-button-props="{
          size: 'tiny'
        }"
      >
        <template #trigger>
          <div
            class="search-area"
            @click="(!as.settings.streamerMode || warningShown) && (searchSummonerModalShow = true)"
          >
            <NIcon class="search-icon"><SearchIcon /></NIcon>
            <span class="search-label">{{ t('MatchHistoryTabsTitle.search') }}</span>
          </div>
        </template>
        {{ t('MatchHistoryTabsTitle.searchButtonStreamerModeWarning') }}
      </NPopconfirm>
    </template>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import StreamerModeMaskedText from '@renderer-shared/components/StreamerModeMaskedText.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useStreamerModeMaskedText } from '@renderer-shared/compositions/useStreamerModeMaskedText'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { Close as CloseIcon, Search as SearchIcon } from '@vicons/carbon'
import { Screenshot20Regular as Screenshot20RegularIcon } from '@vicons/fluent'
import { CloseRound as CloseRoundIcon, RefreshRound as RefreshRoundIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NBadge, NDropdown, NIcon, NPopconfirm, NPopover, NScrollbar, NSpin } from 'naive-ui'
import { DropdownMixedOption } from 'naive-ui/es/dropdown/src/interface'
import { computed, h, nextTick, reactive, ref, useTemplateRef, watch } from 'vue'

import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'
import { TabState, useMatchHistoryTabsStore } from '@main-window/shards/match-history-tabs/store'

import SearchSummonerModal from '../search-summoner-modal/SearchSummonerModal.vue'

const { t } = useTranslation()

const mhs = useMatchHistoryTabsStore()
const sgps = useSgpStore()
const ogs = useOngoingGameStore()
const lcs = useLeagueClientStore()
const mh = useInstance(MatchHistoryTabsRenderer)
const as = useAppCommonStore()

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
    tab.isLoadingSummoner ||
    tab.isLoadingSummonerProfile
  )
}

const tabLoadingStateMap = computed(() => {
  const map: Record<string, boolean> = {}
  for (const tab of mhs.tabs) {
    map[tab.id] = isTabLoading(tab)
  }

  return map
})

const { navigateToTab, navigateToTabByPuuidAndSgpServerId } = mh.useNavigateToTab()

const handleTabChange = async (unionId: string) => {
  navigateToTab(unionId)
}

const alignTabToVisibleArea = (tabId: string) => {
  const tabEl = document.querySelector(`.tab[data-id="${tabId}"]`)
  // @ts-ignore
  const parentEl = scrollBarEl.value?.scrollbarInstRef?.wrapperRef as HTMLElement

  if (!tabEl || !parentEl) {
    return
  }

  const tabRect = tabEl.getBoundingClientRect()
  const parentRect = parentEl.getBoundingClientRect()

  if (tabRect.left < parentRect.left) {
    tabEl.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start'
    })
  } else if (tabRect.right > parentRect.right) {
    tabEl.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'end'
    })
  }
}

const AKARI_MIME_TYPE = 'x-league-akari-tab-drag'
const currentDragHoverTabId = ref<string | null>(null)

const handleTabDragStart = (event: DragEvent, id: string) => {
  event.dataTransfer?.setData(AKARI_MIME_TYPE, id)
  contextMenuState.show = false
}

const handleTabDragOver = (event: DragEvent, id: string) => {
  event.preventDefault()
  currentDragHoverTabId.value = id
}

const handleTagDragEnd = (_event: DragEvent, _id: string) => {
  currentDragHoverTabId.value = null
}

const handleTagDragLeave = (_event: DragEvent, _id: string) => {
  currentDragHoverTabId.value = null
}

const handleTabDrop = (event: DragEvent, id: string) => {
  const fromId = event.dataTransfer?.getData(AKARI_MIME_TYPE)
  if (fromId) {
    mhs.moveTabBefore(fromId, id)
    nextTick(() => mhs.currentTabId && alignTabToVisibleArea(mhs.currentTabId))
  }

  currentDragHoverTabId.value = null
}

const handleContextMenu = (event: MouseEvent, id: string) => {
  event.preventDefault()

  contextMenuState.show = false

  // 根据 naive-ui 的官方用例
  // 但不加 nextTick 似乎也没问题
  nextTick(() => {
    const height =
      getComputedStyle(document.documentElement).getPropertyValue('--title-bar-height') || '0'
    contextMenuState.x = event.clientX
    contextMenuState.y = event.clientY - parseInt(height)
    contextMenuState.show = true
    contextMenuState.id = id
  })
}

const contextMenuState = reactive({
  x: 0,
  y: 0,
  show: false,
  id: ''
})

const contextMenuOptions: DropdownMixedOption[] = reactive([
  {
    label: computed(() => t('MatchHistoryTabsTitle.refresh')),
    key: 'refresh',
    disabled: computed(() => {
      const tab = mhs.tabs.find((t) => t.id === contextMenuState.id)
      if (tab) {
        return isTabLoading(tab)
      }

      return true
    }),
    icon: () => h(NIcon, null, { default: () => h(RefreshRoundIcon) })
  },
  {
    type: 'divider',
    key: 'divider-1'
  },
  {
    label: computed(() => t('MatchHistoryTabsTitle.close')),
    key: 'close',
    icon: () => h(NIcon, null, { default: () => h(CloseRoundIcon) })
  },
  {
    label: computed(() => t('MatchHistoryTabsTitle.closeOthers')),
    key: 'close-others',
    disabled: computed(() => !mhs.canCloseOtherTabs(contextMenuState.id))
  },
  {
    label: computed(() => t('MatchHistoryTabsTitle.closeToTheRight')),
    key: 'close-to-the-right',
    disabled: computed(() => !mhs.canCloseTabsToTheRight(contextMenuState.id))
  },
  {
    type: 'divider',
    key: 'divider-2'
  },
  {
    label: computed(() => t('MatchHistoryTabsTitle.screenshot')),
    key: 'screenshot',
    disabled: computed(() => {
      const tab = mhs.tabs.find((t) => t.id === contextMenuState.id)
      if (tab) {
        return tab.isTakingScreenshot || tab.id !== mhs.currentTabId
      }

      return true
    }),
    icon: () => h(NIcon, null, { default: () => h(Screenshot20RegularIcon) })
  }
])

const handleContextMenuSelect = (key: string) => {
  switch (key) {
    case 'refresh':
      mh.events.emit('refresh-tab', contextMenuState.id)
      break
    case 'close':
      mhs.closeTab(contextMenuState.id)
      break
    case 'close-others':
      mhs.closeOtherTabs(contextMenuState.id)
      break
    case 'close-to-the-right':
      mhs.closeToTheRight(contextMenuState.id)
      break
    case 'screenshot':
      mh.events.emit('screenshot-tab', contextMenuState.id)
  }

  contextMenuState.show = false
}

// 是否需要显示服务器的名称
// - 当存在多个不同服务器
// - 仅剩的服务器不是当前服务器
const isNeedToShowSgpServer = computed(() => {
  const count: Record<string, number> = {}
  for (const tab of mhs.tabs) {
    if (count[tab.sgpServerId]) {
      count[tab.sgpServerId]++
    } else {
      count[tab.sgpServerId] = 1
    }
  }

  return Object.keys(count).length > 1 || !count[sgps.availability.sgpServerId]
})

// 一些情况下需要隐藏右键菜单, 比如页面不存在
watch(
  () => contextMenuState.id,
  (id) => {
    if (!id || !mhs.tabs.some((t) => t.id === id)) {
      contextMenuState.show = false
    }
  }
)

// 保证活动页面始终在可视区域内
watch(
  () => mhs.currentTabId,
  (current) => {
    if (!current) {
      return
    }

    nextTick(() => alignTabToVisibleArea(current))
  },
  { immediate: true }
)

const currentTabSummoner = computed(() => {
  return mhs.tabs.find((t) => t.id === mhs.currentTabId)?.summoner
})

// 保证更新后的活动页面也在可视区域内
watch(
  () => currentTabSummoner.value,
  (summoner) => {
    if (summoner) {
      nextTick(() => mhs.currentTabId && alignTabToVisibleArea(mhs.currentTabId))
    }
  }
)

const handleToSummoner = (puuid: string, sgpServerId: string, setCurrent = true) => {
  if (setCurrent) {
    searchSummonerModalShow.value = false
    navigateToTabByPuuidAndSgpServerId(puuid, sgpServerId)
  } else {
    // 先路由
    mh.createTab(puuid, sgpServerId, false)
  }
}

let warningShown = false
const handleShowSearchSummonerModalInPopconfirm = () => {
  searchSummonerModalShow.value = true
  warningShown = true
}

const { summonerName } = useStreamerModeMaskedText()
</script>

<style lang="less" scoped>
.match-history-tabs-title {
  display: flex;
  align-items: center;
  height: 100%;
}

.mh-tabs {
  display: flex;
  padding-top: 4px;
  box-sizing: border-box;
  flex: 1;
  height: 100%;
  align-items: center;
  width: max-content;
  gap: 1px;
}

.tab {
  height: 100%;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0 4px 0 8px;
  box-sizing: border-box;
  border-top-left-radius: 2px;
  border-top-right-radius: 2px;
  cursor: pointer;
  user-select: none;
  transition:
    background-color 0.2s,
    filter 0.2s;
  line-height: 1;
  filter: brightness(0.7);
  box-sizing: border-box;
  border: 1px solid rgba(0, 0, 0, 0);

  &:hover {
    filter: brightness(0.8);
  }

  .tab-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 4px;
    width: 16px;
    height: 16px;
  }

  .tab-icon-placeholder {
    border-radius: 2px;
  }

  .close-icon {
    margin-left: 4px;
    font-size: 16px;
    cursor: pointer;
    border-radius: 2px;
    transition: background-color 0.2s;
  }

  .sgp-server {
    font-size: 11px;
    font-weight: bold;
    margin-right: 4px;
  }

  .summoner-name {
    display: flex;
    align-items: flex-end;
  }

  .empty-placeholder-text {
    font-size: 12px;
  }

  .game-name-line {
    font-size: 12px;
    font-weight: bold;
    margin-right: 4px;
  }

  .tag-line {
    font-size: 11px;
  }

  &.active {
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    filter: brightness(1);
  }

  &.drag-hover {
    filter: brightness(0.8);
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
  border-radius: 2px;
  height: 24px; // same as tab height
  box-sizing: border-box;
  cursor: pointer;
  line-height: 1;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    color 0.2s;

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
}

[data-theme='dark'] {
  .tab {
    background-color: rgba(255, 255, 255, 0.05);

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .tab-icon-placeholder {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .close-icon {
      color: rgba(255, 255, 255, 0.8);

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }

    .sgp-server {
      color: rgba(174, 245, 219, 0.8);
    }

    .empty-placeholder-text {
      color: rgba(255, 255, 255, 0.8);
    }

    .game-name-line {
      color: rgba(255, 255, 255, 1);
    }

    .tag-line {
      color: rgba(255, 255, 255, 0.8);
    }

    &.active {
      background-color: rgba(255, 255, 255, 0.12);
    }

    &.drag-hover {
      background-color: rgba(255, 255, 255, 0.4);
    }
  }

  .search-area {
    padding: 0px 12px 0px 10px;
    border: 1px solid rgba(255, 255, 255, 0);

    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);

    &:hover {
      border-color: rgba(255, 255, 255, 0.4);
      color: rgba(255, 255, 255, 1);
    }

    &:active {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }

  .divider {
    background-color: rgba(255, 255, 255, 0.15);
  }
}

[data-theme='light'] {
  .tab {
    background-color: rgba(0, 0, 0, 0.1);

    &:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }

    .tab-icon-placeholder {
      background-color: rgba(0, 0, 0, 0.1);
    }

    .close-icon {
      color: rgba(0, 0, 0, 0.8);

      &:hover {
        background-color: rgba(0, 0, 0, 0.2);
      }
    }

    .sgp-server {
      color: rgba(111, 151, 136, 0.9);
    }

    .empty-placeholder-text {
      color: rgba(0, 0, 0, 0.8);
    }

    .game-name-line {
      color: rgba(0, 0, 0, 1);
    }

    .tag-line {
      color: rgba(0, 0, 0, 0.8);
    }

    &.active {
      background-color: rgba(0, 0, 0, 0);
      border-top: 1px solid rgba(0, 0, 0, 0.2);
      border-left: 1px solid rgba(0, 0, 0, 0.2);
      border-right: 1px solid rgba(0, 0, 0, 0.2);
    }

    &.drag-hover {
      background-color: rgba(0, 0, 0, 0.4);
    }
  }

  .search-area {
    padding: 0px 12px 0px 10px;
    border: 1px solid rgba(0, 0, 0, 0);

    background-color: rgba(0, 0, 0, 0.1);
    color: rgba(0, 0, 0, 0.8);

    &:hover {
      border-color: rgba(0, 0, 0, 0.4);
      color: rgba(0, 0, 0, 1);
    }

    &:active {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }

  .divider {
    background-color: rgba(0, 0, 0, 0.15);
  }
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
    position: relative;
    bottom: -4px;
    height: 4px;
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
