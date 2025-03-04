<template>
  <div class="player">
    <NIcon v-if="championId === null" class="timer-icon placeholder">
      <Timer20FilledIcon />
    </NIcon>
    <ChampionIcon
      v-else
      :champion-id="championId"
      class="champion-icon"
      ring
      :ring-width="2"
      ring-color="#fc82eaa0"
    />
    <NIcon class="arrow-icon">
      <ChevronRight16FilledIcon />
    </NIcon>
    <div class="summoner-spell" @click="$emit('spell1Click', spell1Id, timerType)">
      <NIcon class="timer-icon timer" v-if="championId === null">
        <Timer16FilledIcon />
      </NIcon>
      <SummonerSpellDisplay v-else :size="32" :spell-id="spell1Id" disable-popover />
      <div class="mask" v-if="spell1BaseTimestamp !== null">
        {{ spell1FormattedTimeText }}
      </div>
    </div>
    <div class="spacer"></div>
    <div class="summoner-spell" @click="$emit('spell2Click', spell2Id, timerType)">
      <NIcon class="timer-icon timer" v-if="championId === null">
        <Timer16FilledIcon />
      </NIcon>
      <SummonerSpellDisplay v-else :size="32" :spell-id="spell2Id" disable-popover />
      <div class="mask" v-if="spell2BaseTimestamp !== null">
        {{ spell2FormattedTimeText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import SummonerSpellDisplay from '@renderer-shared/components/widgets/SummonerSpellDisplay.vue'
import { ChevronRight16Filled as ChevronRight16FilledIcon } from '@vicons/fluent'
import {
  Timer16Filled as Timer16FilledIcon,
  Record16Regular as Timer20FilledIcon
} from '@vicons/fluent'
import { useIntervalFn } from '@vueuse/core'
import { NIcon } from 'naive-ui'
import { ref, watch } from 'vue'

defineEmits<{
  spell1Click: [spellId: number, type: 'countdown' | 'countup']
  spell2Click: [spellId: number, type: 'countdown' | 'countup']
}>()

const {
  championId = null,
  spell1Id = 1,
  spell2Id = 2,
  timerType = 'countup',
  spell1BaseTimestamp = null,
  spell2BaseTimestamp = null
} = defineProps<{
  // null for custom timer
  championId?: number | null

  spell1Id?: number
  spell2Id?: number

  // 当为倒计时模式时, 此值为目标时间戳
  // 当为秒表模式时, 此值为基准时间戳
  spell1BaseTimestamp?: number | null
  spell2BaseTimestamp?: number | null

  // 秒表模式 or 倒计时模式
  timerType?: 'countdown' | 'countup'
}>()

const spell1FormattedTimeText = ref('')
const spell2FormattedTimeText = ref('')

const formatTimeToSeconds = (type: 'countdown' | 'countup', timestamp: number): string => {
  const now = Date.now()
  const duration = (type === 'countdown' ? timestamp - now : now - timestamp) / 1000

  if (duration < 0) return '0'
  if (duration > 999) return '999'

  if (type === 'countdown' && duration < 1) {
    return duration.toFixed(1)
  }

  return Math.floor(duration).toString()
}

const update = () => {
  if (spell1BaseTimestamp !== null) {
    spell1FormattedTimeText.value = formatTimeToSeconds(timerType, spell1BaseTimestamp)
  }

  if (spell2BaseTimestamp !== null) {
    spell2FormattedTimeText.value = formatTimeToSeconds(timerType, spell2BaseTimestamp)
  }
}

const { pause, resume } = useIntervalFn(update, 80, {
  immediate: true,
  immediateCallback: true
})

watch(
  [() => spell1BaseTimestamp, () => spell2BaseTimestamp],
  ([t1, t2]) => {
    if (t1 !== null || t2 !== null) {
      resume()
    } else {
      pause()
    }
  },
  {
    immediate: true
  }
)
</script>

<style lang="less" scoped>
.player {
  display: flex;
  align-items: center;
  justify-content: center;

  .arrow-icon {
    margin: 0 4px;
    color: #fff8;
  }

  .timer-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    width: 32px;
    font-size: 24px;
  }

  .timer-icon.placeholder {
    border: 1px solid rgba(112, 208, 217, 0.4);
    border-radius: 4px;
    color: rgba(112, 208, 217, 0.4);
  }

  .timer-icon.timer {
    color: #fff;
  }

  .champion-icon {
    height: 32px;
    width: 32px;
    border-radius: 4px;
  }

  .spacer {
    width: 4px;
  }

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  .summoner-spell {
    position: relative;
    cursor: pointer;
    transition: all 0.3s;
    border: 1px solid #fff4;
    box-sizing: border-box;
    border-radius: 4px;

    &:hover {
      filter: brightness(0.8);
    }

    .mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #000000a0;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-family: sans-serif;
      line-height: 12px;
      font-weight: bold;
      color: #fff;
    }
  }
}
</style>
