<template>
  <div id="aux-window-frame">
    <AuxWindowTitleBar class="title-bar" />
    <div class="content">
      <RouterView v-slot="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWindowManagerStore } from '@renderer-shared/shards/window-manager/store'
import { watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import AuxWindowTitleBar from './components/AuxWindowTitleBar.vue'
import { useChampionBalanceData } from './compositions/useBalanceData'

const mws = useWindowManagerStore()

const router = useRouter()

watch(
  () => mws.auxWindowFunctionality,
  (fun) => {
    switch (fun) {
      case 'indicator':
        router.replace({ name: 'indicator' })
        break
      case 'opgg':
        router.replace({ name: 'opgg' })
        break
    }
  },
  { immediate: true }
)

const { data } = useChampionBalanceData('fandom')
watchEffect(() => {
  console.log(data.value)
})
</script>

<style lang="less">
#aux-window-frame {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: var(--app-min-width);
  min-height: var(--app-min-height);

  > .content {
    height: 0;
    flex: 1;
    overflow: hidden;
  }
}
</style>
