<template>
  <div class="wrapper">
    <div class="champion-overview">
      <div>头像</div>
      <div>召唤师名</div>
      <div>胜率</div>
      <div>登场率</div>
    </div>
    <div class="summoner-spells"></div>
    <div class="perks"></div>
    <div class="skill-builds"></div>
    <div class="items-builds"></div>
  </div>
</template>

<script setup lang="ts">
// 适用于数据源 OP.GG 的适配页面
import { OpggDataSource } from '@shared/external-data-source/opgg'
import { externalDataSourceRendererModule as edsm } from '@shared/renderer/modules/external-data-source'
import { ref, shallowRef, watchEffect } from 'vue'

const currentMode = ref<string | null>()
const currentModeTierData = shallowRef()

// 独立使用的外部数据源
const opggSource = new OpggDataSource()

watchEffect(() => {})
</script>

<style scoped lang="less"></style>
