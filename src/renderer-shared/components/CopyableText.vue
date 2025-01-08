<template>
  <div class="copyable">
    <span class="copyable-text">
      <template v-if="slots.default"><slot></slot></template>
      <template v-else>{{ text }}</template>
    </span>
    <NIcon :title="t('CopyableText.copy')" class="copyable-icon" @click.stop="handleCopy"
      ><CopyIcon
    /></NIcon>
  </div>
</template>

<script setup lang="ts">
import { Copy as CopyIcon } from '@vicons/carbon'
import { useTranslation } from 'i18next-vue'
import { NIcon, useMessage } from 'naive-ui'
import { useSlots } from 'vue'

const {
  showMessage = true,
  prefix = '',
  suffix = '',
  text: propText
} = defineProps<{
  text?: string | number
  showMessage?: boolean
  prefix?: string
  suffix?: string
}>()

const { t } = useTranslation()

const emits = defineEmits<{
  (e: 'copy', text: string): void
  (e: 'error', err: any): void
}>()

const slots = useSlots()
const message = useMessage()

const handleCopy = async () => {
  let text = ''
  if (slots.default) {
    if (propText) {
      text = propText.toString()
    } else {
      const nodes = slots.default({})
      if (nodes[0] && typeof nodes[0].children === 'string') {
        text = nodes[0].children
      }
    }
  } else {
    text = propText?.toString() || ''
  }

  try {
    await navigator.clipboard.writeText(prefix + text + suffix)

    if (showMessage) {
      message.success(t('CopyableText.copied'), {
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
