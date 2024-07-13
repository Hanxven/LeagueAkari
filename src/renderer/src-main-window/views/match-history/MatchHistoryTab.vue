<template>
  <div class="match-history-wrapper" ref="wrapperEl">
    <div class="match-history-inner">
      <PlayerTagEditModal
        :puuid="tab.puuid"
        v-model:show="isShowingTagEditModal"
        @edited="(id) => handleTagEdited(id)"
      />
      <DefinePageMeta>
        <div class="match-history-page-meta">
          <div class="pagination-line">
            <div class="text">
              <span
                >每页 {{ tab.matchHistory.pageSize }} 条，当前第
                {{ tab.matchHistory.page }} 页</span
              >
              <span style="margin-left: 16px" v-if="tab.matchHistory.lastUpdate"
                >更新时间：{{
                  dayjs(tab.matchHistory.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
                }}</span
              >
              <span style="margin-left: 16px" v-if="tab.loading.isLoadingMatchHistory"
                >加载中...</span
              >
            </div>
            <div class="pagination">
              <NSelect
                placeholder="队列"
                size="small"
                :render-label="renderLabel"
                class="type-select"
                :disabled="tab.loading.isLoadingMatchHistory"
                :options="queueOptions"
                :value="tab.matchHistory.queueFilter"
                @update:value="(val: number) => mh.setQueueFilter(tab.puuid, val)"
              />
              <NButton
                size="small"
                title="切换到上一页 (Ctrl+Left)"
                @click="handleLoadPage(tab.matchHistory.page - 1)"
                :disabled="tab.matchHistory.page <= 1 || tab.loading.isLoadingMatchHistory"
                secondary
                >上</NButton
              >
              <NInputNumber
                size="small"
                placeholder=""
                style="flex-shrink: 0"
                v-model:value="inputtingText"
                @blur="handleInputBlur"
                @keyup.enter="() => handleLoadPage(inputtingText || 1)"
                :disabled="tab.loading.isLoadingMatchHistory"
                class="page"
                :min="1"
                :show-button="false"
              />
              <NButton
                title="切换到下一页 (Ctrl+Right)"
                size="small"
                @click="() => handleLoadPage(tab.matchHistory.page + 1)"
                :disabled="tab.loading.isLoadingMatchHistory"
                secondary
                >下</NButton
              >
              <NSelect
                :value="tab.matchHistory.pageSize"
                @update:value="handleChangePageSize"
                :disabled="tab.loading.isLoadingMatchHistory"
                class="page-select"
                size="small"
                :options="pageSizeOptions"
              ></NSelect>
            </div>
          </div>
        </div>
      </DefinePageMeta>
      <div class="user-profile" v-if="tab.summoner && tab.rankedStats">
        <div class="avatar">
          <LcuImage
            class="image"
            :src="`/lol-game-data/assets/v1/profile-icons/${tab.summoner.profileIconId}.jpg`"
          />
          <div class="level">{{ tab.summoner.summonerLevel }}</div>
        </div>
        <div class="name-area">
          <div class="name-line">
            <CopyableText
              class="summoner-name"
              :text="
                summonerName(
                  tab.summoner.gameName || tab.summoner.displayName,
                  tab.summoner.tagLine
                )
              "
            >
              {{ tab.summoner.gameName || tab.summoner.displayName
              }}<span v-if="tab.summoner.tagLine" class="tag-line"
                >#{{ tab.summoner.tagLine }}</span
              >
            </CopyableText>
            <CopyableText class="summoner-id" :text="tab.summoner.summonerId"
              >ID: {{ tab.summoner.summonerId }}</CopyableText
            >
            <CopyableText class="summoner-puuid" :text="tab.summoner.puuid">PUUID</CopyableText>
            <div
              class="summoner-dices"
              :title="`有 ${tab.summoner.rerollPoints.numberOfRolls} 重随次数 (${tab.summoner.rerollPoints.currentPoints}/${tab.summoner.rerollPoints.pointsCostToRoll})`"
              v-if="isSelfTab"
            >
              <NIcon class="dice-icon"><DiceIcon /></NIcon>
              <span class="dice-count">{{ tab.summoner.rerollPoints.numberOfRolls }}</span>
            </div>
            <div title="标记玩家" class="tag" v-if="!isSelfTab" @click="handleTagPlayer">
              <NIcon><EditIcon /></NIcon>
              <span class="tagged" v-if="tab.savedInfo?.tag">已标记</span>
              <span class="untagged" v-else>标记</span>
            </div>
          </div>
          <RankedSpan v-if="tab.rankedStats" :ranked="tab.rankedStats" />
          <div v-else class="summoner-rank-placeholder">无段位</div>
        </div>
      </div>
      <div v-else class="user-profile-skeleton">
        <div class="avatar-skeleton" style="display: flex; align-items: center">
          <NSkeleton style="flex-shrink: 0; height: 60px; width: 60px" />
          <div
            class="name-skeleton"
            style="display: flex; flex-direction: column; gap: 8px; margin-left: 8px"
          >
            <NSkeleton style="height: 20px; width: 340px" />
            <NSkeleton style="height: 16px; width: 440px" />
          </div>
        </div>
      </div>
      <div
        v-if="!isSelfTab && tab.summoner && tab.summoner.privacy === 'PRIVATE'"
        class="statistics-block privacy-private-alert"
      >
        <div class="title">生涯隐藏</div>
        <div class="content">
          {{
            app.settings.isInKyokoMode
              ? hideMatchHistoryText(tab.summoner.summonerId)
              : '该名玩家未公开生涯'
          }}
        </div>
      </div>
      <div class="statistics-block tag-text" v-if="!isSelfTab && tab.savedInfo?.tag">
        <div class="title">已标记的玩家</div>
        <div class="content tag-text-scroll-area">{{ tab.savedInfo.tag }}</div>
      </div>
      <div class="statistics-block statistics" v-if="false">
        <div class="title">对局历史</div>
        <div class="content">
          本页遇到过 xx 次，历史遇到过 xx 次。 作为队友 x 次。W - L 作为对手 x 次。W - L
        </div>
      </div>
      <PageMeta position="top" />
      <div v-show="filteredGameInfo.filteredCount" class="match-history-list">
        <MatchHistoryCard
          class="match-history-card-item"
          @set-show-detailed-game="handleToggleShowDetailedGame"
          @load-detailed-game="(gameId) => mhm.fetchTabDetailedGame(tab.puuid, gameId)"
          :self-puuid="tab.puuid"
          :is-detailed="g.isDetailed"
          :is-loading="g.isLoading"
          :is-expanded="g.isExpanded"
          :game="g.game"
          v-for="g of filteredGameInfo.all"
          v-show="g.show"
          :key="g.game.gameId"
        />
      </div>
      <div
        v-if="filteredGameInfo.filteredCount === 0 && tab.loading.isLoadingMatchHistory"
        class="match-history-empty"
      >
        <NCard size="small">加载中</NCard>
      </div>
      <div v-else-if="tab.matchHistory.isEmpty" class="match-history-empty">
        <NCard size="small">本页暂无战绩</NCard>
      </div>
      <div v-else-if="filteredGameInfo.filteredCount === 0" class="match-history-empty">
        <NCard size="small">本页没有符合筛选条件的目标</NCard>
      </div>
      <PageMeta v-if="filteredGameInfo.filteredCount >= 5" position="bottom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import CopyableText from '@shared/renderer/components/CopyableText.vue'
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import { useAppStore } from '@shared/renderer/modules/app/store'
import { useGameDataStore } from '@shared/renderer/modules/lcu-state-sync/game-data'
import { hideMatchHistoryText } from '@shared/renderer/utils/sarcasms'
import { summonerName } from '@shared/utils/name'
import { Edit20Filled as EditIcon } from '@vicons/fluent'
import { Dice as DiceIcon } from '@vicons/ionicons5'
import { createReusableTemplate, useDebounce, useScroll } from '@vueuse/core'
import { useMagicKeys, whenever } from '@vueuse/core'
import dayjs from 'dayjs'
import { NButton, NCard, NIcon, NInputNumber, NSelect, NSkeleton, SelectOption } from 'naive-ui'
import { VNodeChild, computed, h, nextTick, onActivated, ref, watch } from 'vue'

import PlayerTagEditModal from '@main-window/components/PlayerTagEditModal.vue'
import { matchHistoryTabsRendererModule as mhm } from '@main-window/modules/match-history-tabs'
import { TabState, useMatchHistoryTabsStore } from '@main-window/modules/match-history-tabs/store'

import MatchHistoryCard from './card/MatchHistoryCard.vue'
import RankedSpan from './widgets/RankedSpan.vue'

const [DefinePageMeta, PageMeta] = createReusableTemplate<{
  position: 'bottom' | 'top'
}>({ inheritAttrs: false })

/*
 * 内部组件，用于 MatchHistoryTabs 的子组件
 */
const props = withDefaults(
  defineProps<{
    tab: TabState
    isSelfTab?: boolean
  }>(),
  {
    isSelfTab: false
  }
)

const mh = useMatchHistoryTabsStore()
const gameData = useGameDataStore()
const app = useAppStore()

const handleLoadPage = async (page: number) => {
  const r = await mhm.fetchTabMatchHistory(
    props.tab.puuid,
    page,
    props.tab.matchHistory.pageSize,
    props.tab.matchHistory.queueFilter
  )
  scrollToTop()
  return r
}

const inputtingText = ref(props.tab.matchHistory.page)

const handleInputBlur = () => {
  inputtingText.value = props.tab.matchHistory.page
}

watch(
  () => props.tab.matchHistory.page,
  (page) => {
    inputtingText.value = page
  }
)

const pageSizeOptions = [
  {
    label: '10 条 / 页',
    value: 10
  },
  {
    label: '20 条 / 页',
    value: 20
  },
  {
    label: '50 条 / 页',
    value: 50
  },
  {
    label: '100 条 / 页',
    value: 100
  }
]

const queueOptions = computed(() => {
  return [
    {
      label: '所有',
      value: -1
    },
    {
      label: gameData.queues[0]?.name || 'Custom',
      value: 0
    },
    {
      label: gameData.queues[420]?.name || 'Ranked Solo/Duo',
      value: 420
    },
    {
      label: gameData.queues[430]?.name || 'Normal',
      value: 430
    },
    {
      label: gameData.queues[440]?.name || 'Ranked Flex',
      value: 440
    },
    {
      label: gameData.queues[450]?.name || 'ARAM',
      value: 450
    },

    {
      label: gameData.queues[1700]?.name || 'ARENA',
      value: 1700
    },
    {
      label: gameData.queues[490]?.name || 'Quickplay',
      value: 490
    },
    {
      label: gameData.queues[1900]?.name || 'URF',
      value: 1900
    },
    {
      label: gameData.queues[900]?.name || 'ARURF',
      value: 900
    },
    {
      label: gameData.queues[1810]?.name || 'Swarm',
      value: '1810,1820,1830,1840,1850,1860,1870,1880,1890'
    }
  ]
})

const currentPageGameTypes = computed(() => {
  const types = new Set<number>()
  types.add(-1)
  for (const g of props.tab.matchHistory.games) {
    types.add(g.game.queueId)
  }
  return types
})

const renderLabel = (option: SelectOption): VNodeChild => {
  if (typeof option.value === 'string') {
    const ids = option.value.split(',').map(Number)
    if (ids.some((id) => currentPageGameTypes.value.has(id))) {
      return option.label as string
    }
  }

  if (typeof option.value === 'number' && currentPageGameTypes.value.has(option.value as number)) {
    return option.label as string
  }

  return h(
    'span',
    { style: 'color: #999', title: `本页无 ${option.label} 对局` },
    option.label as string
  )
}

const filteredGameInfo = computed(() => {
  const all = props.tab.matchHistory.games.map((g) => {
    if (props.tab.matchHistory.queueFilter === -1) {
      return { ...g, show: true }
    }

    const filter = props.tab.matchHistory.queueFilter
    if (typeof filter === 'string') {
      return { ...g, show: filter.split(',').map(Number).includes(g.game.queueId) }
    } else {
      return { ...g, show: g.game.queueId === filter }
    }
  })

  return {
    all,
    filteredCount: all.filter((g) => g.show).length
  }
})

const { Ctrl_Left, Ctrl_Right, F5 } = useMagicKeys()

whenever(Ctrl_Left, () => {
  if (props.tab.matchHistory.page > 1) {
    handleLoadPage(props.tab.matchHistory.page - 1)
  }
})

whenever(Ctrl_Right, () => {
  handleLoadPage(props.tab.matchHistory.page + 1)
})

whenever(F5, () => {
  handleLoadPage(props.tab.matchHistory.page)
})

const handleChangePageSize = async (pageSize: number) => {
  const r = await mhm.fetchTabMatchHistory(
    props.tab.puuid,
    props.tab.matchHistory.page,
    pageSize,
    props.tab.matchHistory.queueFilter
  )
  scrollToTop()
  return r
}

const isShowingTagEditModal = ref(false)

const handleTagPlayer = async () => {
  isShowingTagEditModal.value = true
}

const wrapperEl = ref<HTMLElement>()
const { x, y } = useScroll(wrapperEl)
const debouncedX = useDebounce(x, 300)
const debouncedY = useDebounce(y, 300)

watch([() => debouncedX.value, () => debouncedY.value], ([x, y]) => {
  mh.setScrollPosition(props.tab.puuid, x, y)
})

watch(
  () => props.tab.puuid,
  () => {
    nextTick(() => {
      x.value = props.tab.scrollPosition.x
      y.value = props.tab.scrollPosition.y
    })
  },
  { immediate: true }
)

onActivated(() => {
  x.value = props.tab.scrollPosition.x
  y.value = props.tab.scrollPosition.y
})

const handleToggleShowDetailedGame = (gameId: number, expand: boolean) => {
  mh.setMatchHistoryExpand(props.tab.puuid, gameId, expand)
}

const handleTagEdited = (puuid: string) => {
  mhm.querySavedInfo(puuid)
}

const scrollToTop = () => {
  wrapperEl.value?.scrollTo({
    behavior: 'smooth',
    top: 0
  })
}

defineExpose({
  id: props.tab.puuid,
  scrollToTop
})
</script>

<style lang="less" scoped>
.user-profile {
  height: 60px;
  display: flex;
  align-items: center;
  margin-top: 12px;
  margin-bottom: 24px;
}

.user-profile-skeleton {
  height: 60px;
  max-width: 500px;
  margin-top: 12px;
  margin-bottom: 24px;
}

.user-status {
  margin-bottom: 24px;
}

.name-area {
  display: flex;
  gap: 4px;
  flex-direction: column;
  margin-left: 8px;
  flex-grow: 1;

  .name-line {
    display: flex;
    align-items: center;
  }

  .summoner-dices {
    display: flex;
    align-items: center;
    gap: 2px;
    color: rgb(105, 149, 225);
    margin-left: 8px;

    .dice-icon {
      font-size: 16px;
    }

    .dice-count {
      font-size: 12px;
      line-height: 12px;
    }
  }

  .tag {
    display: flex;
    align-items: center;
    margin-left: 12px;
    font-size: 16px;
    line-height: 16px;
    color: rgb(196, 196, 196);
    cursor: pointer;

    &:hover {
      color: rgb(222, 222, 222);
    }

    transition: all 0.3s ease;

    &:hover .tagged {
      color: rgb(0, 217, 255);
    }

    &:hover .untagged {
      color: rgb(217, 217, 217);
    }

    .tagged {
      margin-left: 2px;
      font-size: 12px;
      font-weight: 700;
      color: rgb(0, 179, 255);
      transition: all 0.3s ease;
    }

    .untagged {
      margin-left: 2px;
      font-size: 12px;
      font-weight: 700;
      color: rgb(196, 196, 196);
      transition: all 0.3s ease;
    }
  }

  .summoner-name {
    font-size: 16px;
    font-weight: 700;
  }

  .tag-line {
    margin-left: 4px;
    font-size: 12px;
    font-weight: normal;
    color: rgb(178, 178, 178);
  }

  .summoner-id,
  .summoner-puuid {
    margin-left: 4px;
    font-size: 12px;
    color: rgb(159, 159, 159);
  }

  .summoner-rank-placeholder {
    font-size: 12px;
    color: rgb(159, 159, 159);
    margin-right: auto;
  }
}

.avatar {
  flex-shrink: 0;
  position: relative;
  height: 60px;
  width: 60px;

  .image {
    height: 100%;
    width: 100%;
  }

  .level {
    position: absolute;
    bottom: 0px;
    left: 50%;
    background-color: rgba(0, 0, 0, 0.621);
    color: white;
    font-size: 10px;
    padding: 0px 4px;
    border-radius: 4px;

    transform: translate(-50%, 50%);
  }
}

.controls {
  margin-top: 8px;
}

.pagination-line {
  display: flex;
  align-items: center;

  @media screen and (max-width: 735px) {
    flex-direction: column-reverse;
    gap: 4px;

    .text {
      margin-left: auto;
    }
  }
}

.analysis-line {
  margin-top: 8px;
}

.match-history-page-meta {
  margin-bottom: 16px;
  color: rgb(159, 159, 159);
  font-size: 12px;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;

  .page {
    width: 42px;
  }

  .page-select {
    width: 120px;
  }

  .type-select {
    width: 128px;
  }
}

.match-history-card-item:not(:last-child) {
  margin-bottom: 4px;
}

.match-history-card-item:last-child {
  margin-bottom: 24px;
}

.match-history-inner {
  position: relative;
  min-width: 760px;
  max-width: 840px;
  margin: 0 auto;

  // @media (min-width: 1000px) {
  //   padding: 24px;
  // }
}

.match-history-wrapper {
  position: relative;
  padding: 0 24px;
  max-height: 100%;
  box-sizing: border-box;
  overflow-y: scroll;
}

.statistics-block {
  border-radius: 4px;
  padding: 8px 16px;
  color: rgb(255, 255, 255);
  margin-bottom: 12px;

  .title {
    font-size: 14px;
    font-weight: 700;
  }

  .content {
    margin-top: 4px;
    font-size: 12px;
  }
}

.privacy-private-alert {
  background-color: rgba(100, 14, 14, 0.6);
}

.tag-text {
  white-space: pre-wrap;
  background-color: rgba(0, 64, 125, 0.6);

  .tag-text-scroll-area {
    position: relative;
    overflow: auto;
    max-height: 100px;

    &::-webkit-scrollbar-thumb {
      background-color: rgba(255, 255, 255, 0.4);
    }
  }
}
</style>
