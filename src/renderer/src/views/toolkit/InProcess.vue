<template>
  <NCard size="small">
    <template #header><span class="card-header-title">进行时</span></template>
    <div class="control-line">
      <span class="label">英雄选择秒退</span>
      <NButton
        type="warning"
        :disabled="gameflow.phase !== 'ChampSelect'"
        @click="handleDodge"
        size="tiny"
        >秒退</NButton
      >
    </div>
    <div class="control-line">
      <span class="label">退出结算页面</span>
      <NButton type="success" :disabled="!isInEndgamePhase" @click="handlePlayAgain" size="tiny"
        >回到房间</NButton
      >
    </div>
    <div v-if="false" class="control-line">
      <span class="label">游戏内强退</span>
      <NButton
        type="warning"
        :disabled="gameflow.phase !== 'Reconnect' && gameflow.phase !== 'InProgress'"
        @click="handleEarlyExit"
        size="tiny"
        >强退</NButton
      >
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { NButton, NCard } from 'naive-ui'
import { computed } from 'vue'

import { notify } from '@renderer/events/notifications'
import { useGameflowStore } from '@renderer/features/stores/lcu/gameflow'
import { earlyExit } from '@renderer/http-api/gameflow'
import { playAgain } from '@renderer/http-api/lobby'
import { dodge } from '@renderer/http-api/login'

const id = 'view:toolkit:ongoing'

const gameflow = useGameflowStore()

const handleEarlyExit = async () => {
  try {
    await earlyExit()
  } catch (err) {
    notify.emit({ id, type: 'warning', content: '尝试强退失败', extra: { error: err } })
  }
}

const handleDodge = async () => {
  try {
    const r = await dodge()
  } catch (err) {
    notify.emit({
      id,
      type: 'warning',
      content: '尝试秒退失败',
      extra: { error: err }
    })
  }
}

const isInEndgamePhase = computed(() => {
  return (
    gameflow.phase === 'WaitingForStats' ||
    gameflow.phase === 'PreEndOfGame' ||
    gameflow.phase === 'EndOfGame'
  )
})

const handlePlayAgain = async () => {
  try {
    await playAgain()
  } catch (err) {
    notify.emit({
      id,
      type: 'warning',
      content: '尝试重新回到房间失败',
      extra: { error: err }
    })
  }
}
</script>

<style lang="less" scoped>
@import './style.less';
</style>
