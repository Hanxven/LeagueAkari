<template>
  <div class="app-sidebar">
    <SidebarMenu
      class="sidebar-menu"
      :items="menu"
      :current="currentMenu"
      @update:current="(key) => handleMenuChange(key)"
    />
    <div class="padding-zone"></div>
    <SidebarFixed />
  </div>
</template>

<script setup lang="ts">
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import {
  AiStatus as AiStatusIcon,
  Layers as LayersIcon,
  ToolKit as ToolkitIcon
} from '@vicons/carbon'
import { Games24Filled as Games24FilledIcon } from '@vicons/fluent'
import { Warning20Filled as Warning20FilledIcon } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'
import { Component as ComponentC, computed, h, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import SidebarFixed from './SidebarFixed.vue'
import SidebarMenu from './SidebarMenu.vue'

const { t } = useTranslation()

const as = useAppCommonStore()
const ogs = useOngoingGameStore()

const renderIcon = (icon: ComponentC) => {
  return () => h(NIcon, null, () => h(icon))
}

const router = useRouter()
const route = useRoute()

const shouldShowOngoingGameBadge = ref(false)
const isInOngoingStage = computed(() => {
  return ogs.queryStage.phase !== 'unavailable'
})

watch(
  () => isInOngoingStage.value,
  (yes) => {
    if (yes && currentMenu.value !== 'ongoing-game') {
      shouldShowOngoingGameBadge.value = true
    } else {
      shouldShowOngoingGameBadge.value = false
    }
  }
)

const currentMenu = ref('match-history')
const menu = computed(() => {
  return [
    {
      key: 'match-history',
      icon: renderIcon(LayersIcon),
      name: t('SideBarMenu.match-history')
    },
    {
      key: 'ongoing-game',
      icon: renderIcon(Games24FilledIcon),
      name: t('SideBarMenu.ongoing-game'),
      inProgress: shouldShowOngoingGameBadge.value
    },
    {
      key: 'automation',
      icon: renderIcon(AiStatusIcon),
      name: t('SideBarMenu.automation')
    },
    {
      key: 'toolkit',
      icon: renderIcon(ToolkitIcon),
      name: t('SideBarMenu.toolkit')
    },
    {
      key: 'test',
      icon: renderIcon(Warning20FilledIcon),
      name: t('SideBarMenu.test'),
      show: import.meta.env.DEV || as.version.includes('rabi')
    }
  ]
})

const handleMenuChange = async (val: string | undefined) => {
  try {
    await router.replace({ name: val })
  } catch (error) {
    console.error('routing', error)
  }
}

watchEffect(() => {
  currentMenu.value = route.name as string

  if (route.name === 'ongoing-game') {
    shouldShowOngoingGameBadge.value = false
  }
})

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
.app-sidebar {
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  height: 100%;

  .padding-zone {
    flex: 1;
  }
}
</style>
