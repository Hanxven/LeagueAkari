<template>
  <NTransfer
    v-model:value="champions"
    :options="championOptions"
    :render-source-label="renderSourceLabel"
  />
</template>

<script lang="ts" setup>
import { NTransfer, TransferRenderSourceLabel } from 'naive-ui'
import { h, ref } from 'vue'

const champions = ref<number[]>([1])

const championOptions = ref([
  { value: 1, label: 'Ashe' },
  { value: 2, label: 'Darius' },
  { value: 3, label: 'Draven' },
  { value: 4, label: 'Jinx' },
  { value: 5, label: 'Katarina' },
  { value: 6, label: 'Riven' },
  { value: 7, label: 'Sylas' },
  { value: 8, label: 'Yasuo' },
  { value: 9, label: 'Zed' }
])

const renderSourceLabel: TransferRenderSourceLabel = (props) => {
  return h('div', null, props.option.label)
}
</script>

<style lang="less" scoped></style>
