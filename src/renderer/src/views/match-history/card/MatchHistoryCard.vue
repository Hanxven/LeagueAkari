<template>
  <div class="match-history-card-wrapper">
    <NModal size="small" v-model:show="isModalShow">
      <MiscellaneousPanel :game="game" />
    </NModal>
    <div v-if="self" class="match-history-card" :class="composedResultClass">
      <div class="game">
        <div class="mode">
          {{ formattedModeText }}
        </div>
        <NTooltip placement="top-start" :delay="300">
          <template #trigger>
            <div class="begin-time">
              {{ formattedGameCreationRelativeTime }}
            </div>
          </template>
          <span class="small-text">{{
            dayjs(game.gameCreation).locale('zh-cn').format('YYYY-MM-DD HH:mm:ss')
          }}</span>
        </NTooltip>
        <div class="divider"></div>
        <div
          class="result"
          :class="{ 'first-place': self.participant.stats.subteamPlacement === 1 }"
        >
          {{ formattedResultText }}
        </div>
        <div class="duration">
          {{
            dayjs
              .duration(game.gameDuration * 1000)
              .locale('zh-cn')
              .format('m 分 s 秒')
          }}
        </div>
      </div>
      <div class="info">
        <div class="stats">
          <div class="champion">
            <LcuImage
              class="champion-icon"
              :src="championIcon(self.participant.championId)"
            ></LcuImage>
            <div class="champion-level">{{ self.participant.stats.champLevel }}</div>
          </div>
          <div class="summoner-spells">
            <SummonerSpellDisplay :spell-id="self.participant.spell1Id" :size="24" />
            <SummonerSpellDisplay :spell-id="self.participant.spell2Id" :size="24" />
          </div>
          <div
            class="perks"
            v-if="self.participant.stats.perkPrimaryStyle && self.participant.stats.perkSubStyle"
          >
            <PerkDisplay :perk-id="self.participant.stats.perk0" :size="24" />
            <!-- It should be 'perkstyle', but I still use class name 'perk' here. -->
            <PerkstyleDisplay :size="24" :perkstyle-id="self.participant.stats.perkSubStyle" />
          </div>
          <div class="kda-info">
            <div class="kda">
              <span class="k">{{ self.participant.stats.kills }}</span
              ><span class="divider">/</span
              ><span class="d">{{ self.participant.stats.deaths }}</span
              ><span class="divider">/</span
              ><span class="a">{{ self.participant.stats.assists }}</span>
            </div>
            <div
              class="kda-ratio"
              :class="{
                'perfect-kda':
                  self.participant.stats.deaths === 0 &&
                  self.participant.stats.assists !== 0 &&
                  self.participant.stats.kills !== 0
              }"
            >
              {{
                (
                  (self.participant.stats.kills + self.participant.stats.assists) /
                  (self.participant.stats.deaths || 1)
                ).toFixed(2)
              }}
              KDA
            </div>
          </div>
        </div>
        <div class="items">
          <ItemDisplay :size="24" :item-id="self.participant.stats.item0" />
          <ItemDisplay :size="24" :item-id="self.participant.stats.item1" />
          <ItemDisplay :size="24" :item-id="self.participant.stats.item2" />
          <ItemDisplay :size="24" :item-id="self.participant.stats.item3" />
          <ItemDisplay :size="24" :item-id="self.participant.stats.item4" />
          <ItemDisplay :size="24" :item-id="self.participant.stats.item5" />
          <ItemDisplay :size="24" is-trinket :item-id="self.participant.stats.item6" />
        </div>
      </div>
      <div class="players"></div>
      <div class="show-more" @click="() => handleToggleShowDetailedGame()">
        <NIcon class="icon" @click.stop="() => handleShowMiscellaneous()" title="杂项"
          ><ListIcon
        /></NIcon>
        <NIcon class="icon" :title="isExpanded ? '收起' : '展开'">
          <ChevronUpIcon v-if="isExpanded" /><ChevronDownIcon v-else />
        </NIcon>
      </div>
    </div>
    <div v-if="!self" class="standalone-misc-btn">
      <NIcon
        class="icon standalone-misc-btn-icon"
        @click.stop="() => handleShowMiscellaneous()"
        title="杂项"
        ><ListIcon
      /></NIcon>
    </div>
    <template v-if="isExpanded">
      <template v-if="isDetailed">
        <CherryModeDetailedGame
          class="detailed-game"
          :game="game"
          :self-id="selfId"
          v-if="game.gameMode === 'CHERRY'"
        />
        <NormalNodeDetailedGame class="detailed-game" v-else :game="game" :self-id="selfId" />
      </template>
      <div v-else-if="isLoading" class="loading">加载中...</div>
      <div v-else class="loading">无法加载</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  List as ListIcon
} from '@vicons/ionicons5'
import { useTimeoutPoll } from '@vueuse/core'
import dayjs from 'dayjs'
import { NIcon, NModal, NTooltip } from 'naive-ui'
import { computed, ref } from 'vue'

