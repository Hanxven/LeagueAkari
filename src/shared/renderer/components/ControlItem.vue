<template>
  <div class="control-item">
    <div class="label-area" :style="{ width: `${labelWidth ?? 200}px` }">
      <div v-if="slots.label" class="label"><slot name="label"></slot></div>
      <div v-else class="label">{{ label }}</div>
      <div v-if="slots.labelDescription" class="label-description">
        <slot name="labelDescription"></slot>
      </div>
      <div v-else-if="labelDescription" class="label-description">{{ labelDescription }}</div>
    </div>
    <div class="control"><slot name="default"></slot></div>
  </div>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineProps<{
  labelWidth?: number
  label?: string
  labelDescription?: string
}>()

const slots = useSlots()
</script>

<style lang="less" scoped>
.control-item {
  display: flex;
  align-items: center;

  .label-area {
    margin-right: 24px;
    flex-shrink: 1;
  }

  .label {
    font-size: 14px;
    font-weight: 700;
    color: #fff;
  }

  .label-description {
    font-size: 12px;
    color: rgb(198, 198, 198);
    margin-top: 2px;
  }

  .control {
    flex-grow: 1;
  }
}
</style>
