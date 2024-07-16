<template>
  <NTransfer></NTransfer>
</template>


<script lang="ts" setup>
import { NTransfer } from 'naive-ui'

const props = withDefaults(
  defineProps<{
    value?: number[]
    maxShow?: number
    maxCount?: number
    type?: 'pick' | 'ban'
    allowEmpty?: boolean
  }>(),
  {
    maxShow: 6,
    maxCount: Infinity,
    allowEmpty: false,
    type: 'pick'
  }
)
</script>

<style lang="less" scoped></style>