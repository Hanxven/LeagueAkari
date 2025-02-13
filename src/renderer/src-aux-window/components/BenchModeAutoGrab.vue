<template>
  <NCard v-if="as2.settings.benchModeEnabled && isBenchMode" size="small">
    <NFlex align="center" class="min-height-container" v-if="as2.upcomingGrab">
      <LcuImage class="image" :src="championIconUri(as2.upcomingGrab?.championId)" />
      <span class="label">{{
        t('BenchModeAutoGrab.grabbing', {
          seconds: willGrabIn.toFixed(1)
        })
      }}</span>
    </NFlex>
    <NFlex align="center" class="min-height-container" v-else>
      <span class="label" v-if="as2.settings.benchExpectedChampions.length === 0">{{
        t('BenchModeAutoGrab.noExpectedChampions')
      }}</span>
      <span class="label" v-else>{{ t('BenchModeAutoGrab.noCandidate') }}</span>
    </NFlex>
  </NCard>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useAutoSelectStore } from '@renderer-shared/shards/auto-select/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { isBenchEnabledSession } from '@shared/types/league-client/champ-select'
import { useIntervalFn } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NCard, NFlex } from 'naive-ui'
import { computed, ref, watch } from 'vue'

const { t } = useTranslation()

const as2 = useAutoSelectStore()
const lcs = useLeagueClientStore()

const isBenchMode = computed(() => isBenchEnabledSession(lcs.champSelect.session))

const willGrabIn = ref(0)
const { pause, resume } = useIntervalFn(
  () => {
    const s = ((as2.upcomingGrab?.willGrabAt || -1) - Date.now()) / 1e3
    willGrabIn.value = Math.abs(Math.max(s, 0))
  },
  100,
  { immediate: false, immediateCallback: true }
)

watch(
  () => as2.upcomingGrab,
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
  font-size: 12px;
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
