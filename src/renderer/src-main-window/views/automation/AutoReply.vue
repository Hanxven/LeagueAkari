<template>
  <NCard size="small">
    <template #header><span class="card-header-title">自动回复</span></template>
    <ControlItem label="开启" class="control-item-margin">
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
    >
      <NInput
        :status="ar.settings.text.length === 0 && ar.settings.enabled ? 'warning' : 'success'"
        style="max-width: 360px"
        :value="ar.settings.text"
        @update:value="(text) => arm.setText(text)"
        size="tiny"
      ></NInput>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import { autoReplyRendererModule as arm } from '@shared/renderer/modules/auto-reply'
import { useAutoReplyStore } from '@shared/renderer/modules/auto-reply/store'
import { NCard, NInput, NSwitch } from 'naive-ui'

const ar = useAutoReplyStore()
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
