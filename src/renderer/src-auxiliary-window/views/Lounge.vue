<template>
  <div class="lounge-wrapper">
    <LcuImage
      class="mode-image"
      v-if="gameflow.session?.map?.assets?.['game-select-icon-hover']"
      :src="gameflow.session?.map?.assets?.['game-select-icon-hover']"
    />
    <template v-if="gameflow.phase === 'ReadyCheck'">
      <template v-if="autoGameflow.willAccept">
        <span class="main-text">将自动接受对局</span>
        <span class="sub-text">{{ willAcceptIn.toFixed(1) }} s</span>
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
      <span class="sub-text" v-if="matchmaking.search">{{
        formatMatchmakingSearchText(matchmaking.search)
      }}</span>
    </template>
    <template v-else-if="autoGameflow.willSearchMatch">
      <span class="main-text">将自动开始匹配对局</span>
      <span class="sub-text">{{ willSearchMatchIn.toFixed(1) }} s</span>
      <NButton type="primary" size="tiny" @click="() => handleCancelAutoSearchMatch()"
        >取消本次自动匹配</NButton
      >
    </template>
    <template v-else>
      <span
        class="main-text-2"
        :title="`${gameflow.session?.map.gameModeName || '模式中'} · ${gameflow.session?.map.name || '地图'}`"
        >{{ gameflow.session?.map.gameModeName || '模式中' }} ·
        {{ gameflow.session?.map.name || '地图' }}</span
      >
      <span
        class="sub-text"
        v-if="
          autoGameflow.settings.autoSearchMatchEnabled &&
          autoGameflow.activityStartStatus === 'waiting-for-invitees'
        "
        >正在等待受邀请的玩家</span
      >
    </template>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import { accept, decline } from '@shared/renderer/http-api/matchmaking'
import { cancelAutoAccept, cancelAutoSearchMatch } from '@shared/renderer/modules/auto-gameflow'
import { useAutoGameflowStore } from '@shared/renderer/modules/auto-gameflow/store'
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync/gameflow'
import { useMatchmakingStore } from '@shared/renderer/modules/lcu-state-sync/matchmaking'
import { GetSearch } from '@shared/types/lcu/matchmaking'
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

const willSearchMatchIn = ref(0)
const { pause: pauseAS, resume: resumeAS } = useIntervalFn(
  () => {
    const s = (autoGameflow.willSearchMatchAt - Date.now()) / 1e3
    willSearchMatchIn.value = Math.abs(Math.max(s, 0))
  },
  100,
  { immediate: false, immediateCallback: true }
)

const handleAccept = () => accept()

const handleDecline = () => decline()

const handleCancelAutoAccept = () => cancelAutoAccept()

const handleCancelAutoSearchMatch = () => cancelAutoSearchMatch()

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

watch(
  () => autoGameflow.willSearchMatch,
  (ok) => {
    if (ok) {
      resumeAS()
    } else {
      pauseAS()
    }
  },
  { immediate: true }
)

const formatMatchmakingSearchText = (search: GetSearch) => {
  if (search.lowPriorityData && search.lowPriorityData.penaltyTime) {
    return `等待 ${search.lowPriorityData.penaltyTimeRemaining} s (${search.lowPriorityData.penaltyTime} s) `
  }

  return `${search.timeInQueue.toFixed(1)} s / ${search.estimatedQueueTime.toFixed(1)} s`
}
</script>

<style lang="less" scoped>
.lounge-wrapper {
  display: flex;
  position: relative;
  top: calc(var(--title-bar-height) * -0.5);
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 8px 12px;
}

.mode-image {
  width: 72px;
  height: 72px;
  margin-bottom: 16px;
}

.main-text {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
}

.main-text-2 {
  display: block;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
  max-width: 280px;
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
