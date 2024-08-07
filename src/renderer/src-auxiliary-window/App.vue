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
import { useKeyboardCombo } from '@shared/renderer/compositions/useKeyboardCombo'
import { auxiliaryWindowRendererModule as auxm } from '@shared/renderer/modules/auxiliary-window'
import { useRouter } from 'vue-router'

import AuxiliaryWindowTitleBar from './components/AuxiliaryWindowTitleBar.vue'

const router = useRouter()

useKeyboardCombo('opgg', {
  onFinish: () => {
    router.replace({ name: 'opgg' })
  }
})

// @ts-ignore
window.sw = (width: number, height: number) => {
  auxm.setWindowSize(width, height)
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
@shared/renderer/modules/lcu-state-sync/gameflow
