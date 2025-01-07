<template>
  <div class="panel">
    <div class="left-side-content">
      <SidebarMenu
        class="sidebar-menu"
        :items="menu"
        :current="currentMenu"
        @update:current="(key) => handleMenuChange(key)"
      />
      <div class="padding-zone"></div>
      <SidebarFixed />
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
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import {
  AiStatus as AiStatusIcon,
  Layers as LayersIcon,
  ToolKit as ToolkitIcon
} from '@vicons/carbon'
import { Games24Filled as Games24FilledIcon } from '@vicons/fluent'
import { TicketSharp as TicketSharpIcon } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'
import { Component as ComponentC, computed, h, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import SidebarFixed from '@main-window/components/sidebar/SidebarFixed.vue'
import SidebarMenu from '@main-window/components/sidebar/SidebarMenu.vue'

const renderIcon = (icon: ComponentC) => {
  return () => h(NIcon, null, () => h(icon))
}

const { t } = useTranslation()

const ogs = useOngoingGameStore()
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
      icon: renderIcon(TicketSharpIcon),
      name: t('SideBarMenu.test'),
      show: import.meta.env.DEV
    }
  ]
})

watchEffect(() => {
  currentMenu.value = route.name as string

  if (route.name === 'ongoing-game') {
    shouldShowOngoingGameBadge.value = false
  }
})

const handleMenuChange = async (val: string) => {
  try {
    await router.replace({ name: val })
  } catch (error) {
    console.error('routing', error)
  }
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

  .padding-zone {
    flex: 1;
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

[data-theme='dark'] {
  .panel {
    .fixed-buttons {
      background-color: rgba(167, 37, 37, 0.518);
    }

    .left-side-content {
      border-right: 1px solid rgba(255, 255, 255, 0.1);
    }
  }
}

[data-theme='light'] {
  .panel {
    .fixed-buttons {
      background-color: rgba(167, 37, 37, 0.518);
    }

    .left-side-content {
      border-right: 1px solid rgba(0, 0, 0, 0.1);
    }
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
