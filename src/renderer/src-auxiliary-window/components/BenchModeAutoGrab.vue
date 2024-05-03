<template>
  <NCard v-if="as.settings.benchModeEnabled && isBenchMode" size="small">
    <NFlex align="center" class="min-height-container" :gap="4" v-if="as.upcomingGrab">
      <LcuImage class="image" :src="championIcon(as.upcomingGrab?.championId)" />
      <span class="label">即将选择 {{ willGrabIn.toFixed(1) }} s</span>
    </NFlex>
    <NFlex align="center" class="min-height-container" :gap="4" v-else>
      <span class="label" v-if="as.settings.benchExpectedChampions.length === 0"
        >自动选择没有设置期望英雄列表</span
      >
      <span class="label" v-else>自动选择无可用英雄</span>
    </NFlex>
  </NCard>
</template>

<script setup lang="ts">
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import { useAutoSelectStore } from '@shared/renderer/modules/auto-select/store'
import { championIcon } from '@shared/renderer/modules/game-data'
import { useChampSelectStore } from '@shared/renderer/modules/lcu-state-sync/champ-select'
import { isBenchEnabledSession } from '@shared/types/lcu/champ-select'
import { useIntervalFn } from '@vueuse/core'
import { NCard, NFlex } from 'naive-ui'
import { computed, ref, watch } from 'vue'

const as = useAutoSelectStore()
const cs = useChampSelectStore()

const isBenchMode = computed(() => isBenchEnabledSession(cs.session))

const willGrabIn = ref(0)
const { pause, resume } = useIntervalFn(
  () => {
    const s = ((as.upcomingGrab?.willGrabAt || -1) - Date.now()) / 1e3
    willGrabIn.value = Math.abs(Math.max(s, 0))
  },
  100,
  { immediate: false, immediateCallback: true }
)

watch(
  () => as.upcomingGrab,
  (u) => {
    if (u) {
      resume()
    } else {
      pause()
    }
  }
)
</script>

<style scoped lang="less">
.label {
  font-size: 10px;
  color: rgb(146, 146, 146);
}

.min-height-container {
  height: 18px;
}

.image {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}
</style>
