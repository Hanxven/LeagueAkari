<template>
  <NCard size="small" v-if="benchChampions && lcs.champSelect.currentChampion && gameMode">
    <div class="outer">
      <div class="operations">
        <NTooltip
          raw
          :show-arrow="false"
          :duration="100"
          :delay="300"
          :keep-alive-on-hover="false"
          :disabled="!data[lcs.champSelect.currentChampion]"
        >
          <template #trigger>
            <LcuImage
              class="champion-image"
              style="border-radius: 50%; cursor: default"
              :class="championAdjustment(lcs.champSelect.currentChampion)?.overallEffect"
              :src="championIconUrl(lcs.champSelect.currentChampion || -1)"
            />
          </template>
          <div class="raw-popover">
            <div
              class="balance-item"
              v-for="b of championAdjustment(lcs.champSelect.currentChampion)?.sortedAdjustments"
              :key="b.type"
            >
              <span class="balance-item-name">{{ BALANCE_TYPES[b.type]?.name || b.type }}</span>
              <span class="balance-item-value" :class="b.effect">{{ b.formattedValue }}</span>
            </div>
            <div class="balance-data-source-name">{{ SOURCE_NAME[source] }}</div>
          </div>
        </NTooltip>
        <div class="btns">
          <NButton
            @click="() => handleReroll()"
            :disabled="rerollsRemaining === 0 || isRerolling"
            size="tiny"
            :title="`随机一次 (剩余 ${rerollsRemaining})`"
            circle
            secondary
            type="primary"
          >
            <template #icon>
              <NIcon><RefreshOutlineIcon /></NIcon>
            </template>
          </NButton>
          <NButton
            :disabled="rerollsRemaining === 0 || isRerolling"
            @click="() => handleReroll(true)"
            :title="`随机一次并立即取回 (剩余 ${rerollsRemaining})`"
            secondary
            circle
            size="tiny"
          >
            <template #icon>
              <NIcon><ShareIcon /></NIcon>
            </template>
          </NButton>
        </div>
      </div>
      <NDivider vertical />
      <div class="champions">
        <NTooltip
          raw
          :show-arrow="false"
          :duration="100"
          :delay="300"
          v-for="c of benchChampions"
          :key="c.championId"
          :keep-alive-on-hover="false"
          :disabled="!data[c.championId]"
        >
          <template #trigger>
            <LcuImage
              class="champion-image"
              :class="{
                'champion-image-invalid': !lcs.champSelect.currentPickableChampionIds.has(
                  c.championId
                ),
                [championAdjustment(c.championId)?.overallEffect || 'neutral']: true
              }"
              :src="championIconUrl(c.championId)"
              @click="() => handleBenchSwap(c.championId)"
            />
          </template>
          <div class="raw-popover">
            <div
              class="balance-item"
              v-for="b of championAdjustment(c.championId)?.sortedAdjustments"
              :key="b.type"
            >
              <span class="balance-item-name">{{ b.name }}</span>
              <span class="balance-item-value" :class="b.effect">{{ b.formattedValue }}</span>
            </div>
            <div class="balance-data-source-name">{{ SOURCE_NAME[source] }}</div>
          </div>
        </NTooltip>
        <div
          v-for="_i of Math.max(10 - benchChampions.length, 0)"
          class="champion-image-placeholder"
        />
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import {
  BalanceAdjustment,
  useChampionBalanceData
} from '@aux-window/compositions/useBalanceData'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUrl } from '@renderer-shared/shards/league-client/utils'
import { isBenchEnabledSession } from '@shared/types/league-client/champ-select'
import { RefreshOutline as RefreshOutlineIcon, Share as ShareIcon } from '@vicons/ionicons5'
import { NButton, NCard, NDivider, NIcon, NTooltip, useMessage } from 'naive-ui'
import { computed, ref } from 'vue'

const lcs = useLeagueClientStore()

const lc = useInstance<LeagueClientRenderer>('league-client-renderer')

// currently only support fandom
const source = ref('fandom')
const { data } = useChampionBalanceData(source)

const gameMode = computed(() => {
  if (!lcs.gameflow.session) {
    return null
  }

  return lcs.gameflow.session.gameData.queue.gameMode
})

const BALANCE_TYPES: Record<
  string,
  {
    name: string
    order: number
  }
> = {
  'damage-dealt': {
    name: '造成伤害',
    order: 0
  },
  'damage-taken': {
    name: '承受伤害',
    order: 1
  },
  healing: {
    name: '治疗效果',
    order: 2
  },
  shielding: {
    name: '护盾效果',
    order: 3
  },
  'ability-haste': {
    name: '技能急速',
    order: 4
  },
  'mana-regen': {
    name: '法力回复',
    order: 5
  },
  'energy-regen': {
    name: '能量回复',
    order: 6
  },
  'attack-speed': {
    name: '攻击速度',
    order: 7
  },
  'movement-speed': {
    name: '移动速度',
    order: 8
  },
  tenacity: {
    name: '韧性',
    order: 9
  }
}

