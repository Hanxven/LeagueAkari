<template>
  <div class="match-history-wrapper" ref="wrapperEl">
    <div class="match-history-inner">
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
                `${tab.summoner.displayName || tab.summoner.gameName}${
                  tab.summoner.tagLine ? '#' + tab.summoner.tagLine : ''
                }` || '<暂无名称>'
              "
            >
              {{ tab.summoner.displayName || tab.summoner.gameName || '<暂无名称>'
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
            <!-- UNDER DEVELOPMENT -->
            <div title="标记玩家" class="tag" v-if="false && !isSelfTab" @click="handleTagPlayer">
              <NIcon><TagIcon /></NIcon>
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
      <div class="user-status" v-if="tab.summoner">
        <div v-if="!isSelfTab && tab.summoner.privacy === 'PRIVATE'" class="privacy-private-alert">
          <div class="title">生涯隐藏</div>
          <div class="content">
            {{ hideMatchHistoryText(tab.summoner.summonerId) }}
          </div>
        </div>
      </div>
      <div class="match-history-page-meta">
        <div class="pagination-line">
          <div class="text">
            <span
              >每页 {{ tab.matchHistory.pageSize }} 条，当前第 {{ tab.matchHistory.page }} 页</span
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
            <NButton
              size="small"
              title="切换到上一页 (Ctrl+Left)"
              @click="handleLoadPage(tab.matchHistory.page - 1)"
              :disabled="tab.matchHistory.page <= 1"
              secondary
              >上</NButton
            >
            <NInputNumber
              size="small"
              placeholder=""
              v-model:value="inputtingText"
              @blur="handleInputBlur"
              @keyup.enter="() => handleLoadPage(inputtingText || 1)"
              class="page"
              :min="1"
              :show-button="false"
            />
            <NButton
              title="切换到下一页 (Ctrl+Right)"
              size="small"
              @click="() => handleLoadPage(tab.matchHistory.page + 1)"
              secondary
              >下</NButton
            >
            <NSelect
              :value="tab.matchHistory.pageSize"
              @update:value="handleChangePageSize"
              class="select"
              size="small"
              :options="pageSizeOptions"
            ></NSelect>
          </div>
        </div>
      </div>
      <div v-if="tab.matchHistory.games.length !== 0" class="match-history-list">
        <MatchHistoryCard
          class="match-history-card-item"
          @set-show-detailed-game="handleToggleShowDetailedGame"
          @load-detailed-game="(gameId) => fetchTabDetailedGame(tab.id, gameId)"
          :self-id="tab.id"
          :is-detailed="g.isDetailed"
          :is-loading="g.isLoading"
          :is-expanded="g.isExpanded"
          :game="g.game"
          v-for="g of tab.matchHistory.games"
          :key="g.game.gameId"
        />
      </div>
      <div v-else-if="tab.loading.isLoadingMatchHistory" class="match-history-empty">
        <NCard size="small">加载中</NCard>
      </div>
      <div v-else-if="tab.matchHistory.isEmpty" class="match-history-empty">
        <NCard size="small">暂无战绩</NCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Tag as TagIcon } from '@vicons/carbon'
import { Dice as DiceIcon } from '@vicons/ionicons5'
import { useDebounce, useScroll } from '@vueuse/core'
import { useMagicKeys, whenever } from '@vueuse/core'
import dayjs from 'dayjs'
import { NButton, NCard, NIcon, NInputNumber, NSelect, NSkeleton } from 'naive-ui'
import { nextTick, onActivated, ref, watch } from 'vue'

import CopyableText from '@renderer/components/CopyableText.vue'
import LcuImage from '@renderer/components/LcuImage.vue'
import { fetchTabDetailedGame, fetchTabMatchHistory } from '@renderer/features/match-history'
import { TabState, useMatchHistoryStore } from '@renderer/features/stores/match-history'
import { hideMatchHistoryText } from '@renderer/utils/sarcasms'

import MatchHistoryCard from './card/MatchHistoryCard.vue'
import RankedSpan from './widgets/RankedSpan.vue'

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
const mh = useMatchHistoryStore()

const handleLoadPage = (page: number) => {
  return fetchTabMatchHistory(props.tab.id, page, props.tab.matchHistory.pageSize)
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

const { Ctrl_Left, Ctrl_Right } = useMagicKeys()

whenever(Ctrl_Left, () => {
  if (props.tab.matchHistory.page > 1) {
    handleLoadPage(props.tab.matchHistory.page - 1)
  }
})

whenever(Ctrl_Right, () => {
  handleLoadPage(props.tab.matchHistory.page + 1)
})

const handleChangePageSize = (pageSize: number) => {
  return fetchTabMatchHistory(props.tab.id, props.tab.matchHistory.page, pageSize)
}

const handleTagPlayer = async () => {
  console.log('占位用途')
}

const wrapperEl = ref<HTMLElement>()
const { x, y } = useScroll(wrapperEl)
const debouncedX = useDebounce(x, 300)
const debouncedY = useDebounce(y, 300)

watch([() => debouncedX.value, () => debouncedY.value], ([x, y]) => {
  mh.setScrollPosition(props.tab.id, x, y)
})

watch(
  () => props.tab.id,
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
  mh.setMatchHistoryExpand(props.tab.id, gameId, expand)
}

const scrollToTop = () => {
  wrapperEl.value?.scrollTo({
    behavior: 'smooth',
    top: 0
  })
}

defineExpose({
  id: props.tab.id,
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
    margin-left: 8px;

    font-size: 16px;
    color: rgb(196, 196, 196);

    &:hover {
      color: rgb(222, 222, 222);
    }
  }

  .summoner-name {
    font-size: 16px;
    font-weight: 700;
  }

  .tag-line {
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

// .match-history-list {
//   margin-top: 16px;
// }

.pagination {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;

  .page {
    width: 48px;
  }

  .select {
    width: 120px;
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

.privacy-private-alert {
  border-radius: 4px;
  background-color: rgba(100, 14, 14, 0.6);
  padding: 8px 16px;
  color: rgb(255, 255, 255);

  .title {
    font-size: 14px;
    font-weight: 700;
  }

  .content {
    margin-top: 4px;
    font-size: 12px;
  }
}
</style>
