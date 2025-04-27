<template>
  <div id="opgg-window-frame">
    <SetupInAppScope />
    <OpggWindowTitleBar />
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
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/comp'

import OpggWindowTitleBar from './components/OpggWindowTitleBar.vue'
</script>

<style lang="less">
#opgg-window-frame {
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
