<template>
  <div class="og-page">
    <StandaloneMatchHistoryCardModal
      :game="showingGame.game"
      :game-id="showingGame.gameId"
      :self-puuid="showingGame.selfPuuid"
      @to-summoner="navigateToTabByPuuid"
      v-model:show="isStandaloneMatchHistoryCardShow"
    />
    <OngoingGamePanel
      @to-summoner="navigateToTabByPuuid"
      @show-game="handleShowGame"
      @show-game-by-id="handleShowGameById"
    />
  </div>
</template>

<script lang="ts" setup>
import StandaloneMatchHistoryCardModal from '@renderer-shared/components/match-history-card/StandaloneMatchHistoryCardModal.vue'
import OngoingGamePanel from '@renderer-shared/components/ongoing-game-panel/OngoingGamePanel.vue'
import { useInstance } from '@renderer-shared/shards'
import { Game } from '@shared/types/league-client/match-history'
import { reactive, ref } from 'vue'

import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'

const mh = useInstance(MatchHistoryTabsRenderer)

const { navigateToTabByPuuid } = mh.useNavigateToTab()

const showingGame = reactive<{
  gameId: number
  game: Game | null
  selfPuuid: string
}>({
  gameId: 0,
  game: null,
  selfPuuid: ''
})

const isStandaloneMatchHistoryCardShow = ref(false)
const handleShowGame = (game: Game, puuid: string) => {
  showingGame.gameId = 0
  showingGame.game = game
  showingGame.selfPuuid = puuid
  isStandaloneMatchHistoryCardShow.value = true
}

const handleShowGameById = (id: number, selfPuuid: string) => {
  showingGame.game = null
  showingGame.gameId = id
  showingGame.selfPuuid = selfPuuid
  isStandaloneMatchHistoryCardShow.value = true
}
</script>

<style lang="less" scoped>
.og-page {
  height: 100%;
}
</style>
