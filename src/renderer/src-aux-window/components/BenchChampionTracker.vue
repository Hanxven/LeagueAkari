<template>
  <NCard size="small" v-if="translatedEvents.events.length">
    <NPopover v-if="translatedEvents.diceUsage.length">
      <template #trigger>
        <div class="dice-usage">
          <div class="player-dice-usage" v-for="p of translatedEvents.diceUsage" :key="p.cellId">
            <span class="label">{{
              t('BenchChampionTracker.position', {
                count: cellIdToFloor[p.cellId],
                ordinal: true
              })
            }}</span>
            <NIcon class="icon"><DiceIcon /></NIcon>
            <span class="count">{{ p.diceUsage.length }}</span>
          </div>
        </div>
      </template>
      <div class="send-to-chat-pair">
        <span>{{ t('BenchChampionTracker.sendDiceUsageToChat') }}</span>
        <NButton @click="sendToChat" size="tiny" type="primary">{{
          t('BenchChampionTracker.sendButton')
        }}</NButton>
      </div>
    </NPopover>
    <NScrollbar style="height: 200px" ref="scrollbar">
      <NTimeline>
        <NTimelineItem v-for="e of translatedEvents.events" type="info">
          <template #icon>
            <NIcon>
              <component :is="getEventTypeIcon(e)" />
            </NIcon>
          </template>
          <template #header>
            <span class="action">
              {{ formatEventTypeText(e) }}
              <span class="time">({{ dayjs(e.timestamp).format('HH:mm:ss:SSS') }})</span></span
            >
          </template>
          <div class="solution" v-if="e.type === 'reroll'">
            <span class="action">{{
              t('BenchChampionTracker.useReroll', {
                player: t('BenchChampionTracker.position', {
                  count: cellIdToFloor[e.playerCellId],
                  ordinal: true
                })
              })
            }}</span>
            <ChampionIcon class="image" :stretched="false" :champion-id="e.championId" />
          </div>
          <div class="solution" v-else-if="e.type === 'trade'">
            <span class="action">
              {{
                t('BenchChampionTracker.tradeWithPlayer', {
                  player1: t('BenchChampionTracker.position', {
                    count: cellIdToFloor[e.player1CellId],
                    ordinal: true
                  }),
                  player2: t('BenchChampionTracker.position', {
                    count: cellIdToFloor[e.player2CellId],
                    ordinal: true
                  })
                })
              }}
            </span>
            <ChampionIcon class="image" :stretched="false" :champion-id="e.champion1Id" />
            <ChampionIcon class="image" :stretched="false" :champion-id="e.champion2Id" />
          </div>
          <div class="solution" v-else-if="e.type === 'swap'">
            <span class="action">
              {{
                t('BenchChampionTracker.swapFromBench', {
                  player: t('BenchChampionTracker.position', {
                    count: cellIdToFloor[e.playerCellId],
                    ordinal: true
                  })
                })
              }}
            </span>
            <ChampionIcon class="image" :stretched="false" :champion-id="e.championId" />
          </div>
        </NTimelineItem>
      </NTimeline>
    </NScrollbar>
  </NCard>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAutoSelectStore } from '@renderer-shared/shards/auto-select/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { defaultReplacer } from '@shared/utils/text-replacer'
import {
  CircleRegular as CircleRegularIcon,
  Dice as DiceIcon,
  ExchangeAlt as ExchangeAltIcon
} from '@vicons/fa'
import { ArrowCurveDownLeft24Filled as ArrowCurveDownLeft24FilledIcon } from '@vicons/fluent'
import { useScroll } from '@vueuse/core'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NCard,
  NIcon,
  NPopover,
  NScrollbar,
  NTimeline,
  NTimelineItem,
  useMessage
} from 'naive-ui'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

const { t } = useTranslation()

const lc = useInstance(LeagueClientRenderer)

const lcs = useLeagueClientStore()
const as2 = useAutoSelectStore()

const message = useMessage()

type TranslatedEvent =
  | {
      type: 'reroll'
      championId: number
      playerCellId: number
      playerPuuid: string
      timestamp: number
    }
  | {
      type: 'trade'
      champion1Id: number
      champion2Id: number
      player1Puuid: string
      player1CellId: number
      player2Puuid: string
      player2CellId: number
      timestamp: number
    }
  | {
      type: 'swap'
      championId: number
      playerCellId: number
      playerPuuid: string
      timestamp: number
    }

type TranslatedDiceUsage = {
  cellId: number
  diceUsage: {
    championId: number
    timestamp: number
  }[]
}

const formatEventTypeText = (e: TranslatedEvent) => {
  switch (e.type) {
    case 'reroll':
      return t('BenchChampionTracker.reroll')

    case 'trade':
      return t('BenchChampionTracker.trade')

    case 'swap':
      return t('BenchChampionTracker.swap')

    default:
      return 'unknown'
  }
}

const getEventTypeIcon = (e: TranslatedEvent) => {
  switch (e.type) {
    case 'reroll':
      return DiceIcon

    case 'trade':
      return ExchangeAltIcon

    case 'swap':
      return ArrowCurveDownLeft24FilledIcon

    default:
      return CircleRegularIcon
  }
}

