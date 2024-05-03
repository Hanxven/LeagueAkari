<template>
  <NScrollbar class="champ-select-wrapper">
    <BenchChampionsMini style="margin-bottom: 8px" />
    <BenchModeAutoGrab style="margin-bottom: 8px" />
    <ChampSelectActions style="margin-bottom: 8px" />
    <ChampSelectOperations />
  </NScrollbar>
</template>

<script setup lang="ts">
import BenchChampionsMini from '@auxiliary-window/components/BenchChampionsMini.vue'
import BenchModeAutoGrab from '@auxiliary-window/components/BenchModeAutoGrab.vue'
import ChampSelectActions from '@auxiliary-window/components/ChampSelectActions.vue'
import ChampSelectOperations from '@auxiliary-window/components/ChampSelectOperations.vue'

import { NScrollbar } from 'naive-ui'
</script>

<style lang="less">
.champ-select-wrapper {
  padding: 8px 12px;
  box-sizing: border-box;
}
</style>
