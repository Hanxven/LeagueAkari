<template>
  <NIcon>
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
