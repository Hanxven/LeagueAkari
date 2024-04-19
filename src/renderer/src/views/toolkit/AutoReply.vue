<template>
  <NCard size="small">
    <template #header><span class="card-header-title">自动回复</span></template>
    <ControlItem label="开启" class="control-item-margin">
      <NSwitch
        @update:value="(v) => setAutoReplyEnabled(v)"
        :value="autoReply.settings.enabled"
        size="small"
      ></NSwitch>
    </ControlItem>
    <ControlItem
      label="仅在离开时"
      class="control-item-margin"
      label-description="仅在游戏状态为离开时，自动回复才会生效"
    >
      <NSwitch
        @update:value="(v) => setEnableOnAway(v)"
        :value="autoReply.settings.enableOnAway"
        size="small"
      ></NSwitch>
    </ControlItem>
    <ControlItem
      label="回复内容"
      class="control-item-margin"
      label-description="将作为自动回复的内容。注意避免敏感词"
    >
      <NInput
        :status="
          autoReply.settings.text.length === 0 && autoReply.settings.enabled ? 'warning' : 'success'
        "
        style="max-width: 360px"
        :value="autoReply.settings.text"
        @update:value="(text) => setAutoReplyText(text)"
        size="tiny"
      ></NInput>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import { NCard, NInput, NSwitch } from 'naive-ui'

import ControlItem from '@renderer/components/ControlItem.vue'
import {
  setAutoReplyEnabled,
  setAutoReplyText,
  setEnableOnAway
} from '@renderer/features/auto-reply'
import { useAutoReplyStore } from '@renderer/features/auto-reply/store'

const autoReply = useAutoReplyStore()
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
</style>
