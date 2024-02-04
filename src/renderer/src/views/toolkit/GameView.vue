<template>
  <NCard size="small">
    <template #header><span class="card-header-title">查看游戏</span></template>
    <StandaloneMatchHistoryCardModal v-model:show="show" :game-id="gameId" />
    <ControlItem
      class="control-item-margin"
      label="游戏 ID"
      label-description="按照游戏的 ID 拉取并查看对局"
    >
      <div style="display: flex; align-items: center; gap: 8px">
        <NInputNumber :show-button="false" v-model:value="gameId" size="tiny" />
        <NButton @click="handleInspect" size="tiny" type="primary">查看</NButton>
      </div>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import { NButton, NCard, NInputNumber } from 'naive-ui'
import { ref } from 'vue'

import ControlItem from '@renderer/components/ControlItem.vue'
import StandaloneMatchHistoryCardModal from '@renderer/views/match-history/card/StandaloneMatchHistoryCardModal.vue'

// const id = 'view:toolkit:game-view'

const gameId = ref<number>()
const show = ref(false)

const handleInspect = () => {
  show.value = true
}
</script>

<style lang="less" scoped>
.control-item-margin {
  &:not(:last-child) {
    margin-bottom: 12px;
  }
}

.card-header-title {
  font-weight: bold;
  font-size: 18px;
}
</style>
