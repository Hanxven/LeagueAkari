<template>
  <div class="opgg-panel" ref="opgg-panel">
    <div class="tabs-area">
      <a href="https://op.gg" :title="t('Opgg.toOpgg')" target="_blank">
        <OpggIcon class="opgg-icon" />
      </a>
      <NButton
        secondary
        class="square-button"
        :title="t('Opgg.refresh')"
        :loading="isLoading"
        @click="loadAll"
      >
        <template #icon>
          <NIcon><RefreshIcon /></NIcon>
        </template>
      </NButton>
      <NButton
        secondary
        class="square-button"
        :title="t('Opgg.settings.button')"
        @click="isSettingsLayerShow = true"
      >
        <template #icon>
          <NIcon><SettingsIcon /></NIcon>
        </template>
      </NButton>
      <NTabs class="tabs" v-model:value="currentTab" type="segment" size="small">
        <NTab name="tier" :tab="t('Opgg.tier')" />
        <NTab
          :title="t('Opgg.champion')"
          name="champion"
          :tab="
            championId
              ? lcs.gameData.champions[championId]?.name || t('Opgg.empty')
              : t('Opgg.empty')
          "
          :disabled="!championId"
        />
      </NTabs>
    </div>
    <div class="filters">
      <NSelect
        size="small"
        :placeholder="t('Opgg.mode')"
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
        :placeholder="t('Opgg.region')"
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
        :placeholder="t('Opgg.rankTier')"
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
        :placeholder="t('Opgg.position')"
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
        :placeholder="t('Opgg.version')"
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
        @to-champion="(id) => handleToChampion(id, false)"
      />
      <OpggChampion
        v-show="currentTab === 'champion'"
        @show-champion="(id) => handleToChampion(id, false)"
        :data="champion"
        :champion="championItem"
        :loading="isLoading"
        :region="region"
        :position="position"
        :tier="tier"
        :mode="mode"
        :version="version || undefined"
        :is-able-to-add-to-item-set="isAbleToAddToItemSet"
        @set-runes="setRunes"
        @set-spells="setSummonerSpells"
        @set-summoner-spells="setSummonerSpells"
        @add-to-item-set="handleAddToItemSet"
      />
    </div>
    <Transition name="fade">
      <div class="settings-overlay" v-if="isSettingsLayerShow">
        <div class="header">
          <span class="title">{{ t('Opgg.settings.title') }}</span>
          <div class="close-btn" @click="isSettingsLayerShow = false" :title="t('Opgg.close')">
            <NIcon class="close-icon"><CloseIcon /></NIcon>
          </div>
        </div>
        <div class="items">
          <ControlItem
            class="control-item-margin"
            style="justify-content: space-between"
            :label="t('Opgg.settings.flashPosition.label')"
            :label-description="t('Opgg.settings.flashPosition.description')"
            :label-width="300"
          >
            <NRadioGroup size="small" v-model:value="flashPosition">
              <NFlex style="gap: 4px" :vertical="isSmallWidth">
                <NRadio value="d" :title="t('Opgg.settings.flashPosition.options.d')">D</NRadio>
                <NRadio value="f" :title="t('Opgg.settings.flashPosition.options.f')">F</NRadio>
                <NRadio value="auto" :title="t('Opgg.settings.flashPosition.options.auto')">
                  {{ t('Opgg.settings.flashPosition.auto') }}
                </NRadio>
              </NFlex>
            </NRadioGroup>
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            style="justify-content: space-between"
            :label="t('Opgg.settings.autoApplyRunes.label')"
            :label-description="t('Opgg.settings.autoApplyRunes.description')"
            :label-width="300"
          >
            <NSwitch v-model:value="os.frontendSettings.autoApplyRunes" size="small" />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            style="justify-content: space-between"
            :label="t('Opgg.settings.autoApplySpells.label')"
            :label-description="t('Opgg.settings.autoApplySpells.description')"
            :label-width="300"
          >
            <NSwitch v-model:value="os.frontendSettings.autoApplySpells" size="small" />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            style="justify-content: space-between"
            :label="t('Opgg.settings.autoApplyItems.label')"
            :label-description="t('Opgg.settings.autoApplyItems.description')"
            :label-width="300"
          >
            <NSwitch v-model:value="os.frontendSettings.autoApplyItems" size="small" />
          </ControlItem>
        </div>
      </div>
    </Transition>
    <NPopover v-if="ongoingChampions.length" raw placement="top-end" :show-arrow="false">
      <template #trigger>
        <ChampionIcon
          class="champion-icon float hover-fade"
          :champion-id="-1"
          ring
          ring-color="#fff8"
          round
        />
      </template>
      <div class="ongoing-champions">
        <ChampionIcon
          class="champion-icon"
          v-for="c of ongoingChampions"
          :key="c"
          :champion-id="c"
          ring
          ring-color="#fff4"
          round
          @click="handleToChampion(c, false)"
        />
      </div>
    </NPopover>
  </div>
