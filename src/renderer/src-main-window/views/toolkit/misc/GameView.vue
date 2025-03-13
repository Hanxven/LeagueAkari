<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ t('GameView.title') }}</span>
    </template>
    <StandaloneMatchHistoryCardModal
      v-model:show="show"
      :game-id="viewingGameId"
      @to-summoner="navigateToTabByPuuid"
    />
    <ControlItem
      class="control-item-margin"
      :label="t('GameView.game.label')"
      :label-description="t('GameView.game.description')"
      :label-width="260"
    >
      <div style="display: flex; align-items: center; gap: 8px">
        <NInputNumber :show-button="false" v-model:value="gameId" size="small" />
        <NButton :disabled="!gameId" @click="handleInspect" size="small" type="primary">{{
          t('GameView.game.button')
        }}</NButton>
      </div>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import StandaloneMatchHistoryCardModal from '@renderer-shared/components/match-history-card/StandaloneMatchHistoryCardModal.vue'
import { useInstance } from '@renderer-shared/shards'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NInputNumber } from 'naive-ui'
import { ref } from 'vue'

import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'

const { t } = useTranslation()

const gameId = ref<number>()
const viewingGameId = ref<number>()
const show = ref(false)

const handleInspect = () => {
  show.value = true
  viewingGameId.value = gameId.value
}

const mh = useInstance(MatchHistoryTabsRenderer)

const { navigateToTabByPuuid } = mh.useNavigateToTab()
</script>

<style lang="less" scoped></style>
