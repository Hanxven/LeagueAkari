<template>
  <div class="opgg-panel">
    <div class="tabs-area">
      <a href="https://op.gg" title="转到 OP.GG" target="_blank"><OpggIcon class="opgg-icon" /></a>
      <NButton
        secondary
        class="square-refresh-button"
        title="刷新"
        :loading="isLoading"
        @click="() => loadAll()"
      >
        <template #icon>
          <NIcon><RefreshIcon /></NIcon>
        </template>
      </NButton>
      <NTabs class="tabs" v-model:value="currentTab" type="segment" size="small">
        <NTab title="梯队" name="tier" tab="梯队" />
        <NTab title="英雄" name="champion" tab="英雄" :disabled="!championId" />
      </NTabs>
    </div>
    <div class="filters">
      <NSelect
        size="small"
        placeholder="模式"
        :options="modeOptions"
        :value="mode"
        @update:value="handleModeChange"
        :render-label="renderLabel"
        style="width: 0; flex: 1"
        :consistent-menu-width="false"
        :disabled="isLoading"
      />
      <NSelect
        size="small"
        placeholder="地区"
        :options="regionOptions"
        :value="region"
        @update:value="handleRegionChange"
        :render-label="renderLabel"
        style="width: 0; flex: 1"
        :consistent-menu-width="false"
        :disabled="isLoading"
      />
      <NSelect
        size="small"
        placeholder="段位"
        :options="tierOptions"
        :value="tier"
        @update:value="handleTierChange"
        :render-label="renderLabel"
        style="width: 0; flex: 1"
        :consistent-menu-width="false"
        :disabled="isLoading || mode === 'arena'"
      />
      <NSelect
        size="small"
        placeholder="位置"
        :options="positionOptions"
        :value="position"
        @update:value="handlePositionChange"
        style="width: 72px"
        :render-label="renderLabel"
        :consistent-menu-width="false"
        :disabled="isLoading || mode !== 'ranked'"
      />
      <NSelect
        size="small"
        placeholder="版本"
        :value="version"
        :options="versionOptions"
        @update:value="handleVersionChange"
        :render-label="renderLabel"
        style="width: 72px"
        :consistent-menu-width="false"
        :disabled="isLoading"
      />
    </div>
    <div class="content">
      <OpggTier
        v-show="currentTab === 'tier'"
        :data="tierData"
        :mode="mode"
        :position="position"
        :region="region"
        :tier="tier"
        :loading="isLoading"
        :version="version || undefined"
        @to-champion="handleToChampion"
      />
      <OpggChampion
        v-show="currentTab === 'champion'"
        @show-champion="(id) => handleToChampion(id)"
        :data="champion"
        :champion="championItem"
        :loading="isLoading"
        :region="region"
        :position="position"
        :tier="tier"
        :mode="mode"
        :version="version || undefined"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import OpggIcon from '@auxiliary-window/assets/icon/OpggIcon.vue'
import { OpggDataSource } from '@shared/external-data-source/opgg'
import {
  ModeType,
  OpggARAMChampionSummary,
  OpggArenaChampionSummary,
  OpggArenaModeChampion,
  OpggNormalModeChampion,
  OpggRankedChampionsSummary,
  PositionType,
  RegionType,
  TierType
} from '@shared/external-data-source/opgg/types'
import { useStableComputed } from '@shared/renderer/compositions/useStableComputed'
import { appRendererModule as am } from '@shared/renderer/modules/app'
import { useChampSelectStore } from '@shared/renderer/modules/lcu-state-sync/champ-select'
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync/gameflow'
import { maybePveChampion } from '@shared/types/lcu/game-data'
import { RefreshSharp as RefreshIcon } from '@vicons/ionicons5'
import { useLocalStorage, watchDebounced } from '@vueuse/core'
import { NButton, NIcon, NSelect, NTab, NTabs, SelectRenderLabel, useMessage } from 'naive-ui'
import { computed, h, onErrorCaptured, onMounted, ref, shallowRef, watchEffect } from 'vue'

