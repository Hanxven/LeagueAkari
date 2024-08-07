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
import { auxiliaryWindowRendererModule as awm } from '@shared/renderer/modules/auxiliary-window'
import { useChampSelectStore } from '@shared/renderer/modules/lcu-state-sync/champ-select'
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync/gameflow'
import { maybePveChampion } from '@shared/types/lcu/game-data'
import { RefreshSharp as RefreshIcon } from '@vicons/ionicons5'
import { watchDebounced } from '@vueuse/core'
import { NButton, NIcon, NSelect, NTab, NTabs, SelectRenderLabel, useMessage } from 'naive-ui'
import {
  computed,
  h,
  onActivated,
  onErrorCaptured,
  onMounted,
  ref,
  shallowRef,
  watch,
  watchEffect
} from 'vue'

import OpggChampion from './OpggChampion.vue'
import OpggTier from './OpggTier.vue'

const currentTab = ref('tier')
const gameflow = useGameflowStore()
const champSelect = useChampSelectStore()

onErrorCaptured((error, instance, info) => {
  console.warn('Component OP.GG error: ', error, instance, info)
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
const mode = ref<ModeType>('ranked')
const position = ref<PositionType>('top')
const region = ref<RegionType>('global')
const tier = ref<TierType>('all')
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
    console.error(error)
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

    message.warning(`获取数据失败: ${(error as any).message}`)
    console.error(error)
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
    console.error(error)
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
  await loadAll()
}

const handleRegionChange = async (r: RegionType) => {
  region.value = r
  await loadAll()
}

const handleTierChange = async (t: TierType) => {
  tier.value = t
  await loadAll()
}

const handlePositionChange = async (p: PositionType) => {
  position.value = p
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
  { label: '排位', value: 'ranked' },
  { label: '大乱斗', value: 'aram' },
  { label: '斗魂竞技场', value: 'arena' },
  { label: '极限闪击', value: 'nexus_blitz' },
  { label: '无限火力', value: 'urf' }
]

const positionOptions = computed(() => [
  { label: '上单', value: 'top' },
  { label: '打野', value: 'jungle' },
  { label: '中单', value: 'mid' },
  { label: '下路', value: 'adc' },
  { label: '辅助', value: 'support' },
  { label: '无', value: 'none', disabled: mode.value === 'ranked' }
])

const regionOptions = [
  { label: '全球', value: 'global' },
  { label: '北美', value: 'na' },
  { label: '欧洲西', value: 'euw' },
  { label: '韩国', value: 'kr' },
  { label: '巴西', value: 'br' },
  { label: '欧洲东北', value: 'eune' },
  { label: '日本', value: 'jp' },
  { label: '拉丁美洲北', value: 'lan' },
  { label: '拉丁美洲南', value: 'las' },
  { label: '大洋洲', value: 'oce' },
  { label: '土耳其', value: 'tr' },
  { label: '俄罗斯', value: 'ru' },
  { label: '新加坡', value: 'sg' },
  { label: '印尼', value: 'id' },
  { label: '菲律宾', value: 'ph' },
  { label: '泰国', value: 'th' },
  { label: '越南', value: 'vn' },
  { label: '台湾', value: 'tw' },
  { label: '中东', value: 'me' }
]

const tierOptions = [
  { label: '全部', value: 'all' },
  { label: '黄金 -', value: 'ibsg' },
  { label: '黄金 +', value: 'gold_plus' },
  { label: '铂金 +', value: 'platinum_plus' },
  { label: '翡翠 +', value: 'emerald_plus' },
  { label: '钻石 +', value: 'diamond_plus' },
  { label: '大师', value: 'master' },
  { label: '大师 +', value: 'master_plus' },
  { label: '宗师', value: 'grandmaster' },
  { label: '王者', value: 'challenger' }
]

const versionOptions = computed(() => {
  return versions.value.map((v) => ({ label: v, value: v }))
})

// 一些模式没有位置相关的数据，所以添加一个视觉上的效果以保证其不可选
watchEffect(() => {
  if (mode.value !== 'ranked') {
    position.value = 'none'
  } else {
    position.value = 'top'
  }
})

watchEffect(() => {
  if (mode.value === 'arena') {
    tier.value = 'all'
  }
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
  (atm) => {
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

    // 排除 PVE 模式的英雄
    if (atm.championId && !maybePveChampion(atm.championId)) {
      handleToChampion(atm.championId)
    }
  },
  { immediate: true, debounce: 500 }
)

onActivated(async () => {
  const size = await awm.getWindowSize()

  if (size.width < 480 || size.height < 720) {
    awm.setWindowSize(480, 720)
  }
})
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
