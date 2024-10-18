<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :class="$style['search-summoner-modal']"
  >
    <template #header><span class="card-header-title">设置</span></template>
  </NModal>
</template>

<script setup lang="ts">
import { NModal } from 'naive-ui'

const show = defineModel<boolean>('show', { default: false })
</script>

<style lang="less" scoped></style>

<style lang="less" module>
.search-summoner-modal {
  width: 90%;
  max-width: 840px;
}
</style>
