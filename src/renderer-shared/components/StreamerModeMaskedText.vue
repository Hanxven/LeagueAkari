<template>
  <template v-if="shouldMask"><slot name="masked"></slot></template>
  <template v-else>
    <slot></slot>
  </template>
</template>

<script setup lang="ts">
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { computed } from 'vue'

const as = useAppCommonStore()
const shouldMask = computed(() => as.settings.streamerMode)
</script>