import LcuImage from '@renderer/components/LcuImage.vue'
import { championIcon } from '@renderer/features/game-data'
import { useGameDataStore } from '@renderer/features/stores/lcu/game-data'
import { Game } from '@renderer/types/match-history'

import '../lol-view.less'
import ItemDisplay from '../widgets/ItemDisplay.vue'
import PerkDisplay from '../widgets/PerkDisplay.vue'
import PerkstyleDisplay from '../widgets/PerkstyleDisplay.vue'
import SummonerSpellDisplay from '../widgets/SummonerSpellDisplay.vue'
import CherryModeDetailedGame from './CherryModeDetailedGame.vue'
import MiscellaneousPanel from './MiscellaneousPanel.vue'
import NormalNodeDetailedGame from './NormalModeDetailedGame.vue'

const props = defineProps<{
  selfId?: number
  isLoading: boolean
  isExpanded: boolean
  isDetailed: boolean
  game: Game
}>()

// 定期更新相对时间
const formattedGameCreationRelativeTime = ref('')
useTimeoutPoll(
  () => {
    formattedGameCreationRelativeTime.value = dayjs(props.game.gameCreation)
      .locale('zh-cn')
      .fromNow()
  },
  60000,
  { immediate: true }
)

const self = computed(() => {
  if (!props.selfId) {
    return null
  }

  const participantId = props.game.participantIdentities.find(
    (p) => p.player.summonerId === props.selfId
  )!.participantId
  return {
    participant: props.game.participants.find((p) => participantId === p.participantId)!
  }
})

const chineseNumber = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
const formattedResultText = computed(() => {
  if (!self.value) {
    return null
  }

  if (props.game.gameMode === 'CHERRY') {
    const ranking = self.value.participant.stats.subteamPlacement
    if (ranking < 1) {
      return `第 ? 名 (数据错误)`
    }
    return `第${chineseNumber[self.value.participant.stats.subteamPlacement - 1]}名`
  }

  if (props.game.gameMode === 'PRACTICETOOL') {
    return '-'
  }

  // 重开局
  if (self.value.participant.stats.gameEndedInEarlySurrender) {
    return `重开 (${self.value.participant.stats.win ? '胜利' : '失败'})`
  }

  if (self.value.participant.stats.win) {
    return '胜利'
  } else {
    return self.value.participant.stats.gameEndedInSurrender ? '投降' : '失败'
  }
})

const composedResultClass = computed(() => {
  if (!self.value) {
    return null
  }

  if (
    props.game.gameMode === 'PRACTICETOOL' ||
    self.value.participant.stats.gameEndedInEarlySurrender
  ) {
    return { remake: true }
  }

  if (self.value.participant.stats.win) {
    return { win: true }
  } else {
    return { lose: true }
  }
})

const formattedModeText = computed(() => {
  return props.game.gameMode === 'PRACTICETOOL'
    ? '训练模式'
    : gameData.queues[props.game.queueId].name ?? props.game.queueId
})

const isModalShow = ref(false)

const handleShowMiscellaneous = () => {
  emits('loadDetailedGame', props.game.gameId)
  isModalShow.value = true
}

const gameData = useGameDataStore()

const handleToggleShowDetailedGame = () => {
  if (!props.isDetailed) {
    emits('loadDetailedGame', props.game.gameId)
  }
  emits('setShowDetailedGame', props.game.gameId, !props.isExpanded)
}

