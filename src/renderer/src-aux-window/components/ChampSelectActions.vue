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
            <ChampionIcon class="image" :stretched="false" :champion-id="a[0].championId" />
            <span class="label">{{ t('ChampSelectActions.picked') }}</span>
          </div>
          <div class="solution completed" v-else-if="a[0].type === 'vote'">
            <ChampionIcon class="image" :stretched="false" :champion-id="a[0].championId" />
            <span class="label">{{ t('ChampSelectActions.voted') }}</span>
          </div>
          <div class="solution completed" v-else-if="a[0].type === 'ban'">
            <ChampionIcon class="image" :stretched="false" :champion-id="a[0].championId" />
            <span class="label">{{ t('ChampSelectActions.banned') }}</span>
          </div>
        </template>
        <template v-else>
          <div class="solution" v-if="as2.targetPick && as2.targetPick.action.id === a[0].id">
            <ChampionIcon
              class="image"
              :stretched="false"
              :champion-id="as2.targetPick.championId"
            />
            <span class="label">{{ t('ChampSelectActions.autoPick') }}</span>
          </div>
          <div class="solution" v-if="as2.targetBan && as2.targetBan.action.id === a[0].id">
            <ChampionIcon
              class="image"
              :stretched="false"
              :champion-id="as2.targetBan.championId"
            />
            <span class="label">{{ t('ChampSelectActions.autoBan') }}</span>
          </div>
        </template>
      </NTimelineItem>
    </NTimeline>
  </NCard>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useAutoSelectStore } from '@renderer-shared/shards/auto-select/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { Action } from '@shared/types/league-client/champ-select'
import { useTranslation } from 'i18next-vue'
import { NCard, NTimeline, NTimelineItem } from 'naive-ui'
import { computed } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const as2 = useAutoSelectStore()

const selfActions = computed(() => {
  if (!lcs.champSelect.session) {
    return null
  }

  // 乱斗类模式没有
  if (lcs.champSelect.session.benchEnabled) {
    return
  }

  const memberMe = as2.memberMe

  if (!memberMe) {
    return null
  }

  const result = lcs.champSelect.session.actions
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
      actionName = t('ChampSelectActions.picking')
      break
    case 'ban':
      actionName = t('ChampSelectActions.banning')
      break
    case 'vote':
      actionName = t('ChampSelectActions.voting')
      break
    case 'ten_bans_reveal':
      actionName = t('ChampSelectActions.tenBansRevealing')
      break

    default:
      return action.type
  }

  let finishStatus: string = ''
  if (action.isInProgress) {
    finishStatus = t('ChampSelectActions.inProgress')
  } else if (action.completed) {
    finishStatus = t('ChampSelectActions.completed')
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
  font-size: 11px;
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
