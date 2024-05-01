<template>
  <NCard size="small" v-if="selfActions">
    <NTimeline>
      <NTimelineItem
        v-for="a of selfActions"
        :type="getTimelineTypeByAction(a[0])"
        :line-type="a[0].completed ? 'default' : 'dashed'"
      >
        <span
          class="action"
          :class="{ completed: a[0].completed, 'in-progress': a[0].isInProgress }"
          >{{ formatActionTypeText(a[0]) }}</span
        >
      </NTimelineItem>
    </NTimeline>
  </NCard>
</template>

<script setup lang="ts">
import { useChampSelectStore } from '@shared/renderer/features/lcu-state-sync/champ-select'
import { useSummonerStore } from '@shared/renderer/features/lcu-state-sync/summoner'
import { Action } from '@shared/types/lcu/champ-select'
import { NCard, NTimeline, NTimelineItem } from 'naive-ui'
import { computed } from 'vue'

const cs = useChampSelectStore()
const summoner = useSummonerStore()

const selfActions = computed(() => {
  if (!cs.session) {
    return null
  }

  const memberMe = cs.session.myTeam.find((p) => p.puuid === summoner.me?.puuid)

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
      actionName = '[系统] 禁用展示'
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

.action.completed {
  filter: brightness(0.8);
}

.action.in-progress {
  color: #ffffff;
}
</style>
