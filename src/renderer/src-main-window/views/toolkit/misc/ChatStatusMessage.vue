<template>
  <NCard size="small">
    <template #header><span class="card-header-title">聊天签名</span></template>
    <ControlItem label="设置聊天签名" class="control-item-margin" :label-width="200">
      <NButton
        :loading="isSetting"
        @click="handleSetChatStatusMessage"
        type="primary"
        size="small"
        :disabled="lc.state !== 'connected'"
        >设置</NButton
      >
    </ControlItem>
    <ControlItem
      label="文本行"
      class="control-item-margin"
      label-description="聊天状态文本。设置空值则为删除"
      :label-width="200"
    >
      <NInput
        style="width: 360px; font-family: monospace"
        type="textarea"
        v-model:value="text"
        :autosize="{ maxRows: 3, minRows: 1 }"
        placeholder="提供文本"
        size="small"
      ></NInput>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { setChatStatusMessage } from '@renderer-shared/http-api/chat'
import { useLcuConnectionStore } from '@renderer-shared/modules/lcu-connection/store'
import { NButton, NCard, NInput, useMessage } from 'naive-ui'
import { ref } from 'vue'

const lc = useLcuConnectionStore()

const text = ref('')
const isSetting = ref(false)
const message = useMessage()

const handleSetChatStatusMessage = async () => {
  if (isSetting.value) {
    return
  }

  try {
    isSetting.value = true
    await setChatStatusMessage(text.value)
    message.success('已设置')
  } catch (error) {
    console.warn(error)
    message.warning('尝试设置签名时出现问题')
  } finally {
    isSetting.value = false
  }
}
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
