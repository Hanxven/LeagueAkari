<template>
  <div class="toolkit-wrapper" ref="el">
    <div class="toolkit-wrapper-inner">
      <NTabs type="line" animated>
        <NTabPane tab="流程" name="gameflow">
          <AutoGameflow class="tool" />
        </NTabPane>
        <NTabPane tab="英雄选择" name="champ-select">
          <AutoSelect class="tool" />
        </NTabPane>
        <NTabPane tab="其他" name="miscellaneous">
          <AutoReply class="tool" />
        </NTabPane>
      </NTabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useKeepAliveScrollPositionMemo } from '@shared/renderer/compositions/useKeepAliveScrollPositionMemo'
import { NTabPane, NTabs } from 'naive-ui'
import { ref } from 'vue'

import AutoGameflow from './AutoGameflow.vue'
import AutoReply from './AutoReply.vue'
import AutoSelect from './AutoSelect.vue'

const el = ref()
useKeepAliveScrollPositionMemo(el)
</script>

<style lang="less" scoped>
.toolkit-wrapper {
  position: relative;
  height: 100%;
  max-width: 100%;
  overflow: auto;
}

.anchor {
  position: absolute;
  right: 8px;
  top: 8px;
}

.toolkit-wrapper-inner {
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
