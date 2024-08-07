<template>
  <RouterView />
</template>

<script setup lang="ts">
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync/gameflow'
import { onActivated, watch } from 'vue'
import { useRouter } from 'vue-router'

const gameflow = useGameflowStore()
const router = useRouter()

const routeTo = (phase: string | null) => {
  switch (phase) {
    case 'None':
    case 'EndOfGame':
    case 'PreEndOfGame':
    case 'WatchInProgress':
    case 'GameStart':
    case 'InProgress':
    case 'WaitingForStats':
    case 'Reconnect':
      router.replace({ name: 'placeholder' })
      break
    case 'Matchmaking':
    case 'ReadyCheck':
    case 'Lobby':
      router.replace({ name: 'lounge' })
      break
    case 'ChampSelect':
      router.replace({ name: 'champ-select' })
  }
}

watch(
  () => gameflow.phase,
  (phase) => {
    routeTo(phase)
  },
  { immediate: true }
)

onActivated(() => {
  routeTo(gameflow.phase)
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
