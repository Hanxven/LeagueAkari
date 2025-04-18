<template>
  <div class="tiny-list">
    <div class="list-item" v-for="p of list" :key="p.puuid">
      <ChampionIcon class="champion-icon" round :champion-id="p.championId" />
      <div class="name-line" v-if="p.gameName" @click="navigateToTabByPuuid(p.puuid)">
        <div class="game-name">{{ p.gameName }}</div>
        <div class="tag-line" v-if="p.tagLine">#{{ p.tagLine }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useInstance } from '@renderer-shared/shards'

import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'

const { list = [] } = defineProps<{
  list?: Array<{
    puuid: string // must have
    championId?: number
    gameName?: string
    tagLine?: string
  }>
}>()

const mh = useInstance(MatchHistoryTabsRenderer)

const { navigateToTabByPuuid } = mh.useNavigateToTab()
</script>

<style lang="less" scoped>
.tiny-list {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .list-item {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .champion-icon {
    width: 24px;
    height: 24px;
  }

  .name-line {
    display: flex;
    gap: 2px;
    align-items: flex-end;
    cursor: pointer;
  }

  .game-name {
    font-size: 13px;
    font-weight: bold;
    transition: color 0.2s ease-in-out;
  }

  .tag-line {
    font-size: 12px;
    transition: color 0.2s ease-in-out;
  }
}

[data-theme='light'] {
  .name-line:hover {
    .tag-line {
      color: #000a;
    }

    .game-name {
      color: #000;
    }
  }

  .tag-line {
    color: #0008;
  }
}

[data-theme='dark'] {
  .name-line:hover {
    .tag-line {
      color: #fffa;
    }

    .game-name {
      color: #fff;
    }
  }

  .tag-line {
    color: #fff8;
  }
}
</style>
