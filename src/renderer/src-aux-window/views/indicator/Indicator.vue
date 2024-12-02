<template>
  <ChampSelect v-if="currentPage === 'champ-select'" />
  <Lounge v-else-if="currentPage === 'lounge'" />
  <Placeholder v-else />
</template>

<script setup lang="ts">
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { computed } from 'vue'

import ChampSelect from './ChampSelect.vue'
import Lounge from './Lounge.vue'
import Placeholder from './Placeholder.vue'

const lcs = useLeagueClientStore()

const currentPage = computed(() => {
  switch (lcs.gameflow.phase) {
    case null:
    case 'None':
    case 'EndOfGame':
    case 'PreEndOfGame':
    case 'WatchInProgress':
    case 'GameStart':
    case 'InProgress':
    case 'WaitingForStats':
    case 'Reconnect':
      return 'placeholder'

    case 'Matchmaking':
    case 'ReadyCheck':
    case 'Lobby':
      return 'lounge'

    case 'ChampSelect':
      if (lcs.champSelect.session && lcs.champSelect.session.isSpectating) {
        return 'placeholder'
      }

      return 'champ-select'
  }

  return 'placeholder'
})
</script>

<style lang="less" scoped>
.control-item {
  height: 24px;

  &:not(:last-child) {
    margin-bottom: 2px;
  }
}
</style>
