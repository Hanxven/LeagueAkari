<template>
  <NModal preset="card" :show="show" @update:show="(show) => emits('update:show', show)">
    仍在开发中。这个东西的作用是标记一名玩家。
  </NModal>
</template>

<script setup lang="ts">
import { NModal } from 'naive-ui'

const { show = false } = defineProps<{
  show: boolean
}>()

const emits = defineEmits<{
  (e: 'update:show', show: boolean)
}>()
</script>

<style lang="less" scoped></style>