const SOURCE_NAME = {
  fandom: 'Fandom Wiki',
  opgg: 'OP.GG'
}

const STATUS_SORT_ORDER = {
  nerfed: 1,
  buffed: 0
}

const formatValue = (item: BalanceAdjustment) => {
  if (item.display === 'percentage') {
    return `${(100 * item.value).toFixed()} %`
  } else {
    return item.value > 0 ? `+${item.value}` : item.value
  }
}

const championAdjustment = (championId: number) => {
  if (!gameMode.value) {
    return null
  }

  const champion = data.value[championId]

  if (!champion) {
    return null
  }

  const modeAdjustment = champion.modes[gameMode.value]

  if (!modeAdjustment) {
    return null
  }

  return {
    ...modeAdjustment,
    sortedAdjustments: modeAdjustment.adjustments
      .toSorted((a, b) => {
        const aBalanceOrder = BALANCE_TYPES[a.type]?.order ?? 0
        const bBalanceOrder = BALANCE_TYPES[b.type]?.order ?? 0

        if (aBalanceOrder !== bBalanceOrder) {
          return aBalanceOrder - bBalanceOrder
        }

        const aStatusOrder = STATUS_SORT_ORDER[a.effect] ?? 0
        const bStatusOrder = STATUS_SORT_ORDER[b.effect] ?? 0

        return aStatusOrder - bStatusOrder
      })

      .map((item) => ({
        ...item,
        name: BALANCE_TYPES[item.type]?.name || item.type,
        formattedValue: formatValue(item)
      }))
  }
}

const benchChampions = computed(() => {
  if (!isBenchEnabledSession(lcs.champSelect.session)) {
    return null
  }

  return lcs.champSelect.session.benchChampions
})

const rerollsRemaining = computed(() => {
  if (!isBenchEnabledSession(lcs.champSelect.session)) {
    return 0
  }

  return lcs.champSelect.session.rerollsRemaining
})

const message = useMessage()

const isRerolling = ref(false)
const isSwapping = ref(false)

const handleBenchSwap = async (championId: number) => {
  if (isSwapping.value) {
    return
  }

  if (!lcs.champSelect.currentPickableChampionIds.has(championId)) {
    return
  }

  isSwapping.value = true
  try {
    await lc.api.champSelect.benchSwap(championId)
  } catch (error) {
    message.warning('尝试交换英雄失败')
  } finally {
    isSwapping.value = false
  }
}

const handleReroll = async (grabBack = false) => {
  if (isRerolling.value) {
    return
  }

  isRerolling.value = true
  try {
    const prevId = lcs.champSelect.currentChampion

    await lc.api.champSelect.reroll()

    // 使用一个简短的延时来实现，simple workaround
    if (grabBack && prevId !== null) {
      window.setTimeout(async () => {
        if (benchChampions.value) {
          await handleBenchSwap(prevId)
        }
      }, 25)
    }
  } catch (error) {
    message.warning('尝试重新随机英雄失败')
  } finally {
    isRerolling.value = false
  }
}
</script>

<style scoped lang="less">
.outer {
  display: flex;
  align-items: center;
  justify-content: center;
}

.operations {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.btns {
  display: flex;
  gap: 4px;
}

.champions {
  display: grid;
  grid-template-columns: repeat(5, auto);
  gap: 4px;
}

.champion-image {
  width: 24px;
  height: 24px;
  border-radius: 2px;
  cursor: pointer;
  box-sizing: border-box;
  border-style: solid;
  border-width: 1px;
  border-color: rgb(72, 72, 72);
}
// user/v1/
.champion-image.buffed {
  border-width: 1px;
  border-color: rgb(0, 161, 67);
}

.champion-image.nerfed {
  border-width: 1px;
  border-color: rgb(181, 75, 0);
}

.champion-image.mixed {
  border-width: 1px;
  border-style: solid;
  border-image: linear-gradient(to bottom right, rgb(0, 161, 67) 50%, rgb(181, 75, 0) 50%) 1;
}

.champion-image-invalid {
  cursor: not-allowed;
  filter: grayscale(0.8);
}

.champion-image-placeholder {
  width: 24px;
  height: 24px;
  box-sizing: border-box;
  border: 1px solid rgb(72, 72, 72);
  border-radius: 2px;
}

.card-header-title {
  font-weight: bold;
  font-size: 18px;
}

.raw-popover {
  background-color: rgba(0, 0, 0, 0.866);
  padding: 4px 8px;
  border-radius: 2px;
}

.balance-item {
  font-size: 10px;
  color: rgb(204, 204, 204);

  .balance-item-value {
    display: inline-block;
    text-align: end;
    min-width: 36px;
    white-space: nowrap;
  }

  .balance-item-value.buffed {
    color: rgb(0, 219, 91);
  }

  .balance-item-value.nerfed {
    color: rgb(255, 106, 0);
  }
}

.balance-data-source-name {
  margin-top: 4px;
  font-size: 10px;
  color: rgb(145, 145, 145);
}
</style>
