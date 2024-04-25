<template>
  <div class="perks-panel">
    <div class="major"></div>
    <div class="sub-container">
      <div class="sub"></div>
      <div class="mod"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 20240114 规则，此规则会变动，参照最新版本
// 主系选四个，每行选一个
// 副系三行选两行，每行选一个
// 属性栏三行选三个，每行选一个
const perks = defineModel<number[]>('perks', { default: () => [] })
</script>

<style lang="less" scoped>
.perks-panel {
  display: flex;
}
</style>