import OpggChampion from './OpggChampion.vue'
import OpggTier from './OpggTier.vue'
import { MODE_TEXT, POSITION_TEXT, REGION_TEXT, TIER_TEXT } from './text'

const currentTab = ref('tier')
const gameflow = useGameflowStore()
const champSelect = useChampSelectStore()

const savedPreferences = useLocalStorage('opgg-preferences', {
  mode: 'ranked',
  position: 'top',
  region: 'global',
  tier: 'all'
})

onErrorCaptured((error, instance, info) => {
  console.warn('Component OP.GG error:', error, instance, info)
  am.logger.warn(`Component OP.GG error: ${info}`, error)
  return false
})

const renderLabel: SelectRenderLabel = (option) => {
  return h(
    'span',
    {
      style: {
        'font-size': '12px'
      }
    },
    option.label as string
  )
}

const championId = ref<number | null>(null)
const mode = ref<ModeType>(savedPreferences.value.mode as ModeType)
const position = ref<PositionType>(savedPreferences.value.position as PositionType)
const region = ref<RegionType>(savedPreferences.value.region as RegionType)
const tier = ref<TierType>(savedPreferences.value.tier as TierType)
const version = ref<string | null>(null)

const versions = shallowRef<string[]>([])

const opgg = new OpggDataSource()

watchEffect(async () => {
  if ((!version.value || !versions.value.includes(version.value)) && versions.value.length > 0) {
    version.value = versions.value[0]
  }
})

const tierData = shallowRef<
  OpggARAMChampionSummary | OpggRankedChampionsSummary | OpggArenaChampionSummary | null
>(null)
const champion = shallowRef<OpggNormalModeChampion | OpggArenaModeChampion | null>(null)

const message = useMessage()

const isLoadingVersions = ref(false)
const isLoadingChampion = ref(false)
const isLoadingTier = ref(false)

const isLoading = computed(
  () => isLoadingVersions.value || isLoadingChampion.value || isLoadingTier.value
)

// 一些模式没有位置相关的数据，所以添加一个视觉上的效果以保证其不可选
watchEffect(() => {
  if (mode.value !== 'ranked') {
    position.value = 'none'
  } else {
    position.value = savedPreferences.value.position as PositionType
  }
})

watchEffect(() => {
  if (mode.value === 'arena') {
    tier.value = 'all'
  } else {
    tier.value = savedPreferences.value.tier as TierType
  }
})

// 以防万一, 我们需要一些丑陋的冗余逻辑
let loadVersionsController: AbortController | null = null
let loadTierController: AbortController | null = null
let loadChampionController: AbortController | null = null

const loadVersionsData = async () => {
  if (isLoadingVersions.value) {
    loadVersionsController?.abort()
  }

  isLoadingVersions.value = true
  loadVersionsController = new AbortController()

  try {
    versions.value = (
      await opgg.getVersions({
        region: region.value,
        mode: mode.value,
        signal: loadVersionsController.signal
      })
    ).data

    if ((!version.value || !versions.value.includes(version.value)) && versions.value.length > 0) {
      version.value = versions.value[0]
    }
  } catch (error) {
    if ((error as any).name === 'CanceledError') {
      return
    }

    message.warning(`获取版本数据失败: ${(error as any).message}`)
    am.logger.warn(`[OP.GG] 获取版本数据失败: ${(error as any).message}`, error)
  } finally {
    isLoadingVersions.value = false
  }
}

