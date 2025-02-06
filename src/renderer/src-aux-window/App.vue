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
import { useKeyboardCombo } from '@renderer-shared/compositions/useKeyboardCombo'
import { useAuxWindowStore } from '@renderer-shared/shards/window-manager/store'
import { useMessage } from 'naive-ui'
import { watch } from 'vue'
import { useRouter } from 'vue-router'

import AuxWindowTitleBar from './components/AuxWindowTitleBar.vue'
import { useInstance } from '@renderer-shared/shards'
import { LoggerRenderer } from '@renderer-shared/shards/logger'

const aws = useAuxWindowStore()

const router = useRouter()
const log = useInstance<LoggerRenderer>('logger-renderer')

watch(
  () => aws.functionality,
  (fun) => {
    switch (fun) {
      case 'indicator':
        router.replace({ name: 'indicator' })
        break
      case 'opgg':
        router.replace({ name: 'opgg' })
        break

      default:
        log.error('view:App', `Unknown aux window functionality: ${fun}`)
        break
    }
  },
  { immediate: true }
)

const message = useMessage()
useKeyboardCombo('AKARI', {
  onFinish: () => {
    message.info('League Akari!')
  },
  requireSameEl: true,
  caseSensitive: false,
  timeout: 250
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
