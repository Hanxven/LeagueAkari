<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <NCard size="small" >
          <template #header><span class="card-header-title">自动回复</span></template>
          <ControlItem label="开启" class="control-item-margin" :label-width="200">
            <NSwitch
              @update:value="(v) => arm.setEnabled(v)"
              :value="ar.settings.enabled"
              size="small"
            ></NSwitch>
          </ControlItem>
          <ControlItem
            label="仅在离开时"
            class="control-item-margin"
            label-description="仅在游戏状态为离开时，自动回复才会生效"
            :label-width="200"
          >
            <NSwitch
              @update:value="(v) => arm.setEnableOnAway(v)"
              :value="ar.settings.enableOnAway"
              size="small"
            ></NSwitch>
          </ControlItem>
          <ControlItem
            label="回复内容"
            class="control-item-margin"
            label-description="将作为自动回复的内容词"
            :label-width="200"
          >
            <NInput
              :status="ar.settings.text.length === 0 && ar.settings.enabled ? 'warning' : 'success'"
              style="max-width: 360px; width: 360px"
              :value="ar.settings.text"
              @update:value="(text) => arm.setText(text)"
              size="small"
            ></NInput>
          </ControlItem>
        </NCard>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoReplyRenderer } from '@renderer-shared/shards/auto-reply'
import { useAutoReplyStore } from '@renderer-shared/shards/auto-reply/store'
import { NCard, NInput, NScrollbar, NSwitch } from 'naive-ui'

const ar = useAutoReplyStore()
const arm = useInstance<AutoReplyRenderer>('auto-reply-renderer')
</script>

<style lang="less" scoped>
.control-item-margin {
  &:not(:last-child) {
    margin-bottom: 12px;
  }
}

.card-header-title {
  font-weight: bold;
  font-size: 18px;
}

.outer-wrapper {
  position: relative;
  height: 100%;
  max-width: 100%;
}

.inner-wrapper {
  padding: 16px;
  margin: 0 auto;
  max-width: 800px;

  :deep(.n-card) {
    background-color: transparent;
  }
}

.single-root {
  height: 100%;
}
</style>
