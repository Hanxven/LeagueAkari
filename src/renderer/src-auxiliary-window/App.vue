<template>
  <div id="aux-window-frame">
    <AuxiliaryWindowTitleBar class="title-bar" />
    <div class="content"><RouterView /></div>
  </div>
</template>

<script setup lang="ts">
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync/gameflow'
import { watch } from 'vue'
import { useRouter } from 'vue-router'

import AuxiliaryWindowTitleBar from './components/AuxiliaryWindowTitleBar.vue'

const gameflow = useGameflowStore()
const router = useRouter()

watch(
  () => gameflow.phase,
  (phase) => {
    switch (phase) {
      case 'None':
      case 'EndOfGame':
      case 'PreEndOfGame':
      case 'WatchInProgress':
      case 'GameStart':
      case 'InProgress':
      case 'WaitingForStats':
      case 'Reconnect':
        router.replace({ name: 'root' })
        break
      case 'Matchmaking':
      case 'ReadyCheck':
      case 'Lobby':
        router.replace({ name: 'ready-check' })
        break
      case 'ChampSelect':
        router.replace({ name: 'champ-select' })
    }
  },
  { immediate: true }
)
</script>

<style lang="less">
#aux-window-frame {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: var(--app-min-width);
  min-height: var(--app-min-height);

  > .content {
    height: 0;
    flex: 1;
    overflow: hidden;
  }
}
</style>
