<template>
  <div class="cd-timer-wrapper" ref="wrapper">
    <CdTimerWindowTitleBar />
    <SummonerSpellsCdTimer class="content" />
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useElementSize } from '@vueuse/core'
import { useTemplateRef, watch } from 'vue'

import CdTimerWindowTitleBar from './components/CdTimerWindowTitleBar.vue'
import SummonerSpellsCdTimer from './components/SummonerSpellsCdTimer.vue'

const wrapperEl = useTemplateRef('wrapper')

const { height, width } = useElementSize(wrapperEl)
const wm = useInstance<WindowManagerRenderer>('window-manager-renderer')

watch(
  [() => width.value, () => height.value],
  async ([width, height]) => {
    await wm.cdTimerWindow.setSize(Math.ceil(width), Math.ceil(height))
  },
  {
    immediate: true
  }
)
</script>

<style lang="less">
html,
body,
#app {
  width: fit-content;
  height: fit-content;
}

.cd-timer-wrapper {
  width: fit-content;
  display: flex;
  flex-direction: column;
  background-color: #1a1a1da0;
  border-radius: 4px;
  box-sizing: border-box;
  overflow: hidden;

  opacity: 1;
}
</style>
