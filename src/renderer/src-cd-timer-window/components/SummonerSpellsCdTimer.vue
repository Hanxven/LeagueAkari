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
      :spell1-base-timestamp="timers[item.timer1Id]?.[1]"
      :spell2-base-timestamp="timers[item.timer2Id]?.[1]"
      @spell1-wheel="(_, deltaY) => adjustTimer(item.timer1Id, deltaY)"
      @spell2-wheel="(_, deltaY) => adjustTimer(item.timer2Id, deltaY)"
      @spell1-double-right-click="
        () =>
          sendInGameText(
            item.timer1Id,
            item.type === 'custom' ? 'countup' : ctws.settings.timerType,
            item.championId,
            item.spell1Id
          )
      "
      @spell2-double-right-click="
        () =>
          sendInGameText(
            item.timer2Id,
            item.type === 'custom' ? 'countup' : ctws.settings.timerType,
            item.championId,
            item.spell2Id
          )
      "
      class="item-margin"
      v-for="item of items"
      :key="item.id"
    />
    <div
      class="adjustment-indicator"
      :class="{
        'opacity-show': currentShowingIndicator
      }"
    >
      <template v-if="currentShowingIndicator">
        {{ formatDeltaMs(currentShowingIndicator.deltaMs, currentShowingIndicator.type) }}
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useCdTimerWindowStore } from '@renderer-shared/shards/window-manager/store'
import { EMPTY_PUUID } from '@shared/constants/common'
import { useTimeoutFn } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { computed, shallowReactive, shallowRef, watch } from 'vue'

import TimerItem from './TimerItem.vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const ctws = useCdTimerWindowStore()

const wm = useInstance(WindowManagerRenderer)

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

const timers: Record<string, ['countup' | 'countdown', number] | null> = shallowReactive({})

const setTimer = (id: string, timerType: string, _championId: number | null, spellId: number) => {
  const record = timers[id] || null

  // clear the timer
  if (record) {
    timers[id] = null
    return
  }

  if (timerType === 'countdown') {
    const spell = lcs.gameData.summonerSpells[spellId]
    const modeInfo = ctws.supportedGameModes.find(
      (mode) => mode.gameMode === lcs.gameflow.session?.gameData.queue.gameMode
    )

    if (spell && modeInfo) {
      const multiplier = 100 / (100 + modeInfo.abilityHaste)
      timers[id] = [timerType, Date.now() + spell.cooldown * multiplier * 1000]
    }
  } else if (timerType === 'countup') {
    timers[id] = [timerType, Date.now()]
    return
  }
}

const { start } = useTimeoutFn(
  () => {
    currentShowingIndicator.value = null
  },
  500,
  { immediate: false }
)
const currentShowingIndicator = shallowRef<{
  timerId: string
  type: 'countup' | 'countdown'
  deltaMs: number
} | null>(null)

const updateIndicator = (id: string, deltaMs: number, type: 'countup' | 'countdown') => {
  if (currentShowingIndicator.value && currentShowingIndicator.value.timerId === id) {
    currentShowingIndicator.value = {
      timerId: id,
      type,
      deltaMs: currentShowingIndicator.value.deltaMs + deltaMs
    }
  } else {
    currentShowingIndicator.value = { timerId: id, type, deltaMs }
  }

  start()
}

const formatDeltaMs = (deltaMs: number, type: 'countup' | 'countdown') => {
  if (type === 'countup') {
    if (deltaMs > 0) {
      return `- ${(deltaMs / 1000).toFixed()} s`
    } else if (deltaMs < 0) {
      return `+ ${Math.abs(deltaMs / 1000).toFixed()} s`
    }
  } else if (type === 'countdown') {
    if (deltaMs > 0) {
      return `+ ${(deltaMs / 1000).toFixed()} s`
    } else if (deltaMs < 0) {
      return `- ${Math.abs(deltaMs / 1000).toFixed()} s`
    }
  }

  return '= 0 s'
}