</template>

<script lang="ts" setup>
import { useOpggStore } from '@opgg-window/shards/opgg/store'
import OpggIcon from '@renderer-shared/assets/icon/OpggIcon.vue'
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useStableComputed } from '@renderer-shared/compositions/useStableComputed'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { useOpggWindowStore } from '@renderer-shared/shards/window-manager/store'
import { OpggDataApi } from '@shared/data-sources/opgg'
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
} from '@shared/data-sources/opgg/types'
import {
  Close as CloseIcon,
  RefreshSharp as RefreshIcon,
  Settings as SettingsIcon
} from '@vicons/ionicons5'
import { useLocalStorage, useMediaQuery, watchDebounced } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import {
  MessageReactive,
  NButton,
  NFlex,
  NIcon,
  NPopover,
  NRadio,
  NRadioGroup,
  NSelect,
  NSwitch,
  NTab,
  NTabs,
  SelectRenderLabel,
  useMessage
} from 'naive-ui'
import { computed, h, onErrorCaptured, onMounted, ref, shallowRef, watch, watchEffect } from 'vue'

import OpggChampion from './OpggChampion.vue'
import OpggTier from './OpggTier.vue'

const { t } = useTranslation()

const currentTab = ref('tier')

const lcs = useLeagueClientStore()

const lc = useInstance(LeagueClientRenderer)
const log = useInstance(LoggerRenderer)

const as = useAppCommonStore()

// --- 自动应用 (粗糙版) ---
const ows = useOpggWindowStore()
const os = useOpggStore()

const savedPreferences = useLocalStorage('opgg-preferences', {
  mode: 'ranked',
  position: 'top',
  region: 'global',
  tier: 'all'
})

onErrorCaptured((error, _instance, info) => {
  log.warn('view:Opgg', `Component OP.GG error: ${info}`, error)
  return false
})

const isSmallWidth = useMediaQuery('(max-width: 572px)')

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

const api = new OpggDataApi()

watchEffect(async () => {
  if ((!version.value || !versions.value.includes(version.value)) && versions.value.length > 0) {
    version.value = versions.value[0]
  }
})

watch(
  () => as.settings.httpProxy,
  (httpProxy) => {
    if (httpProxy) {
      api.http.defaults.proxy = {
        host: httpProxy.host,
        port: httpProxy.port
      }
    } else {
      api.http.defaults.proxy = undefined
    }
  },
  { immediate: true }
)

const tierData = shallowRef<
  OpggARAMChampionSummary | OpggRankedChampionsSummary | OpggArenaChampionSummary | null
>(null)
const champion = shallowRef<OpggNormalModeChampion | OpggArenaModeChampion | null>(null)

const message = useMessage()

const isLoadingVersions = ref(false)
const isLoadingChampion = ref(false)
const isLoadingTier = ref(false)
const isSettingsLayerShow = ref(false)

