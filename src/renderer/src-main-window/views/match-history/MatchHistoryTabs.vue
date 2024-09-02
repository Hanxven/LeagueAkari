<template>
  <div class="tabs-wrapper">
    <div class="tabs-header">
      <NTabs
        class="tabs"
        @update:value="handleTabChange"
        :value="mh.currentTab?.id"
        type="card"
        :animated="false"
        @close="handleTabClose"
        size="small"
      >
        <NTab
          v-for="tab of mh.tabs"
          @mousedown="(event) => handleMouseDown(event, tab.id)"
          @contextmenu="(event) => handleShowMenu(event, tab.id)"
          :key="tab.id"
          :tab="tabNames[tab.id]"
          :name="tab.id"
          :closable="tab.data.puuid !== summoner.me?.puuid"
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
              v-if="cf.ongoingChampionSelections?.[tab.id]"
              class="tab-icon"
              :src="championIconUrl(cf.ongoingChampionSelections?.[tab.id])"
            />
            <LcuImage
              v-else-if="tab.data.summoner"
              class="tab-icon"
              :src="tab.data.summoner ? profileIconUrl(tab.data.summoner.profileIconId) : undefined"
            />
            <span class="tab-title" :class="{ 'temporary-tab': tab.isTemporary }">{{
              tabNames[tab.id]
            }}</span>
            <NIcon
              v-if="tab.id !== summoner.me?.puuid && tab.data.summoner?.privacy === 'PRIVATE'"
              title="隐藏生涯"
              class="privacy-private-icon"
              ><WarningAltFilledIcon
            /></NIcon>
          </div>
        </NTab>
      </NTabs>
      <div class="search-zone" v-if="lc.state === 'connected'">
        <NPopover
          content-style="padding: 0;"
          raw
          style="max-height: 600px; border-radius: 4px; background-color: rgb(29, 29, 29)"
          :show-arrow="false"
          trigger="click"
          scrollable
        >
          <template #trigger>
            <button quaternary class="search-button">
              <NIcon><SearchIcon /></NIcon>查询召唤师
            </button>
          </template>
          <div class="search-panel">
            <SearchSummoner />
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
      <template v-if="mh.currentTab">
        <MatchHistoryTab
          v-for="t of mh.tabs"
          :key="t.id"
          v-show="t.id === mh.currentTab.id"
          :is-self="mh.currentTab.data.puuid === summoner.me?.puuid"
          :tab="{ id: t.id, ...(t.data as TabState) }"
          ref="tabsRef"
        />
      </template>
      <div v-else class="tabs-placeholder">
        <div class="centered">
          <LeagueAkariSpan bold class="akari-text" />
          <div
            v-if="lc.state !== 'connected'"
            style="font-size: 14px; font-weight: normal; color: #666"
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
import { useCoreFunctionalityStore } from '@renderer-shared/modules/core-functionality/store'
import { championIconUrl, profileIconUrl } from '@renderer-shared/modules/game-data'
import { useLcuConnectionStore } from '@renderer-shared/modules/lcu-connection/store'
import { useSummonerStore } from '@renderer-shared/modules/lcu-state-sync/summoner'
import { summonerName } from '@shared/utils/name'
import { rsoPlatformText } from '@shared/utils/rso-platforms'
import { Search as SearchIcon, WarningAltFilled as WarningAltFilledIcon } from '@vicons/carbon'
import { NDropdown, NIcon, NPopover, NTab, NTabs } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import SearchSummoner from '@main-window/components/search-summoner/SearchSummoner.vue'
import { matchHistoryTabsRendererModule as mhm } from '@main-window/modules/match-history-tabs'
import { TabState, useMatchHistoryTabsStore } from '@main-window/modules/match-history-tabs/store'

import MatchHistoryTab from './MatchHistoryTab.vue'

const mh = useMatchHistoryTabsStore()
const lc = useLcuConnectionStore()

const route = useRoute()
const router = useRouter()

// 当前登录的用户信息
const summoner = useSummonerStore()

const cf = useCoreFunctionalityStore()

const handleTabClose = (puuid: string) => {
  mh.closeTab(puuid)
}

const { navigateToTab } = mhm.useNavigateToTab()

const handleTabChange = async (unionId: string) => {
  const { puuid, sgpServerId } = mhm.parseUnionId(unionId)
  navigateToTab(puuid, sgpServerId)
}

const tabsRef = ref<any[]>()

