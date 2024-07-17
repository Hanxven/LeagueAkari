<template>
  <OrderedChampionListNew
    v-model:champions="champions2"
    v-model:modal-show="show"
  ></OrderedChampionListNew>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import OrderedChampionListNew from '@main-window/components/OrderedChampionListNew.vue'

const champions2 = ref<number[]>([])
const show = ref(false)
</script>

<style lang="less" scoped></style>
