<template>
  <div class="spells-cd-timer">
    <TimerItem
      :spell1-id="item.spell1Id"
      :spell2-id="item.spell2Id"
      :champion-id="item.championId"
      :timer-type="item.type === 'custom' ? 'countup' : ctws.settings.timerType"
      @spell1-click="
        setTimer(
          item.timer1Id,
          item.type === 'custom' ? 'countup' : ctws.settings.timerType,
          item.championId,
          item.spell1Id
        )
      "
      @spell2-click="
        setTimer(
          item.timer2Id,
          item.type === 'custom' ? 'countup' : ctws.settings.timerType,
          item.championId,
          item.spell2Id
        )
      "
      :spell1-base-timestamp="timers[item.timer1Id]"
      :spell2-base-timestamp="timers[item.timer2Id]"
      class="item-margin"
      v-for="item of items"
      :key="item.id"
    />
  </div>
</template>

<script setup lang="ts">
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useCdTimerWindowStore } from '@renderer-shared/shards/window-manager/store'
import { computed, reactive, ref, shallowReactive, watch } from 'vue'

import TimerItem from './TimerItem.vue'

const lcs = useLeagueClientStore()
const ctws = useCdTimerWindowStore()

const createEmptyTimer = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `default-${i}`,
    type: 'custom',
    timer1Id: `default-${i}-spell1`,
    timer2Id: `default-${i}-spell2`,
    spell1Id: 0,
    spell2Id: 0,
    championId: null
  }))
}

const timers: Record<string, number | null> = shallowReactive({})

const setTimer = (id: string, timerType: string, championId: number | null, spellId: number) => {
  const record = timers[id] || null

  // clear the timer
  if (record) {
    timers[id] = null
    return
  }

  if (timerType === 'countdown') {
    const spell = lcs.gameData.summonerSpells[spellId]

    if (spell) {
      timers[id] = Date.now() + spell.cooldown * 1000
    }
  } else if (timerType === 'countup') {
    timers[id] = Date.now()
    return
  }
}

watch(
  () => ctws.settings.timerType,
  () => {
    for (const key in timers) {
      timers[key] = null
    }
  }
)

const items = computed(() => {
  if (!lcs.gameflow.session || lcs.gameflow.session.phase !== 'InProgress' || !lcs.summoner.me) {
    return createEmptyTimer(5)
  }

  const selfPuuid = lcs.summoner.me.puuid
  // 注意到, playerChampionSelections 中提供的列表的顺序是按照阵营排序好的
  // 因此在目前缺少必要的字段以区分阵营时, 只能通过这些数据来实现阵营判断
  // 期待日后 playerChampionSelections 能提供必要的 puuid 字段
  const selections = lcs.gameflow.session.gameData.playerChampionSelections

  const teamA = selections.slice(0, 5)
  const teamB = selections.slice(5)

  const teamOne = lcs.gameflow.session.gameData.teamOne
  const teamTwo = lcs.gameflow.session.gameData.teamTwo

  const otherTeam = teamOne.some((player) => player.puuid === selfPuuid) ? teamTwo : teamOne

  const teamAMatchCount = teamA.reduce((acc, player) => {
    if (otherTeam.some((p) => p.championId === player.championId)) {
      return acc + 1
    }

    return acc
  }, 0)

  const teamBMatchCount = teamB.reduce((acc, player) => {
    if (otherTeam.some((p) => p.championId === player.championId)) {
      return acc + 1
    }

    return acc
  }, 0)

  const deductedEnemyTeam = teamAMatchCount > teamBMatchCount ? teamA : teamB

  const enemyTeam = deductedEnemyTeam.map((p, i) => ({
    id: `champion-${i}-${p.championId}-${p.spell1Id}-${p.spell2Id}`,
    type: 'summoner-spell',
    timer1Id: `champion-${i}-${p.championId}-${p.spell1Id}`,
    timer2Id: `champion-${i}-${p.championId}-${p.spell2Id}`,
    ...p
  }))

  return [...enemyTeam, ...createEmptyTimer(2)]
})
</script>

<style lang="less" scoped>
.spells-cd-timer {
  padding: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.item-margin:not(:last-child) {
  margin-bottom: 4px;
}
</style>
