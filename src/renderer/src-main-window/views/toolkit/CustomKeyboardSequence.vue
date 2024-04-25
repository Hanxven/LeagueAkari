<template>
  <NCard size="small">
    <template #header><span class="card-header-title">自定义发送文本</span></template>
    <ControlItem label="开启" class="control-item-margin">
      <NSwitch
        @update:value="(v) => setCksEnabled(v)"
        :value="cks.settings.enabled"
        size="small"
      ></NSwitch>
    </ControlItem>
    <ControlItem
      label="文本行"
      class="control-item-margin"
      label-description="自定义模拟键盘在游戏中发送输入，按行分配，空行将被忽略"
    >
      <NInput
        style="max-width: 360px; font-family: monospace"
        type="textarea"
        :value="cks.settings.text"
        :autosize="{ maxRows: 4, minRows: 3 }"
        placeholder="提供文本行"
        @update:value="(text) => setCksText(text)"
        size="tiny"
      ></NInput>
    </ControlItem>
    <span style="font-size: 12px; display: block; font-style: italic">仅在游戏中生效 </span>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import { setCksEnabled, setCksText } from '@shared/renderer/features/custom-keyboard-sequence'
import { useCustomKeyboardSequenceStore } from '@shared/renderer/features/custom-keyboard-sequence/store'
import { NCard, NInput, NSwitch } from 'naive-ui'

const cks = useCustomKeyboardSequenceStore()
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
