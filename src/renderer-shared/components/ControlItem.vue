<template>
  <div class="control-item" :class="{ [`align-${align}`]: align, highlight: isHighlighting }">
    <div class="label-area" :style="{ width: labelWidth ? `${labelWidth}px` : 'unset' }">
      <div v-if="$slots.label" class="label">
        <slot name="label" :disabled="disabled"></slot>
      </div>
      <div v-else class="label" :class="{ disabled: disabled }">{{ label }}</div>
      <div v-if="$slots.labelDescription" class="label-description" :class="{ disabled: disabled }">
        <slot name="labelDescription" :disabled="disabled"></slot>
      </div>
      <div v-else-if="labelDescription" class="label-description" :class="{ disabled: disabled }">
        {{ labelDescription }}
      </div>
    </div>
    <div class="control"><slot></slot></div>
  </div>
</template>

<script setup lang="ts">
import { useTimeoutFn } from '@vueuse/core'
import { ref } from 'vue'

const { align = 'center' } = defineProps<{
  labelWidth?: number
  align?: 'center' | 'start'
  label?: string
  labelDescription?: string
  disabled?: boolean
}>()

const isHighlighting = ref(false)
const highlight = () => {
  isHighlighting.value = true
  start()
}

const { start } = useTimeoutFn(() => {
  isHighlighting.value = false
}, 2500)

defineExpose({
  highlight
})

defineOptions({
  __akari_isControlItem: true
})
</script>

<style lang="less" scoped>
.control-item {
  display: flex;
  width: fit-content;
  width: 100%;
  transition: background-color 0.3s ease;

  &.align-center {
    align-items: center;
  }

  &.align-start {
    align-items: start;
  }

  .label-area {
    margin-right: 24px;
    flex-shrink: 0;
  }

  .label {
    font-size: 14px;
    font-weight: bold;
    transition: color 0.3s ease;
  }

  .label-description {
    transition: color 0.3s ease;
    font-size: 13px;
    margin-top: 2px;
  }

  .control {
    flex: 1;
  }
}

[data-theme='dark'] {
  .label {
    color: #fff;
  }

  .label.disabled {
    color: #fff8;
  }

  .label-description {
    color: #fffc;
  }

  .label-description.disabled {
    color: #fff8;
  }

  .control-item.highlight {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
}

[data-theme='light'] {
  .label {
    color: #000;
  }

  .label.disabled {
    color: #0008;
  }

  .label-description {
    color: #000c;
  }

  .label-description.disabled {
    color: #0008;
  }

  .control-item.highlight {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }
}
</style>
