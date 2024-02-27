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
          :tab="tab.data.summoner?.displayName || tab.data.summoner?.gameName || tab.id"
          :name="tab.id"
          :closable="tab.id !== summoner.currentSummoner?.summonerId"
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
              v-if="mh.ongoingPlayers[tab.id]?.championId"
              class="tab-icon"
              :src="championIcon(mh.ongoingPlayers[tab.id].championId!)"
            />
            <LcuImage
              v-else-if="tab.data.summoner"
              class="tab-icon"
              :src="tab.data.summoner ? profileIcon(tab.data.summoner.profileIconId) : undefined"
            />
            <span class="tab-title" :class="{ 'temporary-tab': tab.isTemporary }">{{
              tab.data.summoner?.displayName || tab.data.summoner?.gameName || tab.id
            }}</span>
            <NIcon
              v-if="
                tab.id !== summoner.currentSummoner?.summonerId &&
                tab.data.summoner?.privacy === 'PRIVATE'
              "
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
          @click="fetchTabFullData(mh.currentTab.id, false)"
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
      <MatchHistoryTab
        ref="innerComp"
        v-if="mh.currentTab"
        :tab="(mh.currentTab.data as TabState)"
        :is-self-tab="mh.currentTab.id === summoner.currentSummoner?.summonerId"
      />
      <div v-else class="tabs-placeholder">League Toolkit</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search as SearchIcon, WarningAltFilled as WarningAltFilledIcon } from '@vicons/carbon'
import { ArrowUp as ArrowUpIcon, Refresh as RefreshIcon } from '@vicons/ionicons5'
import { NButton, NDropdown, NIcon, NPopover, NTab, NTabs } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import LcuImage from '@renderer/components/LcuImage.vue'
import SearchSummoner from '@renderer/components/search-summoner/SearchSummoner.vue'
import { championIcon, profileIcon } from '@renderer/features/game-data'
import { fetchTabFullData } from '@renderer/features/match-history'
import { useSummonerStore } from '@renderer/features/stores/lcu/summoner'
import { TabState, useMatchHistoryStore } from '@renderer/features/stores/match-history'

import MatchHistoryTab from './MatchHistoryTab.vue'


const route = useRoute()
const router = useRouter()

// 当前登录的用户信息
const summoner = useSummonerStore()

const mh = useMatchHistoryStore()

const handleTabClose = (summonerId: number) => {
  mh.closeTab(summonerId)
}

const handleTabChange = async (summonerId: number) => {
  await router.replace(`/match-history/${summonerId}`)
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
  () => route.params.summonerId,
  (val) => {
    if (val === '') {
      return
    }

    const id = Number(val)
    if (Number.isNaN(id)) {
      return
    }

    const tab = mh.getTab(id)
    if (tab) {
      mh.setCurrentTab(id)
    } else {
      mh.createTab(id, {
        setCurrent: true,
        pin: summoner.currentSummoner?.summonerId === id
      })
    }
  },
  { immediate: true }
)

const menuProps = reactive({
  x: 0,
  y: 0,
  show: false,
  id: 0,
  dragging: null as number | null,
  hover: null as number | null
})

const handleDragStart = (id: number) => {
  menuProps.dragging = id
}

const handleDragEnter = (id: number) => {
  menuProps.hover = id
}

const handleDragLeaveOrEnd = (_id: number) => {
  menuProps.hover = null
}

const handleDrop = (id: number) => {
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
      fetchTabFullData(menuProps.id, false)
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

const handleShowMenu = (e: PointerEvent, id: number) => {
  e.preventDefault()
  menuProps.show = true
  menuProps.x = e.clientX
  menuProps.y = e.clientY - 30 /* 30 = title-bar-height */
  menuProps.id = id
}

const innerComp = ref()
const handleBackToTop = () => innerComp.value?.scrollToTop()
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
    transition: opacity 0.2s ease, box-shadow 0.2s ease;
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
    top: 1px; // 看起来更舒服一点
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
  justify-content: center;
  align-items: center;
  font-size: 22px;
  font-weight: 700;
  color: rgb(92, 92, 92);
}
</style>
