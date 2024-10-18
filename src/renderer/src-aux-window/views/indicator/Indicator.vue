<template>
  <RouterView />
</template>

<script setup lang="ts">
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store';
import { onActivated, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const lcs = useLeagueClientStore()
const route = useRoute()
const router = useRouter()

// 在 indicator 主页面，根据当前的 phase 跳转到对应的页面
const routeTo = (phase: string | null) => {
  if (!route.matched.some((record) => record.name === 'indicator')) {
    return
  }

  switch (phase) {
    case null:
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
  () => lcs.gameflow.phase,
  (phase) => {
    routeTo(phase)
  },
  { immediate: true }
)

onActivated(() => {
  routeTo(lcs.gameflow.phase)
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