const emits = defineEmits<{
  (e: 'setShowDetailedGame', gameId: number, expand: boolean)
  (e: 'loadDetailedGame', gameId: number)
}>()
</script>

<style lang="less" scoped>
.match-history-card {
  display: flex;
  padding: 0px 0px 0px 8px;
  border-radius: 4px;
  box-sizing: border-box;
  background-color: rgb(52, 52, 52);
  height: 96px;
  overflow: hidden;
}

.standalone-misc-btn {
  margin-left: auto;
  padding: 4px;
  border-radius: 4px;
  width: 32px;
  background-color: rgb(52, 52, 52);

  .standalone-misc-btn-icon {
    display: block;
    margin: auto;
    cursor: pointer;
  }
}

.game {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 120px;
  box-sizing: border-box;
  font-size: 12px;
  color: rgb(159, 159, 159);

  .mode {
    font-weight: bold;
  }

  .result {
    font-weight: bold;
  }

  .divider {
    margin: 2px 0;
    height: 1px;
    width: 60%;
    background-color: rgb(91, 91, 91);
  }
}

.info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  flex: 1;

  .stats {
    display: flex;
    gap: 4px;
  }

  .champion {
    position: relative;
    height: 50px;
    width: 50px;
  }

  .champion-icon {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }

  .champion-level {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    line-height: 20px;
    text-align: center;
    font-size: 12px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.621);
  }

  .summoner-spells,
  .perks {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 50px;
    width: 24px;
    gap: 2px;
  }

  .perk {
    border-radius: 4px;
    aspect-ratio: 1;
  }

  .kda-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100px;
  }

  .kda {
    display: flex;

    .k,
    .d,
    .a {
      font-weight: bold;
      font-size: 14px;
    }

    .divider {
      color: rgb(159, 159, 159);
      font-size: 14px;
      margin: 0 4px;
    }

    .k {
      color: rgb(68, 160, 246);
    }

    .d {
      color: rgb(200, 81, 30);
    }

    .a {
      color: rgb(159, 159, 159);
    }
  }

  .kda-ratio {
    font-size: 12px;
    color: rgb(159, 159, 159);
  }

  .kda-radio.perfect-kda {
    color: rgb(92, 169, 241);
  }

  .items {
    display: flex;
    gap: 4px;
    width: min-content;
  }
}

.show-more {
  display: flex;
  flex-direction: column;
  gap: 2px;
  justify-content: center;
  align-items: center;
  width: 40px;
  cursor: pointer;
}

.icon {
  padding: 2px;
  font-size: 16px;
  color: rgb(214, 214, 214);
  font-weight: bold;
  transition: background-color 0.3s ease;
  background-color: transparent;
  border-radius: 2px;
}

.icon:hover {
  background-color: rgba(255, 255, 255, 0.17);
}

.win {
  border-left: 6px solid rgb(0, 105, 203);

  .game {
    .mode {
      color: rgb(92, 169, 241);
    }

    .result {
      color: rgb(92, 169, 241);
    }

    .result.first-place {
      color: rgb(86, 218, 214);
    }
  }

  .show-more {
    background-color: rgb(0, 105, 203);
  }
}

.lose {
  border-left: 6px solid rgb(203, 61, 0);

  .game {
    .mode {
      color: rgb(233, 96, 37);
    }

    .result {
      color: rgb(233, 96, 37);
    }
  }

  .show-more {
    background-color: rgb(202, 73, 17);
  }
}

.remake {
  border-left: 6px solid rgb(139, 139, 139);

  .game {
    .mode {
      color: rgb(209, 209, 209);
    }

    .result {
      color: rgb(209, 209, 209);
    }
  }

  .show-more {
    background-color: rgb(150, 150, 150);
  }
}

.small-text {
  font-size: 12px;
}

.detailed-game {
  margin-top: 4px;
}

.loading {
  display: flex;
  height: 100px;
  justify-content: center;
  align-items: center;
  margin-top: 4px;
  background-color: #343434;
  border-radius: 4px;
  font-size: 12px;
}
</style>