const loadTierData = async () => {
  if (isLoadingTier.value) {
    loadTierController?.abort()
  }

  isLoadingTier.value = true
  loadTierController = new AbortController()

  try {
    tierData.value = await opgg.getChampionsTier({
      region: region.value,
      mode: mode.value,
      tier: tier.value,
      version: version.value ?? undefined,
      signal: loadTierController.signal
    })
  } catch (error) {
    if ((error as any).name === 'CanceledError') {
      return
    }

    message.warning(`获取 tier 数据失败: ${(error as any).message}`)
    am.logger.warn(`[OP.GG] 获取 tier 数据失败: ${(error as any).message}`, error)
  } finally {
    isLoadingTier.value = false
  }
}

const loadChampionData = async () => {
  if (!championId.value) {
    return
  }

  if (isLoadingChampion.value) {
    loadChampionController?.abort()
  }

  isLoadingChampion.value = true
  loadChampionController = new AbortController()

  try {
    champion.value = await opgg.getChampion({
      region: region.value,
      mode: mode.value,
      tier: tier.value,
      version: version.value ?? undefined,
      id: championId.value,
      position: position.value,
      signal: loadChampionController.signal
    })
  } catch (error) {
    if ((error as any).name === 'CanceledError') {
      return
    }

    message.warning(`获取英雄数据失败: ${(error as any).message}`)
    am.logger.warn(`[OP.GG] 获取英雄数据失败: ${(error as any).message}`, error)
  } finally {
    isLoadingChampion.value = false
  }
}

const loadAll = async () => {
  try {
    champion.value = null
    tierData.value = null
    versions.value = []
    await loadVersionsData()
    await loadTierData()
    await loadChampionData()
  } catch {
  } finally {
  }
}

const handleVersionChange = async (v: string) => {
  try {
    version.value = v
    await loadAll()
  } catch {}
}

const handleModeChange = async (m: ModeType) => {
  mode.value = m
  savedPreferences.value.mode = m
  await loadAll()
}

const handleRegionChange = async (r: RegionType) => {
  region.value = r
  savedPreferences.value.region = r
  await loadAll()
}

const handleTierChange = async (t: TierType) => {
  tier.value = t
  savedPreferences.value.tier = t
  await loadAll()
}

const handlePositionChange = async (p: PositionType) => {
  position.value = p
  savedPreferences.value.position = p
  champion.value = null
  await loadChampionData()
}

const handleToChampion = (id: number) => {
  currentTab.value = 'champion'
  championId.value = id
  champion.value = null
  loadChampionData()
}

onMounted(() => {
  loadAll()
})

const championItem = computed(() => {
  return tierData.value?.data.find((c) => c.id === championId.value)
})

const modeOptions = [
  { label: MODE_TEXT['ranked'], value: 'ranked' },
  { label: MODE_TEXT['aram'], value: 'aram' },
  { label: MODE_TEXT['arena'], value: 'arena' },
  { label: MODE_TEXT['nexus_blitz'], value: 'nexus_blitz' },
  { label: MODE_TEXT['urf'], value: 'urf' }
]

const positionOptions = computed(() => [
  { label: POSITION_TEXT['top'], value: 'top' },
  { label: POSITION_TEXT['jungle'], value: 'jungle' },
  { label: POSITION_TEXT['mid'], value: 'mid' },
  { label: POSITION_TEXT['adc'], value: 'adc' },
  { label: POSITION_TEXT['support'], value: 'support' },
  { label: POSITION_TEXT['none'], value: 'none', disabled: mode.value === 'ranked' }
])

const regionOptions = [
  { label: REGION_TEXT['global'], value: 'global' },
  { label: REGION_TEXT['na'], value: 'na' },
  { label: REGION_TEXT['euw'], value: 'euw' },
  { label: REGION_TEXT['kr'], value: 'kr' },
  { label: REGION_TEXT['br'], value: 'br' },
  { label: REGION_TEXT['eune'], value: 'eune' },
  { label: REGION_TEXT['jp'], value: 'jp' },
  { label: REGION_TEXT['lan'], value: 'lan' },
  { label: REGION_TEXT['las'], value: 'las' },
  { label: REGION_TEXT['oce'], value: 'oce' },
  { label: REGION_TEXT['tr'], value: 'tr' },
  { label: REGION_TEXT['ru'], value: 'ru' },
  { label: REGION_TEXT['sg'], value: 'sg' },
  { label: REGION_TEXT['id'], value: 'id' },
  { label: REGION_TEXT['ph'], value: 'ph' },
  { label: REGION_TEXT['th'], value: 'th' },
  { label: REGION_TEXT['vn'], value: 'vn' },
  { label: REGION_TEXT['tw'], value: 'tw' },
  { label: REGION_TEXT['me'], value: 'me' }
]

