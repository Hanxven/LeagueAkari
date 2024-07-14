<template>
  <div class="outer-wrapper" ref="el">
    <div class="inner-wrapper">
      <LobbyTool class="tool" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useKeepAliveScrollPositionMemo } from '@shared/renderer/compositions/useKeepAliveScrollPositionMemo'
import { ref } from 'vue'

import LobbyTool from './LobbyTool.vue'

const el = ref()
useKeepAliveScrollPositionMemo(el)
</script>

<style lang="less" scoped>
.outer-wrapper {
  position: relative;
  height: 100%;
  max-width: 100%;
  overflow: auto;
}

.inner-wrapper {
  padding: 24px;
  margin: 0 auto;
  max-width: 800px;

  :deep(.n-card) {
    background-color: transparent;
  }
}

.tool:not(:last-child) {
  margin-bottom: 8px;
}
</style>
