<template>
  <div class="tabs-wrapper">
    <div class="tabs-header">
      <NTabs
        class="tabs"
        @update:value="handleTabChange"
        :value="mhs.currentTabId ?? undefined"
        type="card"
        :animated="false"
        @close="handleTabClose"
        size="small"
      >
        <NTab
          v-for="tab of mhs.tabs"
          @mouseup.prevent="(event) => handleMouseUp(event, tab.id)"
          @contextmenu="(event) => handleShowMenu(event, tab.id)"
          :key="tab.id"
          :tab="tab.id"
          :name="tab.id"
          :closable="tab.puuid !== lcs.summoner.me?.puuid"
          :draggable="true"
          @dragover.prevent
          @dragstart="() => handleDragStart(tab.id)"
          @dragenter="() => handleDragEnter(tab.id)"
          @drop="() => handleDrop(tab.id)"
          @dragleave="() => handleDragLeaveOrEnd(tab.id)"
          @dragend="() => handleDragLeaveOrEnd(tab.id)"
          class="tab-outer"
        >
          <div class="tab">
            <!-- 在进入游戏时，显示当前召唤师所选择的英雄的图标 -->
            <LcuImage
              v-if="ogs.championSelections?.[tab.puuid]"
              class="tab-icon"
              :src="championIconUrl(ogs.championSelections[tab.puuid])"
            />
            <LcuImage
              v-else-if="tab.summoner"
              class="tab-icon"
              :src="tab.summoner ? profileIconUrl(tab.summoner.profileIconId) : undefined"
            />
            <span class="tab-title-region-name" v-if="tabNames[tab.id]?.regionText"
              >[{{ tabNames[tab.id].regionText }}]</span
            >
            <span class="tab-title-game-name">{{ tabNames[tab.id].gameName }}</span>
            <span class="tab-title-tag-line" v-if="tabNames[tab.id]?.tagLine"
              >#{{ tabNames[tab.id].tagLine }}</span
            >
            <NIcon
              v-if="
                tab.summoner?.puuid !== lcs.summoner.me?.puuid &&
                tab.summoner?.privacy === 'PRIVATE'
              "
              title="隐藏生涯"
              class="privacy-private-icon"
              ><WarningAltFilledIcon
            /></NIcon>
          </div>
        </NTab>
      </NTabs>
      <div class="search-zone" v-if="lcs.connectionState === 'connected'">
        <NPopover
          content-style="padding: 0;"
          raw
          style="max-height: 600px; border-radius: 4px; background-color: rgb(29, 29, 29)"
          :show-arrow="false"
          trigger="click"
          scrollable
          :delay="50"
        >
          <template #trigger>
            <button quaternary class="search-button">
              <NIcon><SearchIcon /></NIcon>查询召唤师
            </button>
          </template>
          <div class="search-panel">
            <!-- <SearchSummoner /> -->
          </div>
        </NPopover>
      </div>
      <NDropdown
        placement="bottom-start"
        trigger="manual"
        size="small"
        :x="menuProps.x"
        :y="menuProps.y"
        :options="dropdownOptions"
        :show="menuProps.show"
        :on-clickoutside="() => (menuProps.show = false)"
        @select="(key) => handleMenuSelect(key)"
      />
    </div>
    <div class="content">
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
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useInstance } from '@renderer-shared/shards'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUrl, profileIconUrl } from '@renderer-shared/shards/league-client/utils'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { Search as SearchIcon, WarningAltFilled as WarningAltFilledIcon } from '@vicons/carbon'
import { NDropdown, NIcon, NPopover, NTab, NTabs } from 'naive-ui'
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
  const { puuid, sgpServerId } = mh.parseUnionId(unionId)
  navigateToTab(puuid, sgpServerId)
}

const tabsRef = useTemplateRef('tabs-ref')

const handleRefresh = async (puuid: string) => {
  if (tabsRef.value) {
    const tab = tabsRef.value.find((t) => t && t.puuid === puuid)
    tab?.refresh()
  }
}

const matchHistoryRoute = computed(() => {
  if (!route.matched.some((record) => record.name === 'match-history')) {
    return null
  }

  const puuid = route.params.puuid as string
  const sgpServerId = route.params.sgpServerId as string

  if (typeof puuid === 'string' && typeof sgpServerId === 'string' && puuid && sgpServerId) {
    return { puuid, sgpServerId }
  }

  return null
})

const tabNames = computed(() => {
  const nameMap: Record<
    string,
    {
      gameName: string
      tagLine: string | null
      regionText: string | null
    }
  > = {}

  // 统计是否只有一种 sgpServerId
  const sgpServerIds = new Set<string>()
  for (const tab of mhs.tabs) {
    sgpServerIds.add(tab.sgpServerId)
  }

  const onlyOneType = sgpServerIds.size === 1

  mhs.tabs.forEach((tab) => {
    if (tab.summoner) {
      if (onlyOneType) {
        nameMap[tab.id] = {
          gameName: tab.summoner.gameName,
          tagLine: tab.summoner.tagLine,
          regionText: null
        }
        return
      }

      // TODO: 目前只支持腾讯服务器, 所以固定为 rso-platforms.ts 中的文本
      const { sgpServerId } = mh.parseUnionId(tab.id)
      const s = sgps.availability.sgpServers.servers[sgpServerId]?.name || sgpServerId

      nameMap[tab.id] = {
        gameName: tab.summoner.gameName,
        tagLine: tab.summoner.tagLine,
        regionText: s
      }
      return
    }

    nameMap[tab.id] = {
      gameName: tab.id,
      tagLine: null,
      regionText: null
    }
  })

  return nameMap
})

// 路由到页面
watch(
  () => matchHistoryRoute.value,
  (route) => {
    if (!route) {
      return
    }

    const unionId = mh.toUnionId(route.puuid, route.sgpServerId)
    const tab = mhs.tabs.find((t) => t.id === unionId)
    if (tab) {
      mhs.setCurrentTab(unionId)
    } else {
      mh.createTab(route.puuid, route.sgpServerId, true)
    }
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

  .search-button {
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