const tierOptions = [
  { label: TIER_TEXT['all'], value: 'all' },
  { label: TIER_TEXT['ibsg'], value: 'ibsg' },
  { label: TIER_TEXT['gold_plus'], value: 'gold_plus' },
  { label: TIER_TEXT['platinum_plus'], value: 'platinum_plus' },
  { label: TIER_TEXT['emerald_plus'], value: 'emerald_plus' },
  { label: TIER_TEXT['diamond_plus'], value: 'diamond_plus' },
  { label: TIER_TEXT['master'], value: 'master' },
  { label: TIER_TEXT['master_plus'], value: 'master_plus' },
  { label: TIER_TEXT['grandmaster'], value: 'grandmaster' },
  { label: TIER_TEXT['challenger'], value: 'challenger' }
]

const versionOptions = computed(() => {
  return versions.value.map((v) => ({ label: v, value: v }))
})

// 这将实时锁定正在选择的英雄
const automation = useStableComputed(() => {
  if (!champSelect.session || !gameflow.session) {
    return
  }

  const selfCellId = champSelect.session.localPlayerCellId
  const self = champSelect.session.myTeam.find((p) => p.cellId === selfCellId)
  const selfActionChampionId = champSelect.session.actions
    .flat(1)
    .find((a) => a.actorCellId === selfCellId && a.type === 'pick' && a.championId)?.championId

  if (!self && !selfActionChampionId) {
    return
  }

  return {
    championId: self?.championId || selfActionChampionId,
    assignedPosition: self?.assignedPosition,
    gameMode: gameflow.session.gameData.queue.gameMode
  }
})

watchDebounced(
  automation,
  async (atm) => {
    if (!atm) {
      return
    }

    // set to assigned position
    if (atm.assignedPosition) {
      switch (atm.assignedPosition) {
        case 'top':
          position.value = 'top'
          break
        case 'jungle':
          position.value = 'jungle'
          break
        case 'middle':
          position.value = 'mid'
          break
        case 'bottom':
          position.value = 'adc'
          break
        case 'utility':
          position.value = 'support'
          break
      }
    }

    switch (atm.gameMode) {
      case 'CLASSIC':
        mode.value = 'ranked'
        break
      case 'ARAM':
        mode.value = 'aram'
        position.value = 'none'
        break
      case 'CHERRY':
        mode.value = 'arena'
        break
      case 'NEXUSBLITZ':
        mode.value = 'nexus_blitz'
        break
      case 'URF':
      case 'ARURF':
        mode.value = 'urf'
        break
    }

    await loadAll()

    // 排除 PVE 模式的英雄
    if (atm.championId && !maybePveChampion(atm.championId)) {
      handleToChampion(atm.championId)
    }
  },
  { immediate: true, debounce: 500 }
)
</script>

<style lang="less" scoped>
.opgg-panel {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 2px 8px 8px 8px;
  height: 100%;
  min-width: 480px; // 小窗不再是小窗了, 笑 (╯°□°）╯︵ ┻━┻

  .tabs-area {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
  }

  .opgg-icon {
    display: block;
    height: 32px;
    width: 32px;
  }

  .square-refresh-button {
    width: 32px;
    height: 32px;
  }

  .filters {
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
  }

  .content {
    flex: 1;
    height: 0;
    overflow: auto;
  }
}
</style>