const cellIdToFloor = computed(() => {
  if (!lcs.champSelect.session) {
    return {}
  }

  const myTeam = lcs.champSelect.session.myTeam

  return myTeam.reduce(
    (acc, p, index) => {
      acc[p.cellId] = index + 1
      return acc
    },
    {} as Record<number, number>
  )
})

const translatedEvents = computed(() => {
  const events = as2.aramTracker.recordedEvents.filter(
    (e) =>
      e.from.place === 'reroll' || // 重随
      (e.from.place === 'player' && e.to.place === 'player') || // 玩家间交换
      (e.from.place === 'bench' && e.to.place === 'player') // 拿取
  )

  const translated = [] as TranslatedEvent[]
  const diceUsage: Record<number, TranslatedDiceUsage> = {}

  for (let i = 0; i < events.length; i++) {
    const item = events[i]

    if (item.from.place === 'reroll') {
      translated.push({
        type: 'reroll',
        championId: item.championId,
        // @ts-ignore
        playerCellId: item.to.cellId as number,
        // @ts-ignore
        playerPuuid: item.from.puuid as string,
        timestamp: item.timestamp
      })

      // @ts-ignore
      const cellId = item.to.cellId as number

      diceUsage[cellId] = diceUsage[cellId] || {
        cellId,
        diceUsage: []
      }

      diceUsage[cellId].diceUsage.push({
        championId: item.championId,
        timestamp: item.timestamp
      })
    } else if (item.from.place === 'player' && item.to.place === 'player') {
      const other = events[i + 1]
      translated.push({
        type: 'trade',
        champion1Id: item.championId,
        champion2Id: other.championId,
        player1CellId: item.from.cellId,
        player2CellId: item.to.cellId,
        player1Puuid: item.from.puuid,
        player2Puuid: item.to.puuid,
        timestamp: item.timestamp
      })
      i++
    } else if (item.from.place === 'bench' && item.to.place === 'player') {
      translated.push({
        type: 'swap',
        championId: item.championId,
        playerCellId: item.to.cellId,
        playerPuuid: item.to.puuid,
        timestamp: item.timestamp
      })
    }
  }

  return {
    events: translated,
    diceUsage: Object.values(diceUsage).toSorted((a, b) => {
      const f1 = cellIdToFloor.value[a.cellId] || 0
      const f2 = cellIdToFloor.value[b.cellId] || 0
      return f1 - f2
    })
  }
})

const scrollbarEl = useTemplateRef('scrollbar')
const shouldFollow = ref(true)
const { arrivedState, y } = useScroll(() => scrollbarEl.value?.scrollbarInstRef?.containerRef)

watch(
  [() => shouldFollow.value, () => translatedEvents.value.events.length],
  ([should, _]) => {
    if (should) {
      nextTick(() => {
        y.value = scrollbarEl.value?.scrollbarInstRef?.containerRef?.scrollHeight || Infinity
      })
    }
  },
  { immediate: true }
)

watch(
  () => arrivedState.bottom,
  (arrivedBottom) => {
    if (arrivedBottom) {
      shouldFollow.value = true
    } else {
      shouldFollow.value = false
    }
  }
)

const sendToChat = async () => {
  const chatRoomId = lcs.chat.conversations.championSelect?.id

  if (!chatRoomId) {
    return
  }

  const usage = translatedEvents.value.diceUsage.map((m) => ({
    floor: cellIdToFloor.value[m.cellId],
    usage: m.diceUsage
  }))

  const messages = usage.map((u) => {
    const champions = u.usage
      .map((t) => t.championId)
      .map((c) => lcs.gameData.champions[c]?.name || c.toString())

    return t('BenchChampionTracker.diceUsage', {
      player: t('BenchChampionTracker.position', {
        count: u.floor,
        ordinal: true
      }),
      countV: u.usage.length,
      champions: champions.join(', ')
    })
  })

  try {
    await lc.api.chat.chatSend(chatRoomId, defaultReplacer.replace(messages.join('\n')))
  } catch (error: any) {
    message.warning(() => error.message)
  }
}
</script>

<style lang="less" scoped>
.action {
  font-size: 12px;
  color: #fffd;

  .time {
    font-size: 10px;
    color: #fff8;
  }
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

.dice-usage {
  display: flex;
  flex-wrap: wrap;
  row-gap: 4px;
  column-gap: 2px;
  margin-bottom: 4px;

  .player-dice-usage {
    display: flex;
    align-items: center;
    gap: 2px;
    border: solid 1px #fff2;
    padding: 0 4px;
    border-radius: 2px;

    .label {
      font-size: 11px;
      color: #fff8;
    }

    .icon {
      width: 16px;
      height: 16px;
    }

    .count {
      font-size: 12px;
      color: #fff;
    }
  }
}

.send-to-chat-pair {
  display: flex;
  font-size: 12px;
  align-items: center;
  gap: 16px;
}
</style>
