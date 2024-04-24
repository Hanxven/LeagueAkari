<template>
  <div id="aux-window-frame">
    <AuxiliaryWindowTitleBar />
    <div class="content"><RouterView /></div>
  </div>
</template>

<script setup lang="ts">
import AuxiliaryWindowTitleBar from './components/AuxiliaryWindowTitleBar.vue'
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
