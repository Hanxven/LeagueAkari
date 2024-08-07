<template>
  <div class="lounge-wrapper">
    <div class="indications">
      <LcuImage
        class="mode-image"
        v-if="gameflow.session?.map?.assets?.['game-select-icon-hover']"
        :src="gameflow.session?.map?.assets?.['game-select-icon-hover']"
      />
      <template v-if="gameflow.phase === 'ReadyCheck'">
        <template v-if="agf.willAccept">
          <span class="main-text">自动接受 {{ willAcceptIn.toFixed(1) }} s</span>
          <NButton type="primary" secondary size="tiny" @click="() => handleCancelAutoAccept()"
            >取消本次自动接受</NButton
          >
        </template>
        <template v-else-if="matchmaking.readyCheck?.playerResponse === 'Accepted'">
          <span class="main-text">对局已接受</span>
          <span class="sub-text">已经接受的对局仍可拒绝</span>
          <NButton type="warning" secondary size="tiny" @click="() => handleDecline()"
            >拒绝对局</NButton
          >
        </template>
        <template v-else-if="matchmaking.readyCheck?.playerResponse === 'Declined'">
          <span class="main-text">对局已拒绝</span>
          <span class="sub-text">已经取消的对局仍可接受</span>
          <NButton type="primary" secondary size="tiny" @click="() => handleAccept()"
            >接受对局</NButton
          >
        </template>
        <template v-else>
          <span class="main-text">等待接受对局</span>
          <div class="btn-group">
            <NButton type="primary" secondary size="tiny" @click="() => handleAccept()"
              >接受对局</NButton
            >
            <NButton type="warning" secondary size="tiny" @click="() => handleDecline()"
              >拒绝对局</NButton
            >
          </div>
        </template>
      </template>
      <template v-else-if="gameflow.phase === 'Matchmaking'">
        <span class="main-text">匹配中</span>
        <span class="sub-text" v-if="matchmaking.search">{{
          formatMatchmakingSearchText(matchmaking.search)
        }}</span>
        <NButton
          :loading="isCancelingSearching"
          type="warning"
          secondary
          size="tiny"
          @click="() => handleCancelSearching()"
          ><template v-if="agf.settings.autoSearchMatchEnabled">停止匹配并取消自动匹配</template
          ><template v-else>停止匹配</template></NButton
        >
      </template>
      <template v-else-if="agf.willSearchMatch">
        <span class="main-text">匹配对局 {{ willSearchMatchIn.toFixed(1) }} s</span>
        <NButton type="primary" secondary size="tiny" @click="() => handleCancelAutoSearchMatch()"
          >取消本次自动匹配</NButton
        >
      </template>
      <template v-else>
        <span
          class="main-text-2"
          :title="`${gameflow.session?.map.gameModeName || '模式中'} · ${gameflow.session?.map.name || '地图'}`"
          >{{ formatMapModeText() }}</span
        >
        <template v-if="agf.settings.autoSearchMatchEnabled">
          <span class="sub-text" v-if="penaltyTime"
            >等待秒退计时器 {{ penaltyTime.toFixed() }} s</span
          >
          <span class="sub-text" v-else-if="agf.activityStartStatus === 'insufficient-members'"
            >自动匹配需达到 {{ agf.settings.autoSearchMatchMinimumMembers }} 人</span
          >
          <span class="sub-text" v-else-if="agf.activityStartStatus === 'waiting-for-invitees'"
            >正在等待受邀请的玩家</span
          >
        </template>
      </template>
    </div>
    <div class="bottom-actions">
      <LoungeOperations />
    </div>
  </div>
</template>

<script setup lang="ts">
import LoungeOperations from '@auxiliary-window/components/LoungeOperations.vue'
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import { deleteSearchMatch } from '@shared/renderer/http-api/lobby'
import { accept, decline } from '@shared/renderer/http-api/matchmaking'
import { autoGameflowRendererModule as agfm } from '@shared/renderer/modules/auto-gameflow'
import { useAutoGameflowStore } from '@shared/renderer/modules/auto-gameflow/store'
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync/gameflow'
import { useMatchmakingStore } from '@shared/renderer/modules/lcu-state-sync/matchmaking'
import { GetSearch } from '@shared/types/lcu/matchmaking'
import { useIntervalFn } from '@vueuse/core'
import { NButton } from 'naive-ui'
import { computed, ref, watch } from 'vue'

