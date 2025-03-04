<template>
  <Transition name="one-way-fade">
    <div v-show="ogws.fakeShow" class="ongoing-game-wrapper">
      <StandaloneMatchHistoryCardModal
        :game="showingGame.game"
        :game-id="showingGame.gameId"
        :self-puuid="showingGame.selfPuuid"
        v-model:show="isStandaloneMatchHistoryCardShow"
      />
      <OngoingGamePanel
        class="ongoing-game-app-wrapper"
        :show-easy-to-launch="false"
        @show-game="handleShowGame"
        @show-game-by-id="handleShowGameById"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import StandaloneMatchHistoryCardModal from '@renderer-shared/components/match-history-card/StandaloneMatchHistoryCardModal.vue'
import OngoingGamePanel from '@renderer-shared/components/ongoing-game-panel/OngoingGamePanel.vue'
import { useHideNotAppTag } from '@renderer-shared/compositions/useHideNotAppTag'
import { useOngoingGameWindowStore } from '@renderer-shared/shards/window-manager/store'
import { Game } from '@shared/types/league-client/match-history'
import { reactive, ref, watch } from 'vue'

const ogws = useOngoingGameWindowStore()

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

watch(
  () => ogws.fakeShow,
  (show) => {
    if (show) {
    } else {
      isStandaloneMatchHistoryCardShow.value = false
    }
  }
)

useHideNotAppTag(() => ogws.fakeShow)
</script>

<style lang="less">
.ongoing-game-wrapper {
  background-color: #1a1a1da0;
  border-radius: 8px;
  height: 100%;
  box-sizing: border-box;
}

.one-way-fade-enter-active,
.one-way-fade-leave-active {
  transition: opacity 0.15s;
}

.one-way-fade-enter-from,
.one-way-fade-leave-to {
  opacity: 0;
}

.one-way-fade-enter-to,
.one-way-fade-leave-from {
  opacity: 0.95;
}
</style>
