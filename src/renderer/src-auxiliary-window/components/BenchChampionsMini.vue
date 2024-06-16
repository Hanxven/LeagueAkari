<template>
  <NCard size="small" v-if="benchChampions">
    <div class="outer">
      <div class="operations">
        <NTooltip
          raw
          :show-arrow="false"
          :duration="100"
          :delay="300"
          :disabled="!selfChampionWithBalance || !selfChampionWithBalance.balance.length"
        >
          <template #trigger>
            <LcuImage
              class="champion-image"
              :class="{
                buffed: selfChampionWithBalance?.overallBalance === 'buffed',
                nerfed: selfChampionWithBalance?.overallBalance === 'nerfed',
                balanced: selfChampionWithBalance?.overallBalance === 'balanced'
              }"
              style="border-radius: 50%; cursor: default"
              :src="championIcon(selfChampionWithBalance?.championId || -1)"
            />
          </template>
          <div class="raw-popover">
            <div
              class="balance-item"
              v-for="b of selfChampionWithBalance?.balance"
              :key="b.meta.name"
            >
              <span class="balance-item-name">{{ b.meta.name }}</span>
              <span
                class="balance-item-value"
                :class="{ buffed: b.status === 'buffed', nerfed: b.status === 'nerfed' }"
                >{{ formatBalanceValue(b.value, b.meta.type === 'percentage') }}</span
              >
            </div>
            <div class="balance-data-source-name">{{ eds.balance?.name }}</div>
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
          v-for="c of benchChampionsWithBalance"
          :key="c.championId"
          :disabled="!c.balance.length"
        >
          <template #trigger>
            <LcuImage
              class="champion-image"
              :class="{
                'champion-image-invalid': !cs.currentPickableChampions.has(c.championId),
                buffed: c.overallBalance === 'buffed',
                nerfed: c.overallBalance === 'nerfed',
                balanced: c.overallBalance === 'balanced'
              }"
              :src="championIcon(c.championId)"
              @click="() => handleBenchSwap(c.championId)"
            />
          </template>
          <div class="raw-popover">
            <div class="balance-item" v-for="b of c.balance" :key="b.meta.name">
              <span class="balance-item-name">{{ b.meta.name }}</span>
              <span
                class="balance-item-value"
                :class="{ buffed: b.status === 'buffed', nerfed: b.status === 'nerfed' }"
                >{{ formatBalanceValue(b.value, b.meta.type === 'percentage') }}</span
              >
            </div>
            <div class="balance-data-source-name">{{ eds.balance?.name }}</div>
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
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import { benchSwap, reroll } from '@shared/renderer/http-api/champ-select'
import { useExternalDataSourceStore } from '@shared/renderer/modules/external-data-source-new/store'
import { championIcon } from '@shared/renderer/modules/game-data'
import { useChampSelectStore } from '@shared/renderer/modules/lcu-state-sync-new/champ-select'
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync-new/gameflow'
import { isBenchEnabledSession } from '@shared/types/lcu/champ-select'
import { RefreshOutline as RefreshOutlineIcon, Share as ShareIcon } from '@vicons/ionicons5'
import { NButton, NCard, NDivider, NIcon, NTooltip, useMessage } from 'naive-ui'
import { computed, ref } from 'vue'

const cs = useChampSelectStore()

const eds = useExternalDataSourceStore()
const gameflow = useGameflowStore()

const gameMode = computed(() => {
  if (!gameflow.session) {
    return null
  }

  return gameflow.session.map.gameMode
})

const getBalanceData = (id: number) => {
  if (!eds.balance || !gameMode.value) {
    return null
  }

  return eds.balance.map[id]?.balance['aram'] || null
}

const BALANCE_TYPES: Record<
  string,
  {
    name: string
    impact: 'buff' | 'nerf'
    type: 'percentage' | 'literal'
    order: number
  }
> = {
  dmg_dealt: {
    name: '造成伤害',
    impact: 'buff',
    type: 'percentage',
    order: 0
  },
  dmg_taken: {
    name: '承受伤害',
    impact: 'nerf',
    type: 'percentage',
    order: 1
  },
  healing: {
    name: '治疗效果',
    impact: 'buff',
    type: 'percentage',
    order: 2
  },
  shielding: {
    name: '护盾效果',
    impact: 'buff',
    type: 'percentage',
    order: 3
  },
  ability_haste: {
    name: '技能急速',
    impact: 'buff',
    type: 'literal',
    order: 4
  },
  mana_regen: {
    name: '法力回复',
    impact: 'buff',
    type: 'percentage',
    order: 5
  },
  energy_regen: {
    name: '能量回复',
    impact: 'buff',
    type: 'percentage',
    order: 6
  },
  attack_speed: {
    name: '攻击速度',
    impact: 'buff',
    type: 'percentage',
    order: 7
  },
  movement_speed: {
    name: '移动速度',
    impact: 'buff',
    type: 'percentage',
    order: 8
  },
  tenacity: {
    name: '韧性',
    impact: 'buff',
    type: 'percentage',
    order: 9
  }
}

