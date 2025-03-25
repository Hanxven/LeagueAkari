<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <LobbyTool class="tool" />
        <StrawberryTool class="tool" />
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { NScrollbar } from 'naive-ui'

import LobbyTool from './LobbyTool.vue'
import StrawberryTool from './StrawberryTool.vue'
</script>

<style lang="less" scoped>
@import '../toolkit-styles.less';
</style>
