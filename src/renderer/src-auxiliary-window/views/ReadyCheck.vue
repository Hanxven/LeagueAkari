<template>
  <div class="ready-check-wrapper">
    <template v-if="gameflow.phase === 'ReadyCheck'">
      <template v-if="autoGameflow.willAccept">
        <span class="main-text">将自动接受对局</span>
        <span class="sub-text">{{ willAcceptIn }} s</span>
        <NButton type="primary" size="tiny" @click="() => handleCancelAutoAccept()"
          >取消本次自动接受</NButton
        >
      </template>
      <template v-else-if="matchmaking.readyCheck?.playerResponse === 'Accepted'">
        <span class="main-text">对局已接受</span>
        <span class="sub-text">已经接受的对局仍可拒绝</span>
        <NButton type="warning" size="tiny" @click="() => handleDecline()">拒绝对局</NButton>
      </template>
      <template v-else-if="matchmaking.readyCheck?.playerResponse === 'Declined'">
        <span class="main-text">对局已拒绝</span>
        <span class="sub-text">已经取消的对局仍可接受</span>
        <NButton type="primary" size="tiny" @click="() => handleAccept()">接受对局</NButton>
      </template>
      <template v-else>
        <span class="main-text">等待接受对局</span>
        <div class="btn-group">
          <NButton type="primary" size="tiny" @click="() => handleAccept()">接受对局</NButton>
          <NButton type="warning" size="tiny" @click="() => handleDecline()">拒绝对局</NButton>
        </div>
      </template>
    </template>
    <template v-else-if="gameflow.phase === 'Matchmaking'">
      <span class="main-text">匹配中</span>
      <span class="sub-text" v-if="matchmaking.search"
        >{{ matchmaking.search.timeInQueue.toFixed(1) }} s /
        {{ matchmaking.search.estimatedQueueTime.toFixed(1) }} s</span
      >
    </template>
    <template v-else>
      <span class="main-text">无状态</span>
      <span class="sub-text">这似乎不是一个可以达到的状态</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { cancelAutoAccept } from '@shared/renderer/features/auto-gameflow'
import { useAutoGameflowStore } from '@shared/renderer/features/auto-gameflow/store'
import { useGameflowStore } from '@shared/renderer/features/lcu-state-sync/gameflow'
import { useMatchmakingStore } from '@shared/renderer/features/lcu-state-sync/matchmaking'
import { accept, decline } from '@shared/renderer/http-api/matchmaking'
import { useIntervalFn } from '@vueuse/core'
import { NButton } from 'naive-ui'
import { ref, watch } from 'vue'

const autoGameflow = useAutoGameflowStore()
const gameflow = useGameflowStore()
const matchmaking = useMatchmakingStore()

const willAcceptIn = ref(0)
const { pause: pauseAC, resume: resumeAC } = useIntervalFn(
  () => {
    const s = (autoGameflow.willAcceptAt - Date.now()) / 1e3
    willAcceptIn.value = Math.abs(Math.max(s, 0))
  },
  100,
  { immediate: false, immediateCallback: true }
)

const handleAccept = () => accept()

const handleDecline = () => decline()

const handleCancelAutoAccept = () => cancelAutoAccept()

watch(
  () => autoGameflow.willAccept,
  (ok) => {
    if (ok) {
      resumeAC()
    } else {
      pauseAC()
    }
  },
  { immediate: true }
)
</script>

<style lang="less" scoped>
.ready-check-wrapper {
  display: flex;
  position: relative;
  top: calc(var(--app-title-bar-height) * -1);
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 8px 12px;
}

.main-text {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
}

.sub-text {
  font-size: 13px;
  margin-bottom: 8px;
  color: rgb(146, 146, 146);
}

.btn-group {
  display: flex;
  gap: 4px;
}
</style>
