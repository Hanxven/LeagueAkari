<template>
  <NCard size="small" v-if="benchChampions">
    <div class="outer">
      <div class="operations">
        <LcuImage
          class="champion-image"
          style="border-radius: 50%; cursor: default"
          :src="championIcon(selfChampionId || -1)"
        />
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
        <LcuImage
          v-for="c of benchChampions"
          :key="c.championId"
          class="champion-image"
          :class="{
            'champion-image-invalid': !cs.currentPickableChampions.has(c.championId)
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
  </NCard>
</template>

<script setup lang="ts">
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import { championIcon } from '@shared/renderer/modules/game-data'
import { useChampSelectStore } from '@shared/renderer/modules/lcu-state-sync/champ-select'
import { benchSwap, reroll } from '@shared/renderer/http-api/champ-select'
import { nativeNotification } from '@shared/renderer/notification'
import { isBenchEnabledSession } from '@shared/types/lcu/champ-select'
import { RefreshOutline as RefreshOutlineIcon, Share as ShareIcon } from '@vicons/ionicons5'
import { NButton, NCard, NDivider, NIcon } from 'naive-ui'
import { computed, ref } from 'vue'

const cs = useChampSelectStore()

const benchChampions = computed(() => {
  if (!isBenchEnabledSession(cs.session)) {
    return null
  }

  return cs.session.benchChampions
})

const rerollsRemaining = computed(() => {
  if (!isBenchEnabledSession(cs.session)) {
    return 0
  }

  return cs.session.rerollsRemaining
})

const selfChampionId = computed(() => {
  if (!cs.session) {
    return null
  }

  const c = cs.session.myTeam.find((t) => t.cellId == cs.session?.localPlayerCellId)

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

  if (!cs.currentPickableChampions.has(championId)) {
    return
  }

  isSwapping.value = true
  try {
    await benchSwap(championId)
  } catch (error) {
    nativeNotification({
      title: 'League Akari',
      body: '尝试交换英雄失败',
      timeoutType: 'default'
    })
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
    nativeNotification({
      title: 'League Akari',
      body: '尝试重新随机失败',
      timeoutType: 'default'
    })
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
}

.champion-image-invalid {
  cursor: not-allowed;
  filter: grayscale(1);
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
</style>
