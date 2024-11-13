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
            v-for="tab of mhs.tabs"
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
                  :show="tab.spectatorData !== null"
                  dot
                  :size="4"
                  color="#00ff00"
                  processing
                  :offset="[-20, 2]"
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
                    <div v-else class="tab-icon tab-icon-placeholder"></div>
                  </Transition>
                </NBadge>
                <div class="sgp-server" v-if="isNeedToShowSgpServer">
                  {{ sgps.availability.sgpServers.servers[tab.sgpServerId].name }}
                </div>
                <template v-if="tab.summoner">
                  <div class="summoner-name">
                    <span class="game-name-line">{{ tab.summoner.gameName }}</span>
                    <span class="tag-line"> #{{ tab.summoner.tagLine }}</span>
                  </div>
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
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri, profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { Close as CloseIcon, Search as SearchIcon } from '@vicons/carbon'
import { NBadge, NDropdown, NIcon, NPopover, NScrollbar, NSpin } from 'naive-ui'
import { DropdownMixedOption } from 'naive-ui/es/dropdown/src/interface'
import { computed, nextTick, reactive, ref, useTemplateRef, watch } from 'vue'

import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'
import { TabState, useMatchHistoryTabsStore } from '@main-window/shards/match-history-tabs/store'

import SearchSummonerModal from '../search-summoner-modal/SearchSummonerModal.vue'

const mhs = useMatchHistoryTabsStore()
const sgps = useSgpStore()
const ogs = useOngoingGameStore()
const lcs = useLeagueClientStore()
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
    tab.isLoadingSummoner ||
    tab.isLoadingSummonerProfile
  )
}

const { navigateToTab, navigateToTabByPuuidAndSgpServerId } = mh.useNavigateToTab()

const handleTabChange = async (unionId: string) => {
  navigateToTab(unionId)
}

const alignTabToVisibleArea = (tabId: string) => {
  const tabEl = document.querySelector(`.tab[data-id="${tabId}"]`)
  const parentEl = scrollBarEl.value?.$el.nextElementSibling as HTMLElement

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
    label: '刷新',
    key: 'refresh',
    disabled: computed(() => {
      const tab = mhs.tabs.find((t) => t.id === contextMenuState.id)
      if (tab) {
        return isTabLoading(tab)
      }

      return true
    })
  },
  {
    label: '关闭',
    key: 'close'
  },
  {
    label: '关闭其他页面',
    key: 'close-others',
    disabled: computed(() => !mhs.canCloseOtherTabs(contextMenuState.id))
  },
  {
    label: '关闭右侧页面',
    key: 'close-to-the-right',
    disabled: computed(() => !mhs.canCloseTabsToTheRight(contextMenuState.id))
  },
  {
    type: 'divider',
    key: 'divider-1'
  },
  {
    label: '截图当前页面',
    key: 'screenshot',
    disabled: computed(() => {
      const tab = mhs.tabs.find((t) => t.id === contextMenuState.id)
      if (tab) {
        return tab.isTakingScreenshot || tab.id !== mhs.currentTabId
      }

      return true
    })
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
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  cursor: pointer;
  user-select: none;
  transition:
    background-color 0.2s,
    filter 0.2s;
  line-height: 1;
  filter: brightness(0.55);

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
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
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
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

  .sgp-server {
    font-size: 11px;
    font-weight: bold;
    color: rgba(174, 245, 219, 0.8);
    margin-right: 4px;
  }

  .summoner-name {
    display: flex;
    align-items: flex-end;
  }

  .empty-placeholder-text {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
  }

  .game-name-line {
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
    background-color: rgba(255, 255, 255, 0.12);
  }

  &.drag-hover {
    filter: brightness(0.8);
    background-color: rgba(255, 255, 255, 0.4);
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
