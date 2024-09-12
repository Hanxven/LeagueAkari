<template>
  <NIcon :title="POSITION_NAMES[position.toUpperCase()] || POSITION_NAMES['ALL']">
    <component :is="POSITIONS[position.toUpperCase()] || POSITIONS['ALL']" />
  </NIcon>
</template>

<script setup lang="ts">
import { NIcon } from 'naive-ui'

import PositionAll from './PositionAll.vue'
import PositionBottom from './PositionBottom.vue'
import PositionJungle from './PositionJungle.vue'
import PositionMiddle from './PositionMiddle.vue'
import PositionSupport from './PositionSupport.vue'
import PositionTop from './PositionTop.vue'

const POSITIONS = {
  ALL: PositionAll,
  FILL: PositionAll,
  BOTTOM: PositionBottom,
  BOT: PositionBottom,
  JUNGLE: PositionJungle,
  JUG: PositionJungle,
  MID: PositionMiddle,
  MIDDLE: PositionMiddle,
  TOP: PositionTop,
  UTILITY: PositionSupport,
  ADC: PositionBottom,
  SUPPORT: PositionSupport
}

const POSITION_NAMES = {
  ALL: '无',
  FILL: '补位',
  BOTTOM: '下路',
  BOT: '下路',
  JUNGLE: '打野',
  JUG: '打野',
  MID: '中路',
  MIDDLE: '中路',
  TOP: '上路',
  UTILITY: '辅助',
  ADC: '下路',
  SUPPORT: '辅助'
}

const { position = 'ALL' } = defineProps<{
  position?: string
}>()
</script>

<style lang="less" scoped>
.icon {
  display: inline-block;
  width: 1em;
  height: 1em;
}
</style>
