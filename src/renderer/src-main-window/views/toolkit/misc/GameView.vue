<template>
  <NCard size="small">
    <template #header><span class="card-header-title">查看游戏</span></template>
    <StandaloneMatchHistoryCardModal v-model:show="show" :game-id="viewingGameId" />
    <ControlItem
      class="control-item-margin"
      label="游戏 ID"
      label-description="按照游戏的 ID 拉取并查看对局"
    >
      <div style="display: flex; align-items: center; gap: 8px">
        <NInputNumber :show-button="false" v-model:value="gameId" size="tiny" />
        <NButton :disabled="!gameId" @click="handleInspect" size="tiny" type="primary"
          >查看</NButton
        >
      </div>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import { NButton, NCard, NInputNumber } from 'naive-ui'
import { ref } from 'vue'

import StandaloneMatchHistoryCardModal from '../../match-history/card/StandaloneMatchHistoryCardModal.vue'

const gameId = ref<number>()
const viewingGameId = ref<number>()
const show = ref(false)

const handleInspect = () => {
  show.value = true
  viewingGameId.value = gameId.value
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
