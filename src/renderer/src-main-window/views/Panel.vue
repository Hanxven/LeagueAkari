<template>
  <div class="panel">
    <div class="left-side-content">
      <SidebarMenu
        class="sidebar-menu"
        :items="menu"
        :current="currentMenu"
        @update:current="(key) => handleMenuChange(key)"
      />
      <div class="dragging-zone"></div>
      <SidebarFixed @summoner-click="handleSummonerClick" :summoner="lcs.summoner.me" />
    </div>
    <div class="right-side-content">
      <RouterView v-slot="{ Component }">
        <Transition name="fade">
          <KeepAlive>
            <component :is="Component" />
          </KeepAlive>
        </Transition>
      </RouterView>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import {
  AiStatus as AiStatusIcon,
  AppSwitcher as AppSwitcherIcon,
  Layers as LayersIcon,
  Template as TemplateIcon
} from '@vicons/carbon'
import { TicketSharp as TicketSharpIcon } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import { Component as ComponentC, h, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import SidebarFixed from '@main-window/components/sidebar/SidebarFixed.vue'
import SidebarMenu from '@main-window/components/sidebar/SidebarMenu.vue'
import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'

const renderIcon = (icon: ComponentC) => {
  return () => h(NIcon, null, () => h(icon))
}

const currentMenu = ref('match-history')
const menu = ref([
  {
    key: 'match-history',
    icon: renderIcon(LayersIcon),
    name: '战绩页面'
  },
  {
    key: 'ongoing-game',
    icon: renderIcon(TemplateIcon),
    name: '对局分析'
  },
  {
    key: 'automation',
    icon: renderIcon(AiStatusIcon),
    name: '自动操作'
  },
  {
    key: 'toolkit',
    icon: renderIcon(AppSwitcherIcon),
    name: '工具集'
  },
  {
    key: 'test',
    icon: renderIcon(TicketSharpIcon),
    name: '测试',
    show: import.meta.env.DEV
  }
])

const router = useRouter()
const route = useRoute()

watchEffect(() => {
  currentMenu.value = route.name as string
})

const handleMenuChange = async (val: string) => {
  try {
    await router.replace({ name: val })
  } catch (error) {
    console.error('routing', error)
  }
}

const mh = useInstance<MatchHistoryTabsRenderer>('match-history-tabs-renderer')
const { navigateToTabByPuuid } = mh.useNavigateToTab()

const handleSummonerClick = (summoner: SummonerInfo) => {
  navigateToTabByPuuid(summoner.puuid)
}

const lcs = useLeagueClientStore()
const lcuxs = useLeagueClientUxStore()

const isClientsPreviewShow = ref(false)

// 善意的提醒，以防用户一直在等
watchEffect(() => {
  if (lcs.connectionState === 'disconnected' && lcuxs.launchedClients.length > 1) {
    isClientsPreviewShow.value = true
  }
})
</script>

<style lang="less" scoped>
.panel {
  display: flex;
  width: 100%;
  height: 100%;

  .dragging-zone {
    flex: 1;
    -webkit-app-region: drag;
  }

  .fixed-buttons {
    height: 96px;
    background-color: rgba(167, 37, 37, 0.518);
  }

  .left-side-content {
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }

  .right-side-content {
    flex: 1;
    width: 0;
  }
}

.client {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 24px;
  transition: 0.3s all ease;
  cursor: pointer;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.03);
  width: 160px;
  overflow: hidden;

  &:hover:not(.connected) {
    background-color: rgba(255, 255, 255, 0.15);
  }

  &:active:not(.connected) {
    background-color: rgba(255, 255, 255, 0.2);
  }

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  .region {
    font-size: 14px;
    color: #fff;
  }

  .rso {
    font-size: 14px;
    font-weight: bold;
    margin-left: 8px;
  }

  .pid {
    position: absolute;
    bottom: 0px;
    right: 6px;
    font-size: 12px;
    color: #6a6a6ae3;
    margin-left: 8px;
  }

  .connected-indicator {
    display: block;
    position: absolute;
    width: 4px;
    height: 100%;
    background-color: #8ede7c;
    left: 0px;
  }

  .left-widget {
    margin-right: 6px;
    font-size: 16px;
  }

  &.connected {
    :is(.rso, .region) {
      color: #696969;
    }
  }
}
</style>
