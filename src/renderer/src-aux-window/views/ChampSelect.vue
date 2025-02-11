<template>
  <NScrollbar class="champ-select-wrapper">
    <BenchChampionsMini style="margin-bottom: 4px" />
    <BenchModeAutoGrab style="margin-bottom: 4px" />
    <ChampSelectActions style="margin-bottom: 4px" />
    <SkinSelectionMini style="margin-bottom: 4px" />
    <ChampSelectOperations style="margin-bottom: 4px" />
    <BenchChampionTracker />
  </NScrollbar>
</template>

<script setup lang="ts">
import BenchChampionTracker from '@aux-window/components/BenchChampionTracker.vue'
import BenchChampionsMini from '@aux-window/components/BenchChampionsMini.vue'
import BenchModeAutoGrab from '@aux-window/components/BenchModeAutoGrab.vue'
import ChampSelectActions from '@aux-window/components/ChampSelectActions.vue'
import ChampSelectOperations from '@aux-window/components/ChampSelectOperations.vue'
import SkinSelectionMini from '@aux-window/components/SkinSelectionMini.vue'
import { NScrollbar } from 'naive-ui'
</script>

<style lang="less">
.champ-select-wrapper {
  padding: 8px 12px;
  box-sizing: border-box;
}
</style>
