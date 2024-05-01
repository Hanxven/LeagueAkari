<template>
  <div class="champ-select-wrapper">
    <BenchChampionsMini style="margin-bottom: 8px" />
    <ChampSelectActions />
  </div>
</template>

<script setup lang="ts">
import BenchChampionsMini from '@auxiliary-window/components/BenchChampionsMini.vue'
import ChampSelectActions from '@auxiliary-window/components/ChampSelectActions.vue'
</script>

<style lang="less">
.champ-select-wrapper {
  padding: 8px 12px;
}
</style>