// 标记当前加载的数据是否与模式匹配
const isModeMatch = ref(false)

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
      await api.getVersions({
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

    message.warning(t('Opgg.loadVersionsFailedMessage', { reason: (error as any).message }))
    log.warn('view:Opgg', `获取版本数据失败: ${(error as any).message}`, error)
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
    tierData.value = await api.getChampionsTier({
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

    message.warning(t('Opgg.loadTierFailedMessage', { reason: (error as any).message }))
    log.warn('view:Opgg', `获取 tier 数据失败: ${(error as any).message}`, error)
  } finally {
    isLoadingTier.value = false
  }
}

const loadChampionData = async (shouldAutoApply: boolean) => {
  if (!championId.value) {
    return
  }

  if (isLoadingChampion.value) {
    loadChampionController?.abort()
  }

  isLoadingChampion.value = true
  loadChampionController = new AbortController()

  try {
    champion.value = await api.getChampion({
      region: region.value,
      mode: mode.value,
      tier: tier.value,
      version: version.value ?? undefined,
      id: championId.value,
      position: position.value,
      signal: loadChampionController.signal
    })

    // 这段逻辑先耦合在这里, 以后可能会被移除
    if (
      shouldAutoApply &&
      automation.value?.championId === championId.value &&
      isModeMatch.value &&
      ows.show
    ) {
      // any 大法好
      const anyChampion = champion.value as any

      const spells = anyChampion.data.summoner_spells
      const runes = anyChampion.data.runes

      let spellToApply = spells?.[0]
      let runesToApply = runes?.[0]

      if (os.frontendSettings.autoApplyRunes && runesToApply) {
        await setRunes(runesToApply)
      }

      if (os.frontendSettings.autoApplySpells && spellToApply) {
        await setSummonerSpells(spellToApply.ids)
      }

      if (os.frontendSettings.autoApplyItems) {
        await handleAddToItemSet()
      }
    }
  } catch (error) {
    if ((error as any).name === 'CanceledError') {
      return
    }

    message.warning(t('Opgg.loadChampionFailedMessage', { reason: (error as any).message }))
    log.warn('view:Opgg', `获取英雄数据失败: ${(error as any).message}`, error)
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
    await loadChampionData(false)
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
  await loadChampionData(false)
}

const handleToChampion = async (id: number, shouldAutoApply: boolean) => {
  currentTab.value = 'champion'
  championId.value = id
  champion.value = null
  await loadChampionData(shouldAutoApply)
}

onMounted(() => {
  loadAll()
})

const championItem = computed(() => {
  return tierData.value?.data.find((c) => c.id === championId.value)
})

const modeOptions = computed(() => [
  { label: t('Opgg.modes.ranked'), value: 'ranked' },
  { label: t('Opgg.modes.aram'), value: 'aram' },
  { label: t('Opgg.modes.arena'), value: 'arena' },
  { label: t('Opgg.modes.nexus_blitz'), value: 'nexus_blitz' },
  { label: t('Opgg.modes.urf'), value: 'urf' }
])

const positionOptions = computed(() => [
  { label: t('Opgg.positions.top'), value: 'top' },
  { label: t('Opgg.positions.jungle'), value: 'jungle' },
  { label: t('Opgg.positions.mid'), value: 'mid' },
  { label: t('Opgg.positions.adc'), value: 'adc' },
  { label: t('Opgg.positions.support'), value: 'support' },
  { label: t('Opgg.positions.none'), value: 'none', disabled: mode.value === 'ranked' }
])

const regionOptions = computed(() => [
  { label: t('Opgg.regions.global'), value: 'global' },
  { label: t('Opgg.regions.na'), value: 'na' },
  { label: t('Opgg.regions.euw'), value: 'euw' },
  { label: t('Opgg.regions.kr'), value: 'kr' },
  { label: t('Opgg.regions.br'), value: 'br' },
  { label: t('Opgg.regions.eune'), value: 'eune' },
  { label: t('Opgg.regions.jp'), value: 'jp' },
  { label: t('Opgg.regions.lan'), value: 'lan' },
  { label: t('Opgg.regions.las'), value: 'las' },
  { label: t('Opgg.regions.oce'), value: 'oce' },
  { label: t('Opgg.regions.tr'), value: 'tr' },
  { label: t('Opgg.regions.ru'), value: 'ru' },
  { label: t('Opgg.regions.sg'), value: 'sg' },
  { label: t('Opgg.regions.id'), value: 'id' },
  { label: t('Opgg.regions.ph'), value: 'ph' },
  { label: t('Opgg.regions.th'), value: 'th' },
  { label: t('Opgg.regions.vn'), value: 'vn' },
  { label: t('Opgg.regions.tw'), value: 'tw' },
  { label: t('Opgg.regions.me'), value: 'me' }
])

const tierOptions = computed(() => [
  { label: t('Opgg.tiers.all'), value: 'all' },
  { label: t('Opgg.tiers.ibsg'), value: 'ibsg' },
  { label: t('Opgg.tiers.gold_plus'), value: 'gold_plus' },
  { label: t('Opgg.tiers.platinum_plus'), value: 'platinum_plus' },
  { label: t('Opgg.tiers.emerald_plus'), value: 'emerald_plus' },
  { label: t('Opgg.tiers.diamond_plus'), value: 'diamond_plus' },
  { label: t('Opgg.tiers.master'), value: 'master' },
  { label: t('Opgg.tiers.master_plus'), value: 'master_plus' },
  { label: t('Opgg.tiers.grandmaster'), value: 'grandmaster' },
  { label: t('Opgg.tiers.challenger'), value: 'challenger' }
])

const versionOptions = computed(() => {
  return versions.value.map((v) => ({ label: v, value: v }))
})

// 这将实时锁定正在选择的英雄
const automation = useStableComputed(() => {
  if (!lcs.champSelect.session || !lcs.gameflow.session) {
    return
  }

  const selfCellId = lcs.champSelect.session.localPlayerCellId
  const self = lcs.champSelect.session.myTeam.find((p) => p.cellId === selfCellId)
  const selfActionChampionId = lcs.champSelect.session.actions
    .flat(1)
    .find((a) => a.actorCellId === selfCellId && a.type === 'pick' && a.championId)?.championId

  if (!self && !selfActionChampionId) {
    return
  }

  return {
    championId: self?.championId || selfActionChampionId,
    assignedPosition: self?.assignedPosition,
    gameMode: lcs.gameflow.session.gameData.queue.gameMode
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

    isModeMatch.value = true

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
      default:
        isModeMatch.value = false
    }

    await loadAll()

    if (
      atm.championId &&
      atm.championId !== -3 &&
      !lcs.champSelect.disabledChampionIds.has(atm.championId)
    ) {
      await handleToChampion(atm.championId, true)
    }
  },
  { immediate: true, debounce: 500 }
)

const flashPosition = useLocalStorage('opgg-flash-position', 'auto')

const SUMMONER_SPELL_FLASH_ID = 4

const setSummonerSpells = async (ids: number[]) => {
  try {
    const selection = (await lc.api.champSelect.getMySelections()).data

    const [oldSpell1Id, oldSpell2Id] = [selection.spell1Id, selection.spell2Id]
    let [newSpell1Id, newSpell2Id] = ids

    // 有闪现的情况且不为 auto 时, 优先按照偏好闪现位置, 否则强制按照 auto
    if (
      flashPosition.value !== 'auto' &&
      (newSpell1Id === SUMMONER_SPELL_FLASH_ID || newSpell2Id === SUMMONER_SPELL_FLASH_ID)
    ) {
      if (newSpell2Id === SUMMONER_SPELL_FLASH_ID) {
        if (flashPosition.value === 'd') {
          ;[newSpell1Id, newSpell2Id] = [newSpell2Id, newSpell1Id]
        }
      } else if (newSpell1Id === SUMMONER_SPELL_FLASH_ID) {
        if (flashPosition.value === 'f') {
          ;[newSpell1Id, newSpell2Id] = [newSpell2Id, newSpell1Id]
        }
      }
    } else {
      if (newSpell1Id === oldSpell2Id || newSpell2Id === oldSpell1Id) {
        ;[newSpell1Id, newSpell2Id] = [newSpell2Id, newSpell1Id]
      }
    }

    await lc.api.champSelect.setSummonerSpells({
      spell1Id: newSpell1Id,
      spell2Id: newSpell2Id
    })
    message.success(() =>
      t('Opgg.success', {
        reason: t('Opgg.summonerSpells')
      })
    )

    if (lcs.chat.conversations.championSelect) {
      lc.api.chat
        .chatSend(
          lcs.chat.conversations.championSelect.id,
          t('Opgg.spellsSet', {
            spell1: lcs.gameData.summonerSpells[newSpell1Id]?.name || newSpell1Id,
            spell2: lcs.gameData.summonerSpells[newSpell2Id]?.name || newSpell2Id
          }),
          'celebration'
        )
        .catch(() => {})
    }
  } catch (error) {
    log.warn('view:Opgg', `设置召唤师技能失败: ${(error as any).message}`, error)
    message.warning(t('Opgg.setSpellsFailedMessage', { reason: (error as any).message }))
  }
}

const setRunes = async (r: {
  primary_page_id: number
  secondary_page_id: number
  primary_rune_ids: number[]
  secondary_rune_ids: number[]
  stat_mod_ids: number[]
}) => {
  try {
    const inventory = (await lc.api.perks.getPerkInventory()).data
    let addedNew = false
    const positionName =
      position.value && position.value !== 'none' ? t(`Opgg.positions.${position.value}`) || '' : ''

    if (inventory.canAddCustomPage) {
      const { data: added } = await lc.api.perks.postPerkPage({
        name: `[OP.GG] ${lcs.gameData.champions[championId?.value || -1]?.name || '-'}${positionName ? ` - ${positionName}` : ''}`,
        isEditable: true,
        primaryStyleId: r.primary_page_id.toString()
      })
      await lc.api.perks.putPage({
        id: added.id,
        isRecommendationOverride: false,
        isTemporary: false,
        name: `[OP.GG] ${lcs.gameData.champions[championId?.value || -1]?.name || '-'}${positionName ? ` - ${positionName}` : ''}`,
        primaryStyleId: r.primary_page_id,
        selectedPerkIds: [...r.primary_rune_ids, ...r.secondary_rune_ids, ...r.stat_mod_ids],
        subStyleId: r.secondary_page_id
      })
      await lc.api.perks.putCurrentPage(added.id)
      addedNew = true
    } else {
      const pages = (await lc.api.perks.getPerkPages()).data
      if (!pages.length) {
        return
      }

      const page1 = pages[0]
      await lc.api.perks.putPage({
        id: page1.id,
        isRecommendationOverride: false,
        isTemporary: false,
        name: `[OP.GG] ${lcs.gameData.champions[championId?.value || -1]?.name || '-'}${positionName ? ` - ${positionName}` : ''}`,
        primaryStyleId: r.primary_page_id,
        selectedPerkIds: [...r.primary_rune_ids, ...r.secondary_rune_ids, ...r.stat_mod_ids],
        subStyleId: r.secondary_page_id
      })
      await lc.api.perks.putCurrentPage(page1.id)
    }

    message.success(() =>
      t('Opgg.success', {
        reason: t('Opgg.runes')
      })
    )

    if (lcs.chat.conversations.championSelect) {
      lc.api.chat.chatSend(
        lcs.chat.conversations.championSelect.id,
        t('Opgg.runesSet', {
          name: `[OP.GG] ${lcs.gameData.champions[championId?.value || -1]?.name || '-'}${positionName ? ` - ${positionName}` : ''}`,
          action: addedNew ? t('Opgg.create') : t('Opgg.replace')
        }),
        'celebration'
      )
    }
  } catch (error) {
    log.warn('view:Opgg', `设置符文配法失败: ${(error as any).message}`, error)
    message.warning(t('Opgg.setRunesFailedMessage', { reason: (error as any).message }))
  }
}

const isAbleToAddToItemSet = computed(() => {
  if (!champion.value) {
    return false
  }

  let result = false

  if (champion.value.data.boots && champion.value.data.boots.length) {
    result = true
  }

  if (champion.value.data.starter_items && champion.value.data.starter_items.length) {
    result = true
  }

  if (champion.value.data.core_items && champion.value.data.core_items.length) {
    result = true
  }

  if (champion.value.data.last_items && champion.value.data.last_items.length) {
    result = true
  }

  // @ts-ignore
  if (champion.value.data.prism_items && champion.value.data.prism_items.length) {
    result = true
  }

  return result
})

// 防止添加一大堆重复内容
// akari1 用于标记为本软件生成的装备集
const toItemSetsUid = (traits: {
  championId: number
  mode?: string
  region?: string
  tier?: string
  position?: string
  version?: string
}) => {
  return `akari1-${traits.championId}-${traits.mode || '_'}-${traits.region || '_'}-${traits.tier || '_'}-${traits.position || '_'}-${traits.version || '_'}`
}

// TODO
const handleAddToItemSet = async () => {
  if (!champion.value || !isAbleToAddToItemSet.value) {
    return
  }

  try {
    const itemGroups: Array<{ title: string; items: number[] }> = []
    const positionName =
      position.value && position.value !== 'none' ? t(`Opgg.positions.${position.value}`) || '' : ''

    const newUid = toItemSetsUid({
      championId: championItem.value?.id || -1,
      mode: mode.value,
      region: region.value,
      tier: tier.value,
      position: position.value,
      version: version.value || '0'
    })

    if (champion.value.data.starter_items && champion.value.data.starter_items.length) {
      champion.value.data.starter_items.slice(0, 3).forEach((s: any, i: number) => {
        itemGroups.push({
          title: t('OpggChampion.starterItem', {
            index: i + 1,
            pickRate: (s.pick_rate * 100).toFixed(2)
          }),
          items: s.ids
        })
      })
    }

    if (champion.value.data.boots && champion.value.data.boots.length) {
      itemGroups.push({
        title: t('OpggChampion.bootsDesc'),
        items: champion.value.data.boots.reduce((acc: number[], cur: any) => {
          acc.push(...cur.ids)
          return acc
        }, [])
      })
    }

    // @ts-ignore
    if (champion.value.data?.prism_items && champion.value.data?.prism_items.length) {
      itemGroups.push({
        title: t('OpggChampion.prismItemsDesc'),
        // @ts-ignore
        items: champion.value.data?.prism_items.reduce((acc: number[], cur: any) => {
          acc.push(...cur.ids)
          return acc
        }, [])
      })
    }

    if (champion.value.data.core_items && champion.value.data.core_items.length) {
      champion.value.data.core_items.slice(0, 4).forEach((s: any, i: number) => {
        itemGroups.push({
          title: t('OpggChampion.coreItem', {
            index: i + 1,
            pickRate: (s.pick_rate * 100).toFixed(2)
          }),
          items: s.ids
        })
      })
    }

    if (champion.value.data.last_items && champion.value.data.last_items.length) {
      itemGroups.push({
        title: t('OpggChampion.itemsDesc'),
        items: champion.value.data.last_items.reduce((acc: number[], cur: any) => {
          acc.push(...cur.ids)
          return acc
        }, [])
      })
    }

    await lc.writeItemSetsToDisk([
      {
        uid: newUid,
        title: `[OP.GG] ${lcs.gameData.champions[championItem.value?.id || -1]?.name || '-'}${positionName ? ` - ${positionName}` : ''}${mode.value === 'arena' || mode.value === 'nexus_blitz' ? ` ${t(`Opgg.modes.${position.value}`)}` : ''}`,
        sortrank: 0,
        type: 'global',
        map: 'any',
        mode: 'any',
        blocks: itemGroups.map((g) => ({
          type: g.title,
          items: g.items.map((i) => ({
            id: i.toString(),
            count: 1
          }))
        })),
        associatedChampions: [],
        associatedMaps: [],
        preferredItemSlots: []
      }
    ])

    message.success(t('OpggChampion.writtenToDisk'))

    if (lcs.chat.conversations.championSelect) {
      lc.api.chat
        .chatSend(
          lcs.chat.conversations.championSelect.id,
          t('OpggChampion.writeToDisk', {
            name: `[OP.GG] ${lcs.gameData.champions[championItem.value?.id || -1]?.name || '-'}${positionName ? ` - ${positionName}` : ''}`
          }),
          'celebration'
        )
        .catch(() => {})
    }
  } catch (error) {
    log.warn('view:OpggChampion', `[OP.GG] 添加到物品集失败: ${(error as any).message}`, error)
    message.warning(
      t('OpggChampion.writeFileFailedMessage', {
        error: (error as any).message
      })
    )
  }
}

const ongoingChampions = computed(() => {
  const gSession = lcs.gameflow.session

  if (!gSession) {
    return []
  }

  if (gSession.phase === 'ChampSelect') {
    const cSession = lcs.champSelect.session

    if (!cSession) {
      return []
    }

    const c1 = cSession.myTeam.map((t) => t.championId || t.championPickIntent).filter((c) => c > 0)
    const c2 = cSession.theirTeam
      .map((t) => t.championId || t.championPickIntent)
      .filter((c) => c > 0)

    return [...new Set([...c1, ...c2])]
  } else if (
    gSession.phase === 'GameStart' ||
    gSession.phase === 'InProgress' ||
    gSession.phase === 'WaitingForStats' ||
    gSession.phase === 'PreEndOfGame' ||
    gSession.phase === 'EndOfGame' ||
    gSession.phase === 'Reconnect'
  ) {
    const c1 = gSession.gameData.teamOne.map((t) => t.championId).filter((c) => c > 0)
    const c2 = gSession.gameData.teamTwo.map((t) => t.championId).filter((c) => c > 0)

    return [...new Set([...c1, ...c2])]
  }

  return []
})

const notConnectedMessageRef = shallowRef<MessageReactive | null>(null)
watch(
  () => lcs.isConnected,
  (isConnected) => {
    if (isConnected) {
      notConnectedMessageRef.value?.destroy()
    } else {
      notConnectedMessageRef.value?.destroy()
      notConnectedMessageRef.value = message.warning(() => t('Opgg.notConnected'), {
        duration: 0
      })
    }
  },
  { immediate: true }
)
</script>

<style lang="less" scoped>
.opgg-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 2px 8px 8px 8px;
  height: 100%;
  min-width: 480px;

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
    color: #fff;
  }

  .square-button {
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

  .settings-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #202020d8;
    backdrop-filter: blur(8px);
    z-index: 100;
    padding: 24px 36px;

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title {
        font-size: 24px;
        font-weight: bold;
        color: white;
      }

      .close-btn {
        display: flex;
        height: 36px;
        width: 36px;
        cursor: pointer;
        font-size: 22px;
        background-color: rgba(255, 255, 255, 0.04);
        border-radius: 4px;
        transition: background-color 0.2s;

        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        &:active {
          background-color: rgba(255, 255, 255, 0.08);
        }

        &:hover .close-icon {
          transform: rotateZ(90deg);
        }
      }

      .close-icon {
        transition: transform 0.3s;
        margin: auto;
      }
    }

    .items {
      margin-top: 24px;
    }
  }
}

.settings-aux-window-only {
  font-size: 12px;
  font-weight: bold;
  color: #62deb4;
}

.ongoing-champions {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  background-color: #202020a0;
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.float {
  position: absolute;
  bottom: 20px;
  right: 20px;
}

.champion-icon {
  width: 36px;
  height: 36px;
  cursor: pointer;

  &.hover-fade {
    opacity: 0.2;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }
  }
}

.fade-enter-active {
  transition: opacity 0.2s;
}

.fade-leave-active {
  transition:
    opacity 0.3s,
    transform 0.3s,
    filter 0.3s;
}

.fade-enter-from {
  opacity: 0;
}

.fade-leave-to {
  transform: scale(1.02);
  filter: blur(4px);
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
