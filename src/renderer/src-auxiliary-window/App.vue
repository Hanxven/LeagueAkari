<template>
  <div id="aux-window-frame">
    <AuxiliaryWindowTitleBar class="title-bar" />
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
import { auxiliaryWindowRendererModule as awm } from '@renderer-shared/modules/auxiliary-window'
import { useAuxiliaryWindowStore } from '@renderer-shared/modules/auxiliary-window/store'
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AuxiliaryWindowTitleBar from './components/AuxiliaryWindowTitleBar.vue'

const am = useAuxiliaryWindowStore()

const router = useRouter()
const route = useRoute()

// watch(
//   () => route.path,
//   (path) => {
//     if (path.startsWith('/indicator')) {
//       awm.setFunctionality('indicator')
//     } else if (path.startsWith('/opgg')) {
//       awm.setFunctionality('opgg')
//     }
//   }
// )

switch (am.currentFunctionality) {
  case 'indicator':
    router.replace({ name: 'indicator' })
    break
  case 'opgg':
    router.replace({ name: 'opgg' })
    break
}

// @ts-ignore
window.sw = (width: number, height: number) => {
  awm.setWindowSize(width, height)
}
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
@renderer-shared/modules/lcu-state-sync/gameflow
