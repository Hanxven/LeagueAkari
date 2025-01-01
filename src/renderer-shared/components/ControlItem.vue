<template>
  <div class="control-item" :class="{ [`align-${align}`]: align }">
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
    <div class="control"><slot name="default"></slot></div>
  </div>
</template>

<script setup lang="ts">
const { align = 'center' } = defineProps<{
  labelWidth?: number
  align?: 'center' | 'start'
  label?: string
  labelDescription?: string
  disabled?: boolean
}>()
</script>

<style lang="less" scoped>
.control-item {
  display: flex;
  width: fit-content;
  width: 100%;

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
    color: #fff;
    transition: color 0.3s ease;
  }

  .label.disabled {
    color: rgb(97, 97, 97);
  }

  .label-description {
    color: rgb(198, 198, 198);
    transition: color 0.3s ease;
    font-size: 13px;
    margin-top: 2px;
  }

  .label-description.disabled {
    color: rgb(97, 97, 97);
  }

  .control {
    flex: 1;
  }
}
</style>
