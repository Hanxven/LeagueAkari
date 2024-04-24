<template>
  <div class="copyable">
    <span class="copyable-text">
      <template v-if="slots.default"><slot></slot></template>
      <template v-else>{{ text }}</template>
    </span>
    <NIcon title="复制" class="copyable-icon" @click="handleCopy"><CopyIcon /></NIcon>
  </div>
</template>

<script setup lang="ts">
import { Copy as CopyIcon } from '@vicons/carbon'
import { NIcon, useMessage } from 'naive-ui'
import { useSlots } from 'vue'

const props = withDefaults(
  defineProps<{
    text?: string | number
    showMessage?: boolean
    prefix?: string
    suffix?: string
  }>(),
  {
    showMessage: true,
    prefix: '',
    suffix: ''
  }
)

const emits = defineEmits<{
  (e: 'copy', text: string): void
  (e: 'error', err: any): void
}>()

const slots = useSlots()
const message = useMessage()

const handleCopy = async () => {
  let text = ''
  if (slots.default) {
    if (props.text) {
      text = props.text.toString()
    } else {
      const nodes = slots.default()
      if (nodes[0] && typeof nodes[0].children === 'string') {
        text = nodes[0].children
      }
    }
  } else {
    text = props.text?.toString() || ''
  }

  try {
    await navigator.clipboard.writeText(props.prefix + text + props.suffix)

    if (props.showMessage) {
      message.success('已复制', {
        duration: 1000
      })
    }

    emits('copy', text)
  } catch (error) {
    emits('error', error)
  }
}
</script>

<style lang="less" scoped>
.copyable-text {
  margin-right: 4px;
}

.copyable {
  display: flex;
  align-items: center;
}

.copyable-icon {
  cursor: pointer;
  font-size: 12px;
  color: rgb(212, 212, 212);
  transition: all 0.3s ease;
}

.copyable-icon:hover {
  cursor: pointer;
  color: rgb(162, 162, 162);
}
</style>