const adjustTimer = (id: string, deltaY: number) => {
  const record = timers[id] || null

  if (record === null) {
    return
  }

  const timeDelta = deltaY * 50 // 50 is a suitable value, up -> negative, down -> positive
  const currentBaseTime = record[1]

  // 对于countup，不允许调整时间导致其小于基准时间
  if (record[0] === 'countup') {
    const adjusted = Math.min(currentBaseTime + timeDelta, Date.now())
    timers[id] = [record[0], adjusted]
    updateIndicator(id, adjusted - currentBaseTime, 'countup')
  } else if (record[0] === 'countdown') {
    const adjusted = Math.max(currentBaseTime + timeDelta, Date.now())
    timers[id] = [record[0], adjusted]
    updateIndicator(id, timeDelta, 'countdown')
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
  const teamOne = lcs.gameflow.session.gameData.teamOne
  const teamTwo = lcs.gameflow.session.gameData.teamTwo

  if (
    selections[0] &&
    selections[0].puuid !== undefined &&
    selections[0].puuid !== '' &&
    selections[0].puuid !== EMPTY_PUUID
  ) {
    // able to distinguish by puuid field
    const otherTeam = teamOne.some((player) => player.puuid === selfPuuid) ? teamTwo : teamOne

    if (!otherTeam.length) {
      return createEmptyTimer(5)
    }

    const theirTeamSelections = selections.filter((player) =>
      otherTeam.some((p) => p.puuid === player.puuid)
    )

    return theirTeamSelections.map((p, i) => ({
      id: `champion-${i}-${p.championId}-${p.spell1Id}-${p.spell2Id}`,
      type: 'summoner-spell',
      timer1Id: `champion-${i}-${p.championId}-${p.spell1Id}`,
      timer2Id: `champion-${i}-${p.championId}-${p.spell2Id}`,
      ...p
    }))
  } else {
    if (
      !ctws.supportedGameModes.some(
        (mode) => mode.gameMode === lcs.gameflow.session?.gameData.queue.gameMode
      )
    ) {
      return createEmptyTimer(5)
    }

    // previously, it has only summonerInternalName field (which is completely useless)
    // thus we can only infer team members by championId
    if (selections.length !== 10) {
      return createEmptyTimer(5)
    }

    const teamA = selections.slice(0, 5)
    const teamB = selections.slice(5)

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

    const presumedEnemyTeam = teamAMatchCount > teamBMatchCount ? teamA : teamB

    const enemyTeam = presumedEnemyTeam.map((p, i) => ({
      id: `champion-${i}-${p.championId}-${p.spell1Id}-${p.spell2Id}`,
      type: 'summoner-spell',
      timer1Id: `champion-${i}-${p.championId}-${p.spell1Id}`,
      timer2Id: `champion-${i}-${p.championId}-${p.spell2Id}`,
      ...p
    }))

    return [...enemyTeam, ...createEmptyTimer(2)]
  }
})

const sendInGameText = (
  id: string,
  timerType: string,
  championId: number | null,
  spellId: number
) => {
  const record = timers[id] || null

  if (record === null || championId === null || ctws.gameTime === null) {
    return
  }

  const spell = lcs.gameData.summonerSpells[spellId]
  const modeInfo = ctws.supportedGameModes.find(
    (mode) => mode.gameMode === lcs.gameflow.session?.gameData.queue.gameMode
  )

  if (!spell || !modeInfo) {
    return
  }

  const relativeMs = record[1] - Date.now() + ctws.gameTime * 1000
  const minutes = Math.floor(relativeMs / 60000)
  const seconds = Math.floor((relativeMs % 60000) / 1000)

  let text: string | null = null
  if (timerType === 'countdown') {
    text = t('SummonerSpellsCdTimer.countdown', {
      championName: lcs.gameData.champions[championId]?.name || championId,
      spellName: spell.name,
      minutes,
      seconds: seconds.toString().padStart(2, '0')
    })
  } else if (timerType === 'countup') {
    text = t('SummonerSpellsCdTimer.countup', {
      championName: lcs.gameData.champions[championId]?.name || championId,
      spellName: spell.name,
      minutes,
      seconds: seconds.toString().padStart(2, '0')
    })
  }

  if (text) {
    wm.cdTimerWindow.sendInGame(text)
  }
}
</script>

<style lang="less" scoped>
.spells-cd-timer {
  position: relative;
  padding: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.adjustment-indicator {
  position: absolute;
  border-radius: 2px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 40px;
  background-color: rgba(0, 0, 0, 0.65);
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
  transition: opacity 0.2s;
  opacity: 0;

  &.opacity-show {
    opacity: 1;
  }
}

.item-margin:not(:last-child) {
  margin-bottom: 4px;
}
</style>
