<template>
  <NModal size="small" v-model:show="show">
    <div class="wrapper" @click.self="handleHideModal">
      <MatchHistoryCard
        class="card"
        v-if="game"
        :game="game"
        :self-id="selfId"
        :is-detailed="true"
        :is-loading="isLoading"
        :is-expanded="selfId ? isExpanded : true"
        @set-show-detailed-game="(_, expand) => (isExpanded = expand)"
      />
      <div class="placeholder" v-else>
        <span>{{
          isFailedToLoad ? (isNotFound ? '对局不存在' : '无法拉取对局') : '加载中...'
        }}</span>
        <NButton
          :disabled="!props.gameId || isNotFound"
          size="tiny"
          secondary
          v-if="isFailedToLoad"
          @click="() => handleReload()"
          >重新拉取</NButton
        >
      </div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { NButton, NModal } from 'naive-ui'
import { ref, shallowRef, watch } from 'vue'

import { notify } from '@renderer/events/notifications'
import { LcuHttpError } from '@renderer/http-api/common'
import { getGame } from '@renderer/http-api/match-history'
import { Game } from '@renderer/types/match-history'

import MatchHistoryCard from './MatchHistoryCard.vue'

const id = 'comp:standalone-match-history-card-modal'

const props = defineProps<{
  gameId?: number
  selfId?: number
}>()

const show = defineModel<boolean>('show', { default: false })

const game = shallowRef<Game | null>(null)
const isExpanded = ref(true)
const isLoading = ref(false)
const isFailedToLoad = ref(false)
const isNotFound = ref(false)

const fetchGame = async (gameId: number) => {
  if (isLoading.value) {
    return
  }

  isLoading.value = true
  isFailedToLoad.value = false
  isNotFound.value = false
  try {
    const g = (await getGame(gameId)).data
    if (g.gameId === props.gameId) {
      game.value = g
    }
  } catch (err) {
    isFailedToLoad.value = true

    if (err instanceof LcuHttpError && err?.response?.status === 404) {
      isNotFound.value = true
    }

    notify.emit({
      id,
      content: `对局 ${props.gameId} 加载失败`,
      extra: { error: err },
      silent: true
    })
  } finally {
    isLoading.value = false
  }
}

// 为了 popover 能够更好地显示，Modal 占满屏幕
// 但是点击空白处，应该能退出
const handleHideModal = () => {
  show.value = false
}

const handleReload = async () => {
  if (!props.gameId) {
    return
  }
  await fetchGame(props.gameId)
}

watch(
  [() => props.gameId, () => props.selfId],
  ([gameId, _selfId]) => {
    game.value = null

    if (gameId) {
      fetchGame(gameId)
      isExpanded.value = true
    } else {
      if (show.value) {
        show.value = false
      }
    }
  },
  { immediate: true }
)
</script>

<style lang="less" scoped>
.wrapper {
  padding: 12px;
  position: relative;
  overflow: auto;
  top: calc(var(--app-title-bar-height) / 2);

  :deep(.v-binder-follower-container) {
    position: fixed;
  }
}

.card {
  max-width: 840px;
  min-width: 760px;
  max-height: 80vh;
  min-height: 30vh;
  margin: auto;
}

.placeholder {
  background-color: rgb(52, 52, 52);
  border-radius: 4px;
  max-width: 840px;
  min-width: 760px;
  height: 96px;
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  margin: auto;
}
</style>
