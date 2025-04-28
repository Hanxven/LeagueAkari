<template>
  <div id="app-title-bar">
    <span class="app-name" v-if="as.isAdministrator">League Akari X</span>
    <span class="app-name" v-else>League Akari</span>
    <div class="divider" :class="{ invisible: !shouldShowDivider }" />
    <div class="shard-area">
      <Transition name="fade">
        <KeepAlive>
          <MatchHistoryTabsTitle v-if="$route.name === 'match-history'" />
          <OngoingGameTitle v-else-if="$route.name === 'ongoing-game'" />
        </KeepAlive>
      </Transition>
    </div>
    <div class="divider" :class="{ invisible: !shouldShowDivider }" />
    <CommonButtons />
    <div class="divider" />
    <TrafficButtons />
  </div>
</template>

<script setup lang="ts">
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useMatchHistoryTabsStore } from '@main-window/shards/match-history-tabs/store'

import CommonButtons from './CommonButtons.vue'
import MatchHistoryTabsTitle from './MatchHistoryTabsTitle.vue'
import OngoingGameTitle from './OngoingGameTitle.vue'
import TrafficButtons from './TrafficButtons.vue'

const as = useAppCommonStore()
const route = useRoute()

const lcs = useLeagueClientStore()
const ogs = useOngoingGameStore()
const mhs = useMatchHistoryTabsStore()

const shouldShowDivider = computed(() => {
  switch (route.name) {
    case 'match-history':
      return lcs.isConnected && mhs.tabs.length

    case 'ongoing-game':
      const isCsSpectateWait =
        lcs.champSelect.session &&
        lcs.champSelect.session.isSpectating &&
        Object.values(ogs.teams).flat().length === 0

      return ogs.queryStage.phase !== 'unavailable' && !isCsSpectateWait
    default:
      return false
  }
})
</script>

<style lang="less" scoped>
#app-title-bar {
  display: flex;
  position: relative;
  height: var(--title-bar-height);
  align-items: center;
  -webkit-app-region: drag;
  backdrop-filter: blur(8px);
  background-color: #0001;
}

[data-theme='dark'] {
  #app-title-bar {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
}

[data-theme='light'] {
  #app-title-bar {
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
}

.shard-area {
  height: 100%;
  width: 0;
  flex: 1;
}

.app-name {
  padding: 0 4px;
  font-weight: bold;
  margin-left: 8px;
}

[data-theme='dark'] {
  .app-name {
    color: rgba(255, 255, 255, 0.8);
  }
}

[data-theme='light'] {
  .app-name {
    color: rgba(0, 0, 0, 0.8);
  }
}

.divider {
  width: 1px;
  height: 40%;
  box-sizing: border-box;
  margin: 0 8px;
  background-color: rgba(255, 255, 255, 0.15);

  &.invisible {
    visibility: hidden;
  }
}

[data-theme='dark'] {
  .divider {
    background-color: rgba(255, 255, 255, 0.15);
  }
}

[data-theme='light'] {
  .divider {
    background-color: rgba(0, 0, 0, 0.15);
  }
}
</style>
