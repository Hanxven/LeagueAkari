<template>
  <NModal size="small" v-model:show="show">
    <div class="standalone-card-wrapper" @click.self="handleHideModal">
      <MatchHistoryCard
        class="card"
        v-if="showingGame"
        :game="showingGame"
        :self-puuid="selfPuuid"
        :is-detailed="true"
        :is-loading="!game && isLoading"
        :is-expanded="selfPuuid ? isExpanded : true"
        @set-show-detailed-game="(_, expand) => (isExpanded = expand)"
        @to-summoner="emits('toSummoner', $event)"
      />
      <div class="placeholder" v-else>
        <span>{{
          isFailedToLoad
            ? isNotFound
              ? t('StandaloneMatchHistoryCardModal.notFound')
              : t('StandaloneMatchHistoryCardModal.error')
            : t('StandaloneMatchHistoryCardModal.loading')
        }}</span>
        <NButton
          :disabled="!gameId || isNotFound"
          size="small"
          secondary
          v-if="isFailedToLoad"
          @click="() => handleReload()"
          >{{ t('StandaloneMatchHistoryCardModal.reload') }}</NButton
        >
      </div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import MatchHistoryCard from '@renderer-shared/components/match-history-card/MatchHistoryCard.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { Game } from '@shared/types/league-client/match-history'
import { AxiosError } from 'axios'
import { useTranslation } from 'i18next-vue'
import { NButton, NModal, useNotification } from 'naive-ui'
import { computed, ref, shallowRef, watch } from 'vue'

const {
  source = 'lcu',
  game,
  gameId: propGameId,
  selfPuuid
} = defineProps<{
  game?: Game | null
  gameId?: number
  selfPuuid?: string
  source?: 'lcu' | 'sgp'
}>()

const emits = defineEmits<{
  toSummoner: [puuid: string]
}>()

const { t } = useTranslation()

const lc = useInstance(LeagueClientRenderer)
const sgp = useInstance(SgpRenderer)
const sgps = useSgpStore()
const lcs = useLeagueClientStore()

const notification = useNotification()

const show = defineModel<boolean>('show', { default: false })

const uncontrolledData = shallowRef<Game | null>(null)
const isExpanded = ref(true)
const isLoading = ref(false)
const isFailedToLoad = ref(false)
const isNotFound = ref(false)

const isAbleToUseSgpApi = computed(() => {
  return source === 'sgp' && sgps.availability.serversSupported.matchHistory && sgps.isTokenReady
})

const showingGame = computed(() => {
  return game || uncontrolledData.value || null
})

const fetchGame = async (gameId: number, useSgpApi = false) => {
  if (isLoading.value) {
    return
  }

  isLoading.value = true
  isFailedToLoad.value = false
  isNotFound.value = false
  try {
    const g = useSgpApi
      ? await sgp.getGameSummaryLcuFormat(gameId)
      : (await lc.api.matchHistory.getGame(gameId)).data
    if (g.gameId === gameId) {
      uncontrolledData.value = g
    }
  } catch (error) {
    isFailedToLoad.value = true

    if (error instanceof AxiosError && error?.response?.status === 404) {
      isNotFound.value = true
    }

    notification.warning({
      title: () =>
        t('StandaloneMatchHistoryCardModal.errorNotification.title', {
          gameId
        }),
      content: () =>
        t('StandaloneMatchHistoryCardModal.errorNotification.description', {
          reason: (error as Error).message
        })
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
  if (!propGameId || game) {
    return
  }
  await fetchGame(propGameId, isAbleToUseSgpApi.value)
}

watch(
  [() => game, () => propGameId, () => selfPuuid, () => isAbleToUseSgpApi.value, () => show.value],
  ([game, gameId, _selfId, useSgpApi, show]) => {
    if (game) {
      return
    }

    uncontrolledData.value = null

    if (gameId && lcs.isConnected && show) {
      fetchGame(gameId, useSgpApi)
      isExpanded.value = true
    }
  },
  { immediate: true }
)
</script>

<style lang="less" scoped>
.standalone-card-wrapper {
  position: relative;
  overflow: auto;
  top: calc(var(--title-bar-height) / 2);

  :deep(.v-binder-follower-container) {
    position: fixed;
  }
}

.card {
  max-height: 90vh;
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
