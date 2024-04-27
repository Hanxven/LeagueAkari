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
          @contextmenu="(event) => handleShowMenu(event, tab.id)"
          :key="tab.id"
          :tab="
            summonerName(
              tab.data.summoner?.gameName || tab.data.summoner?.displayName,
              tab.data.summoner?.tagLine,
              tab.id
            )
          "
          :name="tab.id"
          :closable="tab.id !== summoner.me?.puuid"
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
              :src="championIcon(cf.ongoingChampionSelections?.[tab.id])"
            />
            <LcuImage
              v-else-if="tab.data.summoner"
              class="tab-icon"
              :src="tab.data.summoner ? profileIcon(tab.data.summoner.profileIconId) : undefined"
            />
            <span class="tab-title" :class="{ 'temporary-tab': tab.isTemporary }">{{
              summonerName(
                tab.data.summoner?.gameName || tab.data.summoner?.displayName,
                tab.data.summoner?.tagLine,
                tab.id
              )
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
      <div class="search-zone">
        <NPopover
          content-style="padding: 0;"
          raw
          style="
            width: 460px;
            max-height: 600px;
            border-radius: 4px;
            background-color: rgb(29, 29, 29);
          "
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
      <div class="fab reload" v-if="mh.currentTab">
        <NButton
          title="重新拉取数据"
          :loading="
            mh.currentTab.data.loading.isLoadingMatchHistory ||
            mh.currentTab.data.loading.isLoadingSummoner ||
            mh.currentTab.data.loading.isLoadingRankedStats
          "
          @click="() => handleRefresh(mh.currentTab!.id)"
          circle
          type="primary"
          ><template #icon
            ><NIcon><RefreshIcon /></NIcon></template
        ></NButton>
      </div>
      <div class="fab back-to-up" v-if="mh.currentTab">
        <NButton title="回到顶部" circle type="primary" @click="handleBackToTop"
          ><template #icon
            ><NIcon><ArrowUpIcon /></NIcon></template
        ></NButton>
      </div>
      <template v-if="mh.currentTab">
        <MatchHistoryTab
          v-for="t of mh.tabs"
          :key="t.id"
          v-show="t.id === mh.currentTab.id"
          ref="innerComps"
          :is-self-tab="mh.currentTab.id === summoner.me?.puuid"
          :tab="t.data as TabState"
        />
      </template>
      <div v-else class="tabs-placeholder">
        <LeagueAkariSpan bold class="placeholder-text" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import LeagueAkariSpan from '@shared/renderer/components/LeagueAkariSpan.vue'
import { useCoreFunctionalityStore } from '@shared/renderer/features/core-functionality/store'
import { championIcon, profileIcon } from '@shared/renderer/features/game-data'
import { useSummonerStore } from '@shared/renderer/features/lcu-state-sync/summoner'
import { laNotification } from '@shared/renderer/notification'
import { summonerName } from '@shared/utils/name'
import { Search as SearchIcon, WarningAltFilled as WarningAltFilledIcon } from '@vicons/carbon'
import { ArrowUp as ArrowUpIcon, Refresh as RefreshIcon } from '@vicons/ionicons5'
import { NButton, NDropdown, NIcon, NPopover, NTab, NTabs } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import SearchSummoner from '@main-window/components/search-summoner/SearchSummoner.vue'
import { fetchTabFullData } from '@main-window/features/match-history-tabs'
import { TabState, useMatchHistoryTabsStore } from '@main-window/features/match-history-tabs/store'

import MatchHistoryTab from './MatchHistoryTab.vue'

const mh = useMatchHistoryTabsStore()

const route = useRoute()
const router = useRouter()

// 当前登录的用户信息
const summoner = useSummonerStore()

const cf = useCoreFunctionalityStore()

const handleTabClose = (puuid: string) => {
  mh.closeTab(puuid)
}

const handleTabChange = async (puuid: string) => {
  await router.replace(`/match-history/${puuid}`)
}

const handleRefresh = async (puuid: string) => {
  const result = await fetchTabFullData(puuid)

  if (typeof result === 'string') {
    laNotification.warn('召唤师信息', `无法拉取用户 ${puuid} 的信息`)
  } else {
    laNotification.success(
      '召唤师信息',
      `拉取召唤师 ${summonerName(result.gameName || result.displayName, result.tagLine)} 的信息成功`
    )
  }
}

watch(
  () => mh.currentTab,
  (c) => {
    if (c) {
      router.replace(`/match-history/${c.id}`)
    }
  },
  { immediate: true }
)

watch(
  () => route.params.puuid,
  (puuid) => {
    if (typeof puuid !== 'string' || !puuid) {
      return
    }

    const tab = mh.getTab(puuid)
    if (tab) {
      mh.setCurrentTab(puuid)
    } else {
      mh.createTab(puuid, {
        setCurrent: true,
        pin: summoner.me?.puuid === puuid
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
    disabled: computed(() => mh.isLoading(menuProps.id))
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

const innerComps = ref<(typeof MatchHistoryTab)[]>([])
const handleBackToTop = () => {
  const tab = innerComps.value.find((t) => t.id === mh.currentTab?.id)
  if (tab) {
    tab.scrollToTop()
  }
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
  box-shadow: 0 0 4px 0 rgba(0, 0, 0, 0.4);
  z-index: 5;

  :deep(.n-tabs-tab) {
    --n-tab-padding: 4px 8px;
    --n-tab-border-radius: 0px;
    border: none;
    transition: none;
  }

  :deep(.n-tabs-tab-pad) {
    --n-tab-gap: 2px;
  }

  :deep(.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.tab-outer:hover) {
    background-color: rgba(255, 255, 255, 0.075);
  }

  :deep(.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.tab-outer) {
    height: 26px;
  }

  .tabs {
    flex-grow: 1;
    width: 0;
  }

  .search-zone {
    width: 100px;
    vertical-align: bottom;
  }

  .search-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    box-sizing: border-box;
    font-size: 12px;
    width: 100%;
    height: 26px;
    outline: none;
    border-left: none;
    border-right: none;
    border-top: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.09);
    background-color: rgb(60, 60, 60);
    color: rgb(200, 200, 200);
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: rgb(83, 83, 83);
    }
  }
}

.content {
  position: relative;
  flex: 1;
  height: 0;

  .fab {
    position: absolute;
    z-index: 1500;
    opacity: 0.6;
    transition:
      opacity 0.2s ease,
      box-shadow 0.2s ease;
    overflow: hidden;
    border-radius: 50%;
    box-shadow: 0 0 12px 0 rgba(84, 84, 84, 0.35);

    &:hover {
      opacity: 1;
      box-shadow: 0 0 24px 0 rgb(84, 84, 84, 0.5);
    }

    .n-button {
      vertical-align: bottom;
    }
  }

  .fab.reload {
    bottom: 48px;
    right: 24px;
  }

  .fab.back-to-up {
    bottom: 96px;
    right: 24px;
  }
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
  top: calc(var(--title-bar-height) * -1);
  justify-content: center;
  align-items: center;

  .placeholder-text {
    font-size: 22px;
  }
}
</style>
