<template>
  <NScrollbar class="outer-wrapper" ref="el">
    <div class="inner-wrapper">
      <LobbyTool class="tool" />
    </div>
  </NScrollbar>
</template>

<script setup lang="ts">


import LobbyTool from './LobbyTool.vue'
import { NScrollbar } from 'naive-ui'


</script>

<style lang="less" scoped>
.outer-wrapper {
  position: relative;
  height: 100%;
  max-width: 100%;
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
