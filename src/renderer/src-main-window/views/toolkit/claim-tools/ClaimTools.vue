<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <RewardClaimTool />
        <MissionClaimTool style="margin-top: 8px" />
        <EventHubClaimTool style="margin-top: 8px" />
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { NScrollbar } from 'naive-ui'

import EventHubClaimTool from './EventHubClaimTool.vue'
import RewardClaimTool from './RewardClaimTool.vue'
import MissionClaimTool from './MissionClaimTool.vue'
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

.single-root {
  height: 100%;
}

.settings-file-mode-indicator {
  font-size: 12px;
  font-weight: bold;
  margin-left: 8px;
}

[data-theme='dark'] {
  .settings-file-mode-indicator {
    color: #46ff90d0;
  }
}

[data-theme='light'] {
  .settings-file-mode-indicator {
    color: rgba(0, 122, 49, 0.816);
  }
}

.button-group {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.event-hub-item {
  display: flex;
  align-items: center;
  height: 48px;
  background-color: #0002;
}
</style>
