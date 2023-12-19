<template>
  <NCard size="small">
    <template #header><span class="card-header-title">自动回复</span></template>
    <div class="control-line">
      <span class="label">开启</span>
      <NSwitch
        @update:value="(v) => setAutoReply(v)"
        :value="settings.autoReply.enabled"
        size="small"
      ></NSwitch>
    </div>
    <div class="control-line">
      <span class="label">仅在离开时</span>
      <NSwitch
        @update:value="(v) => setEnableOnAway(v)"
        :value="settings.autoReply.enableOnAway"
        size="small"
      ></NSwitch>
    </div>
    <div class="control-line">
      <span class="label">自动回复文本</span>
      <NInput
        :status="
          settings.autoReply.text.length === 0 && settings.autoReply.enabled ? 'warning' : 'success'
        "
        style="max-width: 460px"
        :value="settings.autoReply.text"
        @update:value="(text) => setAutoReplyText(text)"
        size="tiny"
      ></NInput>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { NCard, NInput, NSwitch } from 'naive-ui'

import { setAutoReply, setAutoReplyText, setEnableOnAway } from '@renderer/features/auto-reply'
import { useSettingsStore } from '@renderer/features/stores/settings'

// const id = 'view:toolkit:auto-reply'

const settings = useSettingsStore()
</script>

<style lang="less" scoped>
@import './style.less';
</style>
