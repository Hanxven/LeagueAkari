<template>
  <div class="tabs-wrapper">
    <template v-if="mhs.currentTabId">
      <MatchHistoryTab
        v-for="tab of mhs.tabs"
        :key="tab.id"
        :tab="tab"
        :sgpServerId="tab.sgpServerId"
        v-show="tab.id === mhs.currentTab?.id"
        ref="tabs-ref"
      />
    </template>
    <div v-else class="tabs-placeholder">
      <div class="centered">
        <LeagueAkariSpan bold class="akari-text" />
        <div
          v-if="lcs.connectionState !== 'connected'"
          style="font-size: 14px; font-weight: normal; color: #666; margin-top: 8px"
        >
          未连接到客户端
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useInstance } from '@renderer-shared/shards'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { computed, reactive, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// import SearchSummoner from '@main-window/components/search-summoner/SearchSummoner.vue'
import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'
import { useMatchHistoryTabsStore } from '@main-window/shards/match-history-tabs/store'

import MatchHistoryTab from './MatchHistoryTab.vue'

const lcs = useLeagueClientStore()

const route = useRoute()
const router = useRouter()

const ogs = useOngoingGameStore()
const sgps = useSgpStore()
const mhs = useMatchHistoryTabsStore()

const mh = useInstance<MatchHistoryTabsRenderer>('match-history-tabs-renderer')

const handleTabClose = (id: string) => {
  mhs.closeTab(id)
}

const { navigateToTab } = mh.useNavigateToTab()

const handleTabChange = async (unionId: string) => {
  navigateToTab(unionId)
}

const tabsRef = useTemplateRef('tabs-ref')

const handleRefresh = async (puuid: string) => {
  if (tabsRef.value) {
    const tab = tabsRef.value.find((t) => t && t.puuid === puuid)
    tab?.refresh()
  }
}

const matchHistoryRoute = computed(() => {
  if (route.name !== 'match-history') {
    return null
  }

  const puuid = route.params.puuid as string
  const sgpServerId = route.params.sgpServerId as string

  if (typeof puuid === 'string' && typeof sgpServerId === 'string' && puuid && sgpServerId) {
    return { puuid, sgpServerId }
  }

  return null
})

// 路由到页面
watch(
  () => matchHistoryRoute.value,
  (route) => {
    if (!route) {
      return
    }

    mh.setCurrentOrCreateTab(route.puuid, route.sgpServerId)
  },
  { immediate: true }
)

// 页面到路由
watch(
  () => mhs.currentTabId,
  (id) => {
    if (!id) {
      router.replace({ name: 'match-history' })
      return
    }

    // 保持路由同步
    if (matchHistoryRoute.value) {
      const tabId = mh.toUnionId(matchHistoryRoute.value.puuid, matchHistoryRoute.value.sgpServerId)

      if (id !== tabId) {
        const { sgpServerId, puuid } = mh.parseUnionId(id)
        router.replace({
          name: 'match-history',
          params: { puuid, sgpServerId }
        })
      }
    }
  },
  { immediate: true }
)

const menuProps = reactive({
  x: 0,
  y: 0,
  show: false,
  id: '',
  dragging: null as string | null,
  hover: null as string | null
})

const handleDragStart = (id: string) => {
  menuProps.dragging = id
}

const handleDragEnter = (id: string) => {
  menuProps.hover = id
}

const handleDragLeaveOrEnd = (_id: string) => {
  menuProps.hover = null
}

const handleDrop = (id: string) => {
  if (id === menuProps.dragging) {
    return
  }

  const tab = mhs.getTab(id)

  if (tab) {
    // TODO DEBUG MOVE TAB
    // mh.moveTab(menuProps.dragging!, id)
  }

  menuProps.dragging = null
}

const dropdownOptions = reactive([
  {
    label: '刷新',
    key: 'refresh',
    disabled: computed(() => {
      const tab = mhs.tabs.find((t) => t.id === menuProps.id)
      if (tab) {
        return (
          tab.isLoadingMatchHistory ||
          tab.isLoadingRankedStats ||
          tab.isLoadingSummoner ||
          tab.isLoadingSpectatorData
        )
      }

      return true
    })
  },
  {
    label: '关闭',
    key: 'close',
    disabled: computed(() => {
      return mhs.getTab(menuProps.id)?.pinned
    })
  },
  {
    label: '关闭其他',
    key: 'close-others',
    disabled: computed(() => !mhs.canCloseOtherTabs(menuProps.id)) // TODO 设置其他
  }
])

const handleMouseUp = (event: PointerEvent, unionId: string) => {
  if (event.button === 1) {
    mhs.closeTab(unionId)
  }
}

const handleMenuSelect = (action: string) => {
  switch (action) {
    case 'refresh':
      handleRefresh(menuProps.id)
      break
    case 'close':
      mhs.closeTab(menuProps.id)
      break
    case 'close-others':
      mhs.closeOtherTabs(menuProps.id)
      break
  }
  menuProps.show = false
}

const handleShowMenu = (e: PointerEvent, puuid: string) => {
  e.preventDefault()
  menuProps.show = true
  menuProps.x = e.clientX
  menuProps.y = e.clientY - 30 /* 30 = title-bar-height */
  menuProps.id = puuid
}
</script>

<style lang="less" scoped>
.tabs-wrapper {
  height: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
}

.tabs-header {
  display: flex;
  max-width: 100%;
  z-index: 5;
  // border-bottom: 1px solid #2b2b2b;

  :deep(.n-tabs-tab) {
    --n-tab-padding: 4px 8px;
    --n-tab-border-radius: 0px;
    border: none;
    transition: none;
  }

  :deep(.n-tabs-tab-pad) {
    --n-tab-gap: 2px;
  }

  :deep(.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.tab-outer) {
    transition: background-color 0.3s;
  }

  :deep(.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.tab-outer:hover) {
    background-color: rgba(255, 255, 255, 0.075);
  }

  :deep(.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.tab-outer) {
    height: 26px;
  }

  :deep(.n-tabs .n-tabs-nav.n-tabs-nav--top.n-tabs-nav--card-type .n-tabs-pad) {
    border-bottom: none;
  }

  .tabs {
    flex-grow: 1;
    width: 0;
  }

  .search-zone {
    width: 120px;
    vertical-align: bottom;
  }

  .search-area {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    box-sizing: border-box;
    font-size: 12px;
    height: 22px;
    outline: none;
    border: none;
    border-radius: 2px;
    width: 108px;
    background-color: rgba(255, 255, 255, 0.06);
    margin: 2px auto;
    color: rgb(99, 226, 183);
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.15);
    }

    &:active {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
}

.content {
  position: relative;
  flex: 1;
  height: 0;
}

:deep(.n-tabs-tab.n-tabs-tab--active) {
  .tab-title-tag-line {
    margin-left: 4px;
    font-size: 13px;
    color: var(--n-tab-text-color-active);
  }
}

.tab {
  display: flex;
  align-items: center;
  line-height: normal;

  .tab-icon {
    width: 16px;
    height: 16px;
    border-radius: 2px;
  }

  .tab-title-region-name {
    margin-left: 4px;
    font-size: 13px;
  }

  .tab-title-game-name {
    margin-left: 4px;
    font-size: 13px;
    font-weight: bold;
  }

  .tab-title-tag-line {
    margin-left: 4px;
    font-size: 13px;
    color: #a8a8a8;
  }

  .privacy-private-icon {
    position: relative;
    top: 1px;
    font-size: 13px;
    margin-left: 4px;
    color: rgb(206, 52, 52);
  }
}

.tabs-placeholder {
  height: 100%;
  display: flex;
  position: relative;

  .akari-text {
    font-size: 22px;
  }
}

.centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