const handleRefresh = async (puuid: string) => {
  if (tabsRef.value) {
    const tab = tabsRef.value.find((t) => t.puuid === puuid)
    tab.refresh()
  }
}

const matchHistoryRoute = computed(() => {
  const puuid = route.params.puuid as string
  const sgpServerId = route.params.sgpServerId as string

  if (typeof puuid === 'string' && typeof sgpServerId === 'string' && puuid && sgpServerId) {
    return { puuid, sgpServerId }
  }

  return null
})

const tabNames = computed(() => {
  const nameMap: Record<string, string> = {}

  // 统计是否只有一种 sgpServerId
  const sgpServerIds = new Set<string>()
  for (const tab of mh.tabs) {
    const { sgpServerId } = mhm.parseUnionId(tab.id)
    sgpServerIds.add(sgpServerId)
  }

  const onlyOneType = sgpServerIds.size === 1

  mh.tabs.forEach((tab) => {
    if (tab.data.summoner) {
      const n = summonerName(tab.data.summoner.gameName, tab.data.summoner.tagLine)

      if (onlyOneType) {
        nameMap[tab.id] = n
        return
      }

      // TODO: 目前只支持腾讯服务器, 所以固定为 rso-platforms.ts 中的文本
      const { sgpServerId } = mhm.parseUnionId(tab.id)
      const s = rsoPlatformText[sgpServerId] || sgpServerId

      nameMap[tab.id] = `${n} [${s}]`
      return
    }

    nameMap[tab.id] = tab.id
  })

  return nameMap
})

watch(
  () => matchHistoryRoute.value,
  (r) => {
    if (!r) {
      return
    }

    const unionId = `${r.sgpServerId}/${r.puuid}`

    const tab = mh.getTab(unionId)
    if (tab) {
      mh.setCurrentTab(unionId)
    } else {
      mh.createTab(unionId, {
        setCurrent: true,
        pin: summoner.me?.puuid === r.puuid // 庆幸的是，puuid 是唯一的
      })
      mhm.fetchTabFullData(unionId)
    }
  },
  { immediate: true }
)

watch(
  () => mh.currentTab,
  (tab) => {
    if (!tab) {
      router.replace({ name: 'match-history' })
      return
    }

    if (
      tab.id &&
      matchHistoryRoute.value &&
      (tab.id !== matchHistoryRoute.value.puuid ||
        tab.data.sgpServerId !== matchHistoryRoute.value.sgpServerId)
    ) {
      const { sgpServerId, puuid } = mhm.parseUnionId(tab.id)

      router.replace({
        name: 'match-history',
        params: { puuid, sgpServerId }
      })
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

  const tab = mh.getTab(id)

  if (tab) {
    mh.moveTab(menuProps.dragging!, id)
  }

  menuProps.dragging = null
}

const dropdownOptions = reactive([
  {
    label: '刷新',
    key: 'refresh',
    disabled: computed(() => {
      const tab = mh.getTab(menuProps.id)
      if (tab) {
        return (
          tab.data.loading.isLoadingMatchHistory ||
          tab.data.loading.isLoadingRankedStats ||
          tab.data.loading.isLoadingSummoner
        )
      }

      return true
    })
  },
  {
    label: '关闭',
    key: 'close',
    disabled: computed(() => {
      return mh.getTab(menuProps.id)?.isPinned
    })
  },
  {
    label: '关闭其他',
    key: 'close-others',
    disabled: computed(() => !mh.canCloseOtherTabs(menuProps.id))
  }
])

const handleMouseDown = (event, tabId) => {
  if (event.button === 1) {
    mh.closeTab(tabId);
  }
}

const handleMenuSelect = (action: string) => {
  switch (action) {
    case 'refresh':
      handleRefresh(menuProps.id)
      break
    case 'close':
      mh.closeTab(menuProps.id)
      break
    case 'close-others':
      mh.closeOtherTabs(menuProps.id)
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

.tab {
  display: flex;
  align-items: center;

  .tab-icon {
    width: 16px;
    height: 16px;
    border-radius: 2px;
  }

  .tab-title {
    margin-left: 4px;
    font-size: 13px;
  }

  .privacy-private-icon {
    position: relative;
    top: 1px;
    font-size: 12px;
    margin-left: 4px;
    color: rgb(206, 52, 52);
  }

  .temporary-tab {
    font-style: italic;
    filter: brightness(0.9);
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
