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
    >
      <NInput
        :disabled="!app.isAdministrator"
        style="max-width: 360px; font-family: monospace"
        type="textarea"
        :value="cks.settings.text"
        :autosize="{ maxRows: 4, minRows: 3 }"
        placeholder="提供文本行"
        @update:value="(text) => cksm.setText(text)"
        size="tiny"
      ></NInput>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import { useAppStore } from '@shared/renderer/modules/app/store'
import { customKeyboardSequenceRendererModule as cksm } from '@shared/renderer/modules/custom-keyboard-sequence'
import { useCustomKeyboardSequenceStore } from '@shared/renderer/modules/custom-keyboard-sequence/store'
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
@shared/renderer/modules/app/store@shared/renderer/modules/custom-keyboard-sequence@shared/renderer/modules/custom-keyboard-sequence/store