<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ t('ChampionBench.title') }}</span>
    </template>
    <div class="outer" v-if="benchChampions !== null">
      <div class="operations">
        <NButton
          @click="() => handleReroll()"
          :disabled="rerollsRemaining === 0 || isRerolling"
          size="small"
          type="primary"
          >{{ t('ChampionBench.reroll') }} ({{ rerollsRemaining }})</NButton
        >
        <NButton
          :disabled="rerollsRemaining === 0 || isRerolling"
          @click="() => handleReroll(true)"
          size="small"
          :title="t('ChampionBench.charity')"
          >{{ t('ChampionBench.charity') }}</NButton
        >
        <LcuImage
          class="champion-image"
          style="border-radius: 50%; cursor: default"
          :src="championIconUri(selfChampionId || -1)"
        />
      </div>
      <NDivider vertical />
      <div class="champions">
        <LcuImage
          v-for="c of benchChampions"
          :key="c.championId"
          class="champion-image"
          :class="{
            'champion-image-invalid': !lcs.champSelect.currentPickableChampionIds.has(c.championId)
          }"
          :src="championIconUri(c.championId)"
          @click="() => handleBenchSwap(c.championId)"
        />
        <div
          v-for="_i of Math.max(10 - benchChampions.length, 0)"
          class="champion-image-placeholder"
        />
      </div>
    </div>
    <div style="font-size: 13px" v-else>
      {{
        lcs.gameflow.phase === 'ChampSelect'
          ? t('ChampionBench.notInBenchMode')
          : t('ChampionBench.notInPhase')
      }}
    </div>
  </NCard>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { isBenchEnabledSession } from '@shared/types/league-client/champ-select'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NDivider, useNotification } from 'naive-ui'
import { computed, ref } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const lc = useInstance(LeagueClientRenderer)

const notification = useNotification()

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

const selfChampionId = computed(() => {
  if (!lcs.champSelect.session) {
    return null
  }

  const c = lcs.champSelect.session.myTeam.find(
    (t) => t.cellId == lcs.champSelect.session?.localPlayerCellId
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

  if (!lcs.champSelect.currentPickableChampionIds.has(championId)) {
    return
  }

  isSwapping.value = true
  try {
    await lc.api.champSelect.benchSwap(championId)
  } catch (error) {
    notification.warning({
      title: () => t('ChampionBench.swapFailedNotification.title'),
      content: () => t('ChampionBench.swapFailedNotification.description')
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

    await lc.api.champSelect.reroll()

    // 使用一个简短的延时来实现，simple workaround
    if (grabBack && prevChampionId !== null) {
      window.setTimeout(async () => {
        if (benchChampions.value) {
          await handleBenchSwap(prevChampionId)
        }
      }, 25)
    }
  } catch (error) {
    notification.warning({
      title: () => t('ChampionBench.rerollFailedNotification.title'),
      content: () => t('ChampionBench.rerollFailedNotification.description')
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
</style>
