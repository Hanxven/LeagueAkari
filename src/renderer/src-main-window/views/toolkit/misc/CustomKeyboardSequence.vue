<template>
  <NCard size="small">
    <template #header
      ><span class="card-header-title" :class="{ disabled: !app.isAdministrator }">{{
        app.isAdministrator ? '自定义发送文本' : '自定义发送文本 (需要管理员权限)'
      }}</span></template
    >
    <ControlItem
      :disabled="!app.isAdministrator"
      label="开启"
      class="control-item-margin"
      label-description="在游戏中使用 Delete 键"
      :label-width="200"
    >
      <NSwitch
        :disabled="!app.isAdministrator"
        @update:value="(v) => cksm.setEnabled(v)"
        :value="cks.settings.enabled"
        size="small"
      ></NSwitch>
    </ControlItem>
    <ControlItem
      :disabled="!app.isAdministrator"
      label="文本行"
      class="control-item-margin"
      label-description="自定义模拟键盘在游戏中发送输入，按行分配，空行将被忽略"
      :label-width="200"
    >
      <NInput
        :disabled="!app.isAdministrator"
        style="width: 360px; font-family: monospace"
        type="textarea"
        :value="cks.settings.text"
        :autosize="{ maxRows: 4, minRows: 3 }"
        placeholder="提供文本行"
        @update:value="(text) => cksm.setText(text)"
        size="small"
      ></NInput>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useAppStore } from '@renderer-shared/modules/app/store'
import { customKeyboardSequenceRendererModule as cksm } from '@renderer-shared/modules/custom-keyboard-sequence'
import { useCustomKeyboardSequenceStore } from '@renderer-shared/modules/custom-keyboard-sequence/store'
import { useLcuConnectionStore } from '@renderer-shared/modules/lcu-connection/store'
import { NCard, NInput, NSwitch } from 'naive-ui'

const cks = useCustomKeyboardSequenceStore()
const app = useAppStore()
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

.card-header-title.disabled {
  color: rgb(97, 97, 97);
}
</style>