const agf = useAutoGameflowStore()
const gameflow = useGameflowStore()
const matchmaking = useMatchmakingStore()

const willAcceptIn = ref(0)
const { pause: pauseAC, resume: resumeAC } = useIntervalFn(
  () => {
    const s = (agf.willAcceptAt - Date.now()) / 1e3
    willAcceptIn.value = Math.abs(Math.max(s, 0))
  },
  100,
  { immediate: false, immediateCallback: true }
)

const willSearchMatchIn = ref(0)
const { pause: pauseAS, resume: resumeAS } = useIntervalFn(
  () => {
    const s = (agf.willSearchMatchAt - Date.now()) / 1e3
    willSearchMatchIn.value = Math.abs(Math.max(s, 0))
  },
  100,
  { immediate: false, immediateCallback: true }
)

const handleAccept = () => accept()

const handleDecline = () => decline()

const handleCancelAutoAccept = () => agfm.cancelAutoAccept()

const handleCancelAutoSearchMatch = async () => {
  await agfm.setAutoSearchMatchEnabled(false)
  agfm.cancelAutoSearchMatch()
}

const isCancelingSearching = ref(false)
const handleCancelSearching = async () => {
  if (isCancelingSearching.value) {
    return
  }

  try {
    isCancelingSearching.value = true
    await deleteSearchMatch()
  } finally {
    isCancelingSearching.value = false
  }

  agfm.setAutoSearchMatchEnabled(false)
}

const penaltyTime = computed(() => {
  if (!matchmaking.search) {
    return null
  }

  const errors = matchmaking.search.errors

  if (!errors.length) {
    return null
  }

  const maxPenaltyTime = errors.reduce(
    (prev, cur) => Math.max(cur.penaltyTimeRemaining, prev),
    -Infinity
  )

  return maxPenaltyTime
})

watch(
  () => agf.willAccept,
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
  () => agf.willSearchMatch,
  (ok) => {
    if (ok) {
      resumeAS()
    } else {
      pauseAS()
    }
  },
  { immediate: true }
)

const formatMapModeText = () => {
  const gameModeName = gameflow.session?.map.gameModeName || '模式中'
  const mapName = gameflow.session?.map.name || '地图'

  if (gameModeName === mapName) {
    return gameModeName
  }

  return `${gameModeName} · ${mapName}`
}

const formatNumber = (num: number, precision = 1) => {
  let formatted = num.toFixed(precision)
  formatted = formatted.replace(/(\.\d*?)0+$/, '$1')
  return formatted.replace(/\.$/, '')
}

const formatMatchmakingSearchText = (search: GetSearch) => {
  if (search.lowPriorityData && search.lowPriorityData.penaltyTime) {
    return `等待 ${formatNumber(search.lowPriorityData.penaltyTimeRemaining)} s (${formatNumber(search.lowPriorityData.penaltyTime)} s) `
  }

  if (agf.settings.autoSearchMatchRematchStrategy === 'fixed-duration') {
    return `${search.timeInQueue.toFixed(1)} s (最多 ${agf.settings.autoSearchMatchRematchFixedDuration.toFixed()} s) / ${search.estimatedQueueTime.toFixed(1)} s`
  }

  return `${search.timeInQueue.toFixed(1)} s / ${search.estimatedQueueTime.toFixed(1)} s`
}
</script>

<style lang="less" scoped>
.lounge-wrapper {
  display: flex;
  position: relative;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 12px;
  box-sizing: border-box;

  .indications {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1;
  }

  .bottom-actions {
    width: 100%;
  }
}

.mode-image {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.main-text {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.main-text-2 {
  display: block;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-size: 16px;
  font-weight: bold;
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
@shared/renderer/modules/auto-gameflow@shared/renderer/modules/auto-gameflow/store@shared/renderer/modules/lcu-state-sync/gameflow@shared/renderer/modules/lcu-state-sync/matchmaking
