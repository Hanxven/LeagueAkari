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
        <div v-if="lcs.connectionState !== 'connected'" class="disconnected">未连接到客户端</div>
        <template v-if="lcs.summoner.me && mhs.tabs.length === 0">
          <div class="no-tab">当前没有活跃的战绩页面</div>
          <div class="shortcut" @click="handleOpenSelfTab">
            <LcuImage
              class="shortcut-profile-icon"
              :src="profileIconUri(lcs.summoner.me.profileIconId)"
            />
            <span class="shortcut-game-name">{{ lcs.summoner.me.gameName }}</span>
            <span class="shortcut-tag-line">#{{ lcs.summoner.me.tagLine }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useInstance } from '@renderer-shared/shards'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { computed, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// import SearchSummoner from '@main-window/components/search-summoner/SearchSummoner.vue'
import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'
import { useMatchHistoryTabsStore } from '@main-window/shards/match-history-tabs/store'

import MatchHistoryTab from './MatchHistoryTab.vue'

const lcs = useLeagueClientStore()

const route = useRoute()
const router = useRouter()

const mhs = useMatchHistoryTabsStore()
const ogs = useOngoingGameStore()

const mh = useInstance<MatchHistoryTabsRenderer>('match-history-tabs-renderer')

const tabsRef = useTemplateRef('tabs-ref')

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

// 路由 ==> 页面
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

// 路由 <== 页面
watch(
  () => mhs.currentTabId,
  (id) => {
    if (!id) {
      router.replace({ name: 'match-history' })
      return
    }

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

const isEndOfGame = computed(
  () => lcs.gameflow.phase === 'EndOfGame' || lcs.gameflow.phase === 'PreEndOfGame'
)

// 页面在游戏结束后刷新对应 tab 的战绩
// 当该页面被 KeepAlive, 即使页面不可见也会触发
watch(
  () => isEndOfGame.value,
  (is, _prevP) => {
    if (mhs.settings.refreshTabsAfterGameEnds && is) {
      if (!ogs.teams || !tabsRef.value) {
        return
      }

      const allPlayerPuuids = Object.values(ogs.teams).flat()
      tabsRef.value.forEach((tab) => {
        if (tab && allPlayerPuuids.includes(tab.puuid)) {
          tab.refresh()
        }
      })
    }
  }
)

const { navigateToTabByPuuid } = mh.useNavigateToTab()

const handleOpenSelfTab = () => {
  if (lcs.summoner.me) {
    navigateToTabByPuuid(lcs.summoner.me.puuid)
  }
}

mh.events.on('refresh-tab', (tabId: string) => {
  const tab = tabsRef.value?.find((tab) => tab && tab.id === tabId)
  if (tab) {
    tab.refresh()
  }
})
</script>

<style lang="less" scoped>
.tabs-wrapper {
  height: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
}

.content {
  position: relative;
  flex: 1;
  height: 0;
}

.tabs-placeholder {
  height: 100%;
  display: flex;
  position: relative;

  .akari-text {
    font-size: 22px;
  }

  .disconnected {
    font-size: 14px;
    font-weight: normal;
    color: rgba(255, 255, 255, 0.4);
    margin-top: 8px;
  }

  .no-tab {
    font-size: 14px;
    font-weight: normal;
    color: rgba(255, 255, 255, 0.4);
    margin-top: 8px;
  }

  .shortcut {
    display: flex;
    align-items: center;
    margin-top: 16px;
    background-color: rgba(255, 255, 255, 0.06);
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    backdrop-filter: blur(4px);

    &:hover {
      background-color: rgba(255, 255, 255, 0.12);
    }

    .shortcut-profile-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }

    .shortcut-game-name {
      margin-left: 8px;
      font-size: 14px;
      font-weight: bold;
      color: rgba(255, 255, 255, 0.95);
    }

    .shortcut-tag-line {
      margin-left: 4px;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.4);
    }
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