const STATUS_SORT_ORDER = {
  nerfed: 1,
  buffed: 0
}

const formatBalanceValue = (b: number, percentage = true) => {
  if (percentage) {
    return `${(100 * b).toFixed()} %`
  } else {
    return b > 0 ? `+${b}` : b
  }
}

const benchChampions = computed(() => {
  if (!isBenchEnabledSession(cs.session)) {
    return null
  }

  return cs.session.benchChampions
})

const regulateBalance = (key: string, value: number) => {
  let status: 'buffed' | 'nerfed'
  const meta = BALANCE_TYPES[key]
  if (meta.type === 'percentage') {
    if (meta.impact === 'buff') {
      status = value >= 1.0 ? 'buffed' : 'nerfed'
    } else {
      status = value >= 1.0 ? 'nerfed' : 'buffed'
    }
  } else {
    if (meta.impact === 'buff') {
      status = value >= 0 ? 'buffed' : 'nerfed'
    } else {
      status = value >= 0 ? 'nerfed' : 'buffed'
    }
  }

  return {
    value,
    status,
    meta
  }
}

const benchChampionsWithBalance = computed(() => {
  if (!isBenchEnabledSession(cs.session)) {
    return null
  }

  const champions = cs.session.benchChampions

  return champions.map((c) => {
    const balanceData = getBalanceData(c.championId)
    const arr = Object.entries(balanceData || [])
      .map((s) => regulateBalance(s[0], s[1]))
      .toSorted((a, b) => {
        return (
          (STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status]) * 100 +
          a.meta.order -
          b.meta.order
        )
      })

    let overallBalance = 'unbalanced'
    for (const a of arr) {
      if (a.status === 'buffed') {
        if (overallBalance === 'nerfed') {
          overallBalance = 'balanced'
          break
        } else {
          overallBalance = 'buffed'
        }
      } else if (a.status === 'nerfed') {
        if (overallBalance === 'buffed') {
          overallBalance = 'balanced'
          break
        } else {
          overallBalance = 'nerfed'
        }
      }
    }

    return {
      championId: c.championId,
      overallBalance,
      balance: arr
    }
  })
})

const rerollsRemaining = computed(() => {
  if (!isBenchEnabledSession(cs.session)) {
    return 0
  }

  return cs.session.rerollsRemaining
})

const selfChampionWithBalance = computed(() => {
  if (!cs.session) {
    return null
  }

  const c = cs.session.myTeam.find((t) => t.cellId == cs.session?.localPlayerCellId)

  if (c) {
    const b = getBalanceData(c.championId)
    const arr = Object.entries(b || []).map((s) => regulateBalance(s[0], s[1]))

    // 重复的代码，日后封装
    let overallBalance = 'unbalanced'
    for (const a of arr) {
      if (a.status === 'buffed') {
        if (overallBalance === 'nerfed') {
          overallBalance = 'balanced'
          break
        } else {
          overallBalance = 'buffed'
        }
      } else if (a.status === 'nerfed') {
        if (overallBalance === 'buffed') {
          overallBalance = 'balanced'
          break
        } else {
          overallBalance = 'nerfed'
        }
      }
    }

    return {
      championId: c.championId,
      overallBalance,
      balance: arr
    }
  }

  return null
})

const message = useMessage()

const isRerolling = ref(false)
const isSwapping = ref(false)

const handleBenchSwap = async (championId: number) => {
  if (isSwapping.value) {
    return
  }

  if (!cs.currentPickableChampions.has(championId)) {
    return
  }

  isSwapping.value = true
  try {
    await benchSwap(championId)
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
    const prev = selfChampionWithBalance.value

    await reroll()

    // 使用一个简短的延时来实现，simple workaround
    if (grabBack && prev !== null) {
      window.setTimeout(async () => {
        if (benchChampions.value) {
          await handleBenchSwap(prev.championId)
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

.champion-image.balanced {
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
