<template>
  <div class="lounge-wrapper">
    <div class="indications">
      <LcuImage
        class="mode-image"
        v-if="lcs.gameflow.session?.map?.assets?.['game-select-icon-hover']"
        :src="lcs.gameflow.session?.map?.assets?.['game-select-icon-hover']"
      />
      <template v-if="lcs.gameflow.phase === 'ReadyCheck'">
        <template v-if="agfs.willAccept">
          <span class="main-text">自动接受 {{ willAcceptIn.toFixed(1) }} s</span>
          <NButton type="primary" secondary size="tiny" @click="() => handleCancelAutoAccept()"
            >取消本次自动接受</NButton
          >
        </template>
        <template v-else-if="lcs.matchmaking.readyCheck?.playerResponse === 'Accepted'">
          <span class="main-text">对局已接受</span>
          <span class="sub-text">已经接受的对局仍可拒绝</span>
          <NButton type="warning" secondary size="tiny" @click="() => handleDecline()"
            >拒绝对局</NButton
          >
        </template>
        <template v-else-if="lcs.matchmaking.readyCheck?.playerResponse === 'Declined'">
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
      <template v-else-if="lcs.gameflow.phase === 'Matchmaking'">
        <span class="main-text">匹配中</span>
        <span class="sub-text" v-if="lcs.matchmaking.search">{{
          formatMatchmakingSearchText(lcs.matchmaking.search)
        }}</span>
        <NButton
          :loading="isCancelingSearching"
          type="warning"
          secondary
          size="tiny"
          @click="() => handleCancelSearching()"
          ><template v-if="agfs.settings.autoMatchmakingEnabled">停止匹配并取消自动匹配</template
          ><template v-else>停止匹配</template></NButton
        >
      </template>
      <template v-else-if="agfs.willSearchMatch">
        <span class="main-text">匹配对局 {{ willSearchMatchIn.toFixed(1) }} s</span>
        <NButton type="primary" secondary size="tiny" @click="() => handleCancelAutoSearchMatch()"
          >取消本次自动匹配</NButton
        >
      </template>
      <template v-else>
        <span
          class="main-text-2"
          :title="`${lcs.gameflow.session?.map.gameModeName || '模式中'} · ${lcs.gameflow.session?.map.name || '地图'}`"
          >{{ formatMapModeText() }}</span
        >
        <template v-if="agfs.settings.autoMatchmakingEnabled">
          <span class="sub-text" v-if="penaltyTime"
            >等待秒退计时器 {{ penaltyTime.toFixed() }} s</span
          >
          <span class="sub-text" v-else-if="agfs.activityStartStatus === 'insufficient-members'"
            >自动匹配需达到 {{ agfs.settings.autoMatchmakingMinimumMembers }} 人</span
          >
          <span class="sub-text" v-else-if="agfs.activityStartStatus === 'waiting-for-invitees'"
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
import LoungeOperations from '@aux-window/components/LoungeOperations.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoGameflowRenderer } from '@renderer-shared/shards/auto-gameflow'
import { useAutoGameflowStore } from '@renderer-shared/shards/auto-gameflow/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { GetSearch } from '@shared/types/league-client/matchmaking'
import { useIntervalFn } from '@vueuse/core'
import { NButton } from 'naive-ui'
import { computed, ref, watch } from 'vue'

const agfs = useAutoGameflowStore()
const lcs = useLeagueClientStore()

const agf = useInstance<AutoGameflowRenderer>('auto-gameflow-renderer')
const lc = useInstance<LeagueClientRenderer>('league-client-renderer')

const willAcceptIn = ref(0)
const { pause: pauseAC, resume: resumeAC } = useIntervalFn(
  () => {
    const s = (agfs.willAcceptAt - Date.now()) / 1e3
    willAcceptIn.value = Math.abs(Math.max(s, 0))
  },
  100,
  { immediate: false, immediateCallback: true }
)

const willSearchMatchIn = ref(0)
const { pause: pauseAS, resume: resumeAS } = useIntervalFn(
  () => {
    const s = (agfs.willSearchMatchAt - Date.now()) / 1e3
    willSearchMatchIn.value = Math.abs(Math.max(s, 0))
  },
  100,
  { immediate: false, immediateCallback: true }
)

const handleAccept = () => lc.api.matchmaking.accept()

const handleDecline = () => lc.api.matchmaking.decline()

const handleCancelAutoAccept = () => agf.cancelAutoAccept()

const handleCancelAutoSearchMatch = async () => {
  await agf.setAutoMatchmakingEnabled(false)
  agf.cancelAutoMatchmaking()
}

const isCancelingSearching = ref(false)
const handleCancelSearching = async () => {
  if (isCancelingSearching.value) {
    return
  }

  try {
    isCancelingSearching.value = true
    await lc.api.lobby.deleteSearchMatch()
  } finally {
    isCancelingSearching.value = false
  }

  agf.setAutoMatchmakingEnabled(false)
}

const penaltyTime = computed(() => {
  if (!lcs.matchmaking.search) {
    return null
  }

  const errors = lcs.matchmaking.search.errors

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
  () => agfs.willAccept,
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
  () => agfs.willSearchMatch,
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
  const gameModeName = lcs.gameflow.session?.map.gameModeName || '模式中'
  const mapName = lcs.gameflow.session?.map.name || '地图'

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

  if (agfs.settings.autoMatchmakingRematchStrategy === 'fixed-duration') {
    return `${search.timeInQueue.toFixed(1)} s (最多 ${agfs.settings.autoMatchmakingRematchFixedDuration.toFixed()} s) / ${search.estimatedQueueTime.toFixed(1)} s`
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
