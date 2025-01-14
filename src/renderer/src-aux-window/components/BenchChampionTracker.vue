<template>
  <NCard size="small" v-if="translatedEvents.length">
    <NScrollbar style="height: 200px" ref="scrollbar">
      <NTimeline>
        <NTimelineItem v-for="e of translatedEvents" type="info">
          <template #icon>
            <NIcon>
              <component :is="getEventTypeIcon(e)" />
            </NIcon>
          </template>
          <template #header>
            <span class="action"
              >{{ formatEventTypeText(e) }} ({{ dayjs(e.timestamp).format('HH:mm:ss:SSS') }})</span
            >
          </template>
          <div class="solution" v-if="e.type === 'reroll'">
            <span class="action">{{
              t('BenchChampionTracker.useReroll', {
                player: t('BenchChampionTracker.position', {
                  position: cellIdToFloor[e.playerCellId]
                })
              })
            }}</span>
            <LcuImage class="image" :src="championIconUri(e.championId)" />
          </div>
          <div class="solution" v-else-if="e.type === 'trade'">
            <span class="action">
              {{
                t('BenchChampionTracker.tradeWithPlayer', {
                  player1: t('BenchChampionTracker.position', {
                    position: cellIdToFloor[e.player1CellId]
                  }),
                  player2: t('BenchChampionTracker.position', {
                    position: cellIdToFloor[e.player2CellId]
                  })
                })
              }}
            </span>
            <LcuImage class="image" :src="championIconUri(e.champion1Id)" />
            <LcuImage class="image" :src="championIconUri(e.champion2Id)" />
          </div>
          <div class="solution" v-else-if="e.type === 'swap'">
            <span class="action">
              {{
                t('BenchChampionTracker.swapFromBench', {
                  name: t('BenchChampionTracker.position', {
                    position: cellIdToFloor[e.playerCellId]
                  })
                })
              }}
            </span>
            <LcuImage class="image" :src="championIconUri(e.championId)" />
          </div>
        </NTimelineItem>
      </NTimeline>
    </NScrollbar>
  </NCard>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useAutoSelectStore } from '@renderer-shared/shards/auto-select/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import {
  CircleRegular as CircleRegularIcon,
  Dice as DiceIcon,
  ExchangeAlt as ExchangeAltIcon
} from '@vicons/fa'
import { ArrowCurveDownLeft24Filled as ArrowCurveDownLeft24FilledIcon } from '@vicons/fluent'
import { useScroll } from '@vueuse/core'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NCard, NIcon, NScrollbar, NTimeline, NTimelineItem } from 'naive-ui'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const as2 = useAutoSelectStore()

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

  return translated
})

const scrollbarEl = useTemplateRef('scrollbar')
const shouldFollow = ref(true)
const { arrivedState, y } = useScroll(() => scrollbarEl.value?.scrollbarInstRef?.containerRef)

watch(
  [() => shouldFollow.value, () => translatedEvents.value.length],
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
</script>

<style lang="less" scoped>
.action {
  font-size: 12px;
  color: #fffd;
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
