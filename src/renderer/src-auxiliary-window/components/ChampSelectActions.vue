<template>
  <NCard size="small" v-if="selfActions">
    <NTimeline>
      <NTimelineItem v-for="a of selfActions" :type="getTimelineTypeByAction(a[0])">
        <template #header>
          <span
            class="action"
            :class="{ completed: a[0].completed, 'in-progress': a[0].isInProgress }"
            >{{ formatActionTypeText(a[0]) }}</span
          >
        </template>
        <template v-if="a[0].completed">
          <div class="solution completed" v-if="a[0].type === 'pick'">
            <LcuImage class="image" :src="championIconUrl(a[0].championId)" />
            <span class="label">已选择</span>
          </div>
          <div class="solution completed" v-else-if="a[0].type === 'vote'">
            <LcuImage class="image" :src="championIconUrl(a[0].championId)" />
            <span class="label">已投票</span>
          </div>
          <div class="solution completed" v-else-if="a[0].type === 'ban'">
            <LcuImage class="image" :src="championIconUrl(a[0].championId)" />
            <span class="label">已禁用</span>
          </div>
        </template>
        <template v-else>
          <div class="solution" v-if="as.upcomingPick && as.upcomingPick.action.id === a[0].id">
            <LcuImage class="image" :src="championIconUrl(as.upcomingPick.championId)" />
            <span class="label">自动选择</span>
          </div>
          <div class="solution" v-if="as.upcomingBan && as.upcomingBan.action.id === a[0].id">
            <LcuImage class="image" :src="championIconUrl(as.upcomingBan.championId)" />
            <span class="label">自动禁用</span>
          </div>
        </template>
      </NTimelineItem>
    </NTimeline>
  </NCard>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useAutoSelectStore } from '@renderer-shared/modules/auto-select/store'
import { championIconUrl } from '@renderer-shared/modules/game-data'
import { useChampSelectStore } from '@renderer-shared/modules/lcu-state-sync/champ-select'
import { Action } from '@shared/types/lcu/champ-select'
import { NCard, NTimeline, NTimelineItem } from 'naive-ui'
import { computed } from 'vue'

const cs = useChampSelectStore()
const as = useAutoSelectStore()

const selfActions = computed(() => {
  if (!cs.session) {
    return null
  }

  // 乱斗类模式没有
  if (cs.session.benchEnabled) {
    return
  }

  const memberMe = as.memberMe

  if (!memberMe) {
    return null
  }

  const result = cs.session.actions
    .map((arr) => {
      return arr.filter((a) => a.actorCellId === memberMe.cellId || a.actorCellId === -1)
    })
    .filter((arr) => arr.length)

  return result
})

const formatActionTypeText = (action: Action) => {
  let actionName: string
  switch (action.type) {
    case 'pick':
      actionName = '英雄选择'
      break
    case 'ban':
      actionName = '英雄禁用'
      break
    case 'vote':
      actionName = '投票'
      break
    case 'ten_bans_reveal':
      actionName = '系统 · 禁用展示'
      break

    default:
      return action.type
  }

  let finishStatus: string = ''
  if (action.isInProgress) {
    finishStatus = '进行中'
  } else if (action.completed) {
    finishStatus = '已完成'
  }

  return finishStatus ? `${actionName} (${finishStatus})` : actionName
}

const getTimelineTypeByAction = (action: Action) => {
  if (action.completed) {
    return 'success'
  }

  if (action.isInProgress) {
    return 'info'
  }

  return 'default'
}
</script>

<style lang="less" scoped>
.action {
  font-size: 10px;
  color: rgb(146, 146, 146);
}

.action.completed,
.solution.completed {
  filter: brightness(0.8);
}

.action.in-progress {
  color: #ffffff;
}

.solution {
  display: flex;
  align-items: center;
  gap: 4px;

  .label {
    font-size: 10px;
    color: rgb(146, 146, 146);
  }

  .image {
    width: 16px;
    height: 16px;
    border-radius: 2px;
  }
}
</style>
@renderer-shared/modules/auto-select/store@renderer-shared/modules/lcu-state-sync/champ-select@renderer-shared/modules/lcu-state-sync/summoner
