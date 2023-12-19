<template>
  <NCard size="small">
    <template #header><span class="card-header-title">查看游戏</span></template>
    <StandaloneMatchHistoryCardModal v-model:show="show" :game-id="gameId" />
    <div class="control-line">
      <span class="label">游戏 ID</span>
      <div style="display: flex; align-items: center; gap: 8px">
        <NInputNumber :show-button="false" v-model:value="gameId" size="tiny" />
        <NButton @click="handleInspect" size="tiny" type="primary">查看</NButton>
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { NButton, NCard, NInputNumber } from 'naive-ui'
import { ref } from 'vue'

import StandaloneMatchHistoryCardModal from '@renderer/views/match-history/card/StandaloneMatchHistoryCardModal.vue'

// const id = 'view:toolkit:game-view'

const gameId = ref<number>()
const show = ref(false)

const handleInspect = () => {
  show.value = true
}
</script>

<style lang="less" scoped>
@import './style.less';
</style>
