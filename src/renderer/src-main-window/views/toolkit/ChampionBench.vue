<template>
  <NCard size="small">
    <template #header><span class="card-header-title">英雄选择台</span></template>
    <div class="outer" v-if="benchChampions !== null">
      <div class="operations">
        <NButton
          @click="() => handleReroll()"
          :disabled="rerollsRemaining === 0 || isRerolling"
          size="tiny"
          type="primary"
          >重随 ({{ rerollsRemaining }})</NButton
        >
        <NButton
          :disabled="rerollsRemaining === 0 || isRerolling"
          @click="() => handleReroll(true)"
          size="tiny"
          title="进行一次重新随机，但立即拿回之前的英雄"
          >慈善</NButton
        >
        <LcuImage
          class="champion-image"
          style="border-radius: 50%; cursor: default"
          :src="championIcon(selfChampionId || -1)"
        />
      </div>
      <NDivider vertical />
      <div class="champions">
        <LcuImage
          v-for="c of benchChampions"
          :key="c.championId"
          class="champion-image"
          :class="{
            'champion-image-invalid': !champSelect.currentPickableChampions.has(c.championId)
          }"
          :src="championIcon(c.championId)"
          @click="() => handleBenchSwap(c.championId)"
        />
        <div
          v-for="_i of Math.max(10 - benchChampions.length, 0)"
          class="champion-image-placeholder"
        />
      </div>
    </div>
    <div style="font-size: 13px" v-else>
      {{ gameflow.phase === 'ChampSelect' ? '当前模式不可用' : '未处于英雄选择过程中' }}
    </div>
  </NCard>
</template>

<script setup lang="ts">
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import { championIcon } from '@shared/renderer/modules/game-data'
import { useChampSelectStore } from '@shared/renderer/modules/lcu-state-sync/champ-select'
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync/gameflow'
import { benchSwap, reroll } from '@shared/renderer/http-api/champ-select'
import { laNotification } from '@shared/renderer/notification'
import { isBenchEnabledSession } from '@shared/types/lcu/champ-select'
import { NButton, NCard, NDivider } from 'naive-ui'
import { computed, ref } from 'vue'

const champSelect = useChampSelectStore()
const gameflow = useGameflowStore()

const benchChampions = computed(() => {
  if (!isBenchEnabledSession(champSelect.session)) {
    return null
  }

  return champSelect.session.benchChampions
})

const rerollsRemaining = computed(() => {
  if (!isBenchEnabledSession(champSelect.session)) {
    return 0
  }

  return champSelect.session.rerollsRemaining
})

const selfChampionId = computed(() => {
  if (!champSelect.session) {
    return null
  }

  const c = champSelect.session.myTeam.find(
    (t) => t.cellId == champSelect.session?.localPlayerCellId
  )

  if (c) {
    return c.championId
  }

  return null
})

const isRerolling = ref(false)
const isSwapping = ref(false)

const handleBenchSwap = async (championId: number) => {
  if (isSwapping.value) {
    return
  }

  if (!champSelect.currentPickableChampions.has(championId)) {
    return
  }

  isSwapping.value = true
  try {
    await benchSwap(championId)
  } catch (error) {
    laNotification.warn('英雄选择台', '交换失败，目标英雄可能已经不存在', error)
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
    const prevChampionId = selfChampionId.value

    await reroll()

    // 使用一个简短的延时来实现，simple workaround
    if (grabBack && prevChampionId !== null) {
      window.setTimeout(async () => {
        if (benchChampions.value) {
          await handleBenchSwap(prevChampionId)
        }
      }, 25)
    }
  } catch (error) {
    laNotification.warn('英雄选择台', '重新随机失败', error)
  } finally {
    isRerolling.value = false
  }
}
</script>

<style scoped lang="less">
.outer {
  display: flex;
  align-items: center;
}

.champions,
.operations {
  display: flex;
  gap: 4px;
  align-items: center;
}

@size: 28px;
@border-radius: 4px;

.champion-image {
  width: @size;
  height: @size;
  border-radius: @border-radius;
  cursor: pointer;
}

.champion-image-invalid {
  cursor: not-allowed;
  filter: grayscale(1);
}

.champion-image-placeholder {
  width: @size;
  height: @size;
  box-sizing: border-box;
  border: 1px solid rgb(72, 72, 72);
  border-radius: @border-radius;
}

.card-header-title {
  font-weight: bold;
  font-size: 18px;
}
</style>
