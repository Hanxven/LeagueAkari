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
        @to-summoner="(puuid) => handleToSummoner(puuid)"
      />
      <div class="placeholder" v-else>
        <span>{{
          isFailedToLoad ? (isNotFound ? '对局不存在' : '无法拉取对局') : '加载中...'
        }}</span>
        <NButton
          :disabled="!props.gameId || isNotFound"
          size="small"
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
import { laNotification } from '@renderer-shared/notification'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { Game } from '@shared/types/league-client/match-history'
import { AxiosError } from 'axios'
import { NButton, NModal } from 'naive-ui'
import { computed, ref, shallowRef, watch } from 'vue'

import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'
// TODO CHANGE IT ALL
import { useMatchHistoryTabsStore } from '@main-window/shards/match-history-tabs/store'

import MatchHistoryCard from './MatchHistoryCard.vue'

const props = defineProps<{
  game?: Game | null
  gameId?: number
  selfPuuid?: string
}>()

const lc = useInstance<LeagueClientRenderer>('league-client-renderer')
const sgp = useInstance<SgpRenderer>('sgp-renderer')
const mh = useInstance<MatchHistoryTabsRenderer>('match-history-tabs-renderer')
const sgps = useSgpStore()

// 和战绩页面的设置共享
const mhs = useMatchHistoryTabsStore()

const willUseSgpApi = computed(() => {
  return mhs.settings.matchHistoryUseSgpApi && sgps.availability.serversSupported.matchHistory
})

const show = defineModel<boolean>('show', { default: false })

const uncontrolledData = shallowRef<Game | null>(null)
const isExpanded = ref(true)
const isLoading = ref(false)
const isFailedToLoad = ref(false)
const isNotFound = ref(false)

const showingGame = computed(() => {
  return props.game || uncontrolledData.value || null
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
    if (g.gameId === props.gameId) {
      uncontrolledData.value = g
    }
  } catch (error) {
    isFailedToLoad.value = true

    if (error instanceof AxiosError && error?.response?.status === 404) {
      isNotFound.value = true
    }

    laNotification.warn('战绩卡片', `对局 ${props.gameId} 加载失败`, error)
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
  if (!props.gameId || props.game) {
    return
  }
  await fetchGame(props.gameId, willUseSgpApi.value)
}

watch(
  [() => props.game, () => props.gameId, () => props.selfPuuid, () => willUseSgpApi.value],
  ([game, gameId, _selfId, useSgpApi]) => {
    if (game) {
      return
    }

    uncontrolledData.value = null

    if (gameId) {
      fetchGame(gameId, useSgpApi)
      isExpanded.value = true
    } else {
      if (show.value) {
        show.value = false
      }
    }
  },
  { immediate: true }
)

const { navigateToTabByPuuid } = mh.useNavigateToTab()

const handleToSummoner = (puuid) => {
  navigateToTabByPuuid(puuid)
}
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
