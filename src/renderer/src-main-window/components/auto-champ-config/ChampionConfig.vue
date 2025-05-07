<template>
  <div>
    <NModal
      preset="card"
      size="small"
      :class="$style['champion-config-wrapper']"
      transform-origin="center"
      v-model:show="show"
    >
      <template #header>
        <div class="header">
          <template v-if="selectedId">
            <LcuImage class="header-icon" :src="championIconUri(selectedId)" />
            <span>{{ lcs.gameData.champions[selectedId]?.name }}</span>
          </template>
          <template v-else>{{ t('ChampionConfig.configure') }}</template>
        </div>
      </template>
      <div class="content">
        <div class="filter-area">
          <NInput
            clearable
            size="small"
            :placeholder="t('ChampionConfig.searchPlaceholder')"
            v-model:value="filterInput"
          >
            <template #prefix>
              <NIcon :component="SearchIcon" />
            </template>
          </NInput>
          <NVirtualList
            class="champion-list"
            :padding-top="2"
            :item-size="30"
            key-field="value"
            :items="championOptions"
          >
            <template #default="{ item }">
              <div
                class="champion-item"
                :class="{
                  selected: item.value === selectedId
                }"
                @click="handleChangeChampion(item.value)"
              >
                <LcuImage class="icon" :src="championIconUri(item.value)" />
                <div class="champion-name">{{ item.label }}</div>
                <NPopover :keep-alive-on-hover="false" v-if="item.hasRunes || item.hasSpells">
                  <template #trigger>
                    <template v-if="item.hasRunes">
                      <NIcon class="configure-status configured">
                        <CheckmarkCircle16RegularIcon />
                      </NIcon>
                    </template>
                    <template v-else>
                      <NIcon class="configure-status not-configured">
                        <SubtractCircle16RegularIcon />
                      </NIcon>
                    </template>
                  </template>
                  <template v-if="item.hasRunes">{{
                    t('ChampionConfig.runesConfigured')
                  }}</template>
                  <template v-else>{{ t('ChampionConfig.runesUnconfigured') }}</template>
                </NPopover>
                <NPopover :keep-alive-on-hover="false" v-if="item.hasRunes || item.hasSpells">
                  <template #trigger>
                    <template v-if="item.hasSpells">
                      <NIcon class="configure-status configured">
                        <CheckmarkCircle16RegularIcon />
                      </NIcon>
                    </template>
                    <template v-else>
                      <NIcon class="configure-status not-configured">
                        <SubtractCircle16RegularIcon />
                      </NIcon>
                    </template>
                  </template>
                  <template v-if="item.hasSpells">{{
                    t('ChampionConfig.spellsConfigured')
                  }}</template>
                  <template v-else>{{ t('ChampionConfig.spellsUnconfigured') }}</template>
                </NPopover>
              </div>
            </template>
          </NVirtualList>
        </div>
        <div class="divider"></div>
        <div class="config-area" v-if="selectedId">
          <div class="tabs-section">
            <div class="tab-title">{{ t('ChampionConfig.targetMode') }}</div>
            <NRadioGroup v-model:value="currentType" size="small">
              <NRadioButton value="ranked">
                <div class="radio-button-inner">
                  <LcuImage class="mode-icon" :src="gameModeIconUri['CLASSIC']" />
                  <span>{{ t('ChampionConfig.ranked') }}</span>
                  <NIcon
                    v-if="
                      configExistence.runes.some((r) => r.startsWith('ranked')) ||
                      configExistence.spells.some((r) => r.startsWith('ranked'))
                    "
                    class="check-icon"
                  >
                    <CheckmarkCircle16RegularIcon />
                  </NIcon>
                </div>
              </NRadioButton>
              <NRadioButton value="normal">
                <div class="radio-button-inner">
                  <LcuImage class="mode-icon" :src="gameModeIconUri['CLASSIC']" />
                  <span>{{ t('ChampionConfig.normal') }}</span>
                  <NIcon
                    v-if="
                      configExistence.runes.includes('normal') ||
                      configExistence.spells.includes('normal')
                    "
                    class="check-icon"
                  >
                    <CheckmarkCircle16RegularIcon />
                  </NIcon>
                </div>
              </NRadioButton>
              <NRadioButton value="aram">
                <div class="radio-button-inner">
                  <LcuImage class="mode-icon" :src="gameModeIconUri['ARAM']" />
                  <span>{{ t('ChampionConfig.aram') }}</span>
                  <NIcon
                    v-if="
                      configExistence.runes.includes('aram') ||
                      configExistence.spells.includes('aram')
                    "
                    class="check-icon"
                  >
                    <CheckmarkCircle16RegularIcon />
                  </NIcon>
                </div>
              </NRadioButton>
              <NRadioButton value="urf">
                <div class="radio-button-inner">
                  <LcuImage class="mode-icon" :src="gameModeIconUri['CLASSIC']" />
                  <span>{{ t('ChampionConfig.urf') }}</span>
                  <NIcon
                    v-if="
                      configExistence.runes.includes('urf') ||
                      configExistence.spells.includes('urf')
                    "
                    class="check-icon"
                  >
                    <CheckmarkCircle16RegularIcon />
                  </NIcon>
                </div>
              </NRadioButton>
              <NRadioButton value="nexusblitz">
                <div class="radio-button-inner">
                  <LcuImage class="mode-icon" :src="gameModeIconUri['NEXUSBLITZ']" />
                  <span>{{ t('ChampionConfig.nexusblitz') }}</span>
                  <NIcon
                    v-if="
                      configExistence.runes.includes('nexusblitz') ||
                      configExistence.spells.includes('nexusblitz')
                    "
                    class="check-icon"
                  >
                    <CheckmarkCircle16RegularIcon />
                  </NIcon>
                </div>
              </NRadioButton>
              <NRadioButton value="ultbook">
                <div class="radio-button-inner">
                  <LcuImage class="mode-icon" :src="gameModeIconUri['ULTBOOK']" />
                  <span>{{ t('ChampionConfig.ultbook') }}</span>
                  <NIcon
                    v-if="
                      configExistence.runes.includes('ultbook') ||
                      configExistence.spells.includes('ultbook')
                    "
                    class="check-icon"
                  >
                    <CheckmarkCircle16RegularIcon />
                  </NIcon>
                </div>
              </NRadioButton>
            </NRadioGroup>
          </div>
          <div class="tabs-sections">
            <div class="tabs-section">
              <div class="tab-title">{{ t('ChampionConfig.configure') }}</div>
              <NRadioGroup v-model:value="currentConfig" size="small">
                <NRadioButton value="runes">
                  <div class="radio-button-inner">
                    <span>{{ t('ChampionConfig.runes') }}</span>
                    <NIcon
                      v-if="configExistence.runes.some((r) => r.startsWith(currentType))"
                      class="check-icon"
                    >
                      <CheckmarkCircle16RegularIcon />
                    </NIcon>
                  </div>
                </NRadioButton>
                <NRadioButton value="spells">
                  <div class="radio-button-inner">
                    <span>{{ t('ChampionConfig.spells') }}</span>
                    <NIcon
                      v-if="configExistence.spells.some((r) => r.startsWith(currentType))"
                      class="check-icon"
                    >
                      <CheckmarkCircle16RegularIcon />
                    </NIcon>
                  </div>
                </NRadioButton>
              </NRadioGroup>
            </div>
            <div class="tabs-section" v-if="currentType === 'ranked'">
              <div class="tab-title">{{ t('ChampionConfig.position') }}</div>
              <NRadioGroup
                v-model:value="currentPosition"
                size="small"
                :theme-overrides="{
                  labelPadding: '0 8px'
                }"
              >
                <NRadioButton value="default">
                  <div class="radio-button-inner">
                    <PositionIcon position="all" />
                    <span>{{ t('ChampionConfig.default') }}</span>
                    <NIcon
                      v-if="
                        currentConfig === 'runes'
                          ? configExistence.runes.includes(`${currentType}-default`)
                          : configExistence.spells.includes(`${currentType}-default`)
                      "
                      class="check-icon"
                    >
                      <CheckmarkCircle16RegularIcon />
                    </NIcon>
                  </div>
                </NRadioButton>
                <NRadioButton value="top">
                  <div class="radio-button-inner">
                    <PositionIcon position="top" />
                    <span>{{ t('common.lanes.top') }}</span>
                    <NIcon
                      v-if="
                        currentConfig === 'runes'
                          ? configExistence.runes.includes(`${currentType}-top`)
                          : configExistence.spells.includes(`${currentType}-top`)
                      "
                      class="check-icon"
                    >
                      <CheckmarkCircle16RegularIcon />
                    </NIcon>
                  </div>
                </NRadioButton>
                <NRadioButton value="middle">
                  <div class="radio-button-inner">
                    <PositionIcon position="middle" />
                    <span>{{ t('common.lanes.middle') }}</span>
                    <NIcon
                      v-if="
                        currentConfig === 'runes'
                          ? configExistence.runes.includes(`${currentType}-middle`)
                          : configExistence.spells.includes(`${currentType}-middle`)
                      "
                      class="check-icon"
                    >
                      <CheckmarkCircle16RegularIcon />
                    </NIcon>
                  </div>
                </NRadioButton>
                <NRadioButton value="jungle">
                  <div class="radio-button-inner">
                    <PositionIcon position="jungle" />
                    <span>{{ t('common.lanes.jungle') }}</span>
                    <NIcon
                      v-if="
                        currentConfig === 'runes'
                          ? configExistence.runes.includes(`${currentType}-jungle`)
                          : configExistence.spells.includes(`${currentType}-jungle`)
                      "
                      class="check-icon"
                    >
                      <CheckmarkCircle16RegularIcon />
                    </NIcon>
                  </div>
                </NRadioButton>
                <NRadioButton value="bottom">
                  <div class="radio-button-inner">
                    <PositionIcon position="bottom" />
                    <span>{{ t('common.lanes.bottom') }}</span>
                    <NIcon
                      v-if="
                        currentConfig === 'runes'
                          ? configExistence.runes.includes(`${currentType}-bottom`)
                          : configExistence.spells.includes(`${currentType}-bottom`)
                      "
                      class="check-icon"
                    >
                      <CheckmarkCircle16RegularIcon />
                    </NIcon>
                  </div>
                </NRadioButton>
                <NRadioButton value="utility">
                  <div class="radio-button-inner">
                    <PositionIcon position="utility" />
                    <span>{{ t('common.lanes.utility') }}</span>
                    <NIcon
                      v-if="
                        currentConfig === 'runes'
                          ? configExistence.runes.includes(`${currentType}-utility`)
                          : configExistence.spells.includes(`${currentType}-utility`)
                      "
                      class="check-icon"
                    >
                      <CheckmarkCircle16RegularIcon />
                    </NIcon>
                  </div>
                </NRadioButton>
              </NRadioGroup>
            </div>
          </div>
          <div class="runes" v-if="currentConfig === 'runes'">
            <RuneV2Edit v-model:page="tempEditingRunes" v-if="tempEditingRunes" />
            <div class="empty-placeholder" v-else>
              <span>{{ t('ChampionConfig.runesUnconfigured') }}</span>
              <NButton secondary size="small" type="primary" @click="handleCreateRunesConfig">{{
                t('ChampionConfig.configureRunes')
              }}</NButton>
            </div>
          </div>
          <div class="spells" v-else-if="currentConfig === 'spells'">
            <SummonerSpellEdit
              v-if="tempEditingSpells"
              :game-mode="typeToGameMode(currentType)"
              v-model:spell-ids="tempEditingSpells"
            />
            <div class="empty-placeholder" v-else>
              <span>{{ t('ChampionConfig.spellsUnconfigured') }}</span>
              <NButton size="small" secondary type="primary" @click="handleCreateSpellsConfig">{{
                t('ChampionConfig.configureSpells')
              }}</NButton>
            </div>
          </div>
          <div class="actions">
            <template v-if="currentConfig === 'runes'">
              <NButton size="small" @click="handleClearRunes" :disabled="!tempEditingRunes">{{
                t('ChampionConfig.clear')
              }}</NButton>

              <NButton size="small" :disabled="isRunesUnchanged" @click="handleRestoreRunes">{{
                t('ChampionConfig.restore')
              }}</NButton>
              <NButton
                size="small"
                type="primary"
                :disabled="isRunesUnchanged || !isRunesValid"
                @click="handleSaveRunes"
                >{{ t('ChampionConfig.save') }}</NButton
              >
            </template>
            <template v-else-if="currentConfig === 'spells'">
              <NButton size="small" @click="handleClearSpells" :disabled="!tempEditingSpells">{{
                t('ChampionConfig.clear')
              }}</NButton>
              <NButton size="small" @click="handleRestoreSpells" :disabled="isSpellsUnchanged">{{
                t('ChampionConfig.restore')
              }}</NButton>
              <NButton
                size="small"
                type="primary"
                @click="handleSaveSpells"
                :disabled="isSpellsUnchanged"
                >{{ t('ChampionConfig.save') }}</NButton
              >
            </template>
          </div>
        </div>
        <div v-else class="config-area-empty-placeholder">
          {{ t('ChampionConfig.noChampionPlaceholder') }}
        </div>
      </div>
    </NModal>
    <NButton size="tiny" type="primary" @click="show = true">{{
      t('ChampionConfig.configure')
    }}</NButton>
  </div>
</template>

<script lang="ts" setup>
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoChampConfigRenderer } from '@renderer-shared/shards/auto-champ-config'
import {
  ChampionRunesConfig,
  SummonerSpellsConfig,
  useAutoChampConfigStore
} from '@renderer-shared/shards/auto-champ-config/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { maybePveChampion } from '@shared/types/league-client/game-data'
import { Search as SearchIcon } from '@vicons/carbon'
import {
  CheckmarkCircle16Regular as CheckmarkCircle16RegularIcon,
  SubtractCircle16Regular as SubtractCircle16RegularIcon
} from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import _ from 'lodash'
import {
  NButton,
  NCard,
  NIcon,
  NInput,
  NModal,
  NPopover,
  NRadioButton,
  NRadioGroup,
  NVirtualList,
  selectDark,
  useMessage
} from 'naive-ui'
import { computed, ref, toRaw, watch } from 'vue'

import { useChampionNameMatch } from '@main-window/compositions/useChampionNameMatch'
import { useMapAssets } from '@main-window/compositions/useMapAssets'

import RuneV2Edit from './RuneV2Edit.vue'
import SummonerSpellEdit from './SummonerSpellEdit.vue'
import { useValidatedRunes } from './utils'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const acs = useAutoChampConfigStore()
const ac = useInstance(AutoChampConfigRenderer)

const { match: isNameMatch } = useChampionNameMatch()

const show = defineModel<boolean>('show', { default: false })

const filterInput = ref('')

const championOptions = computed(() => {
  const sorted = Object.values(lcs.gameData.champions)
    .map((c) => {
      const hasRunes =
        acs.settings.runesV2[c.id] && Object.values(acs.settings.runesV2[c.id]).some((r) => r)
      const hasSpells =
        acs.settings.summonerSpells[c.id] &&
        Object.values(acs.settings.summonerSpells[c.id]).some((s) => s)

      return {
        ...c,
        hasRunes,
        hasSpells
      }
    })
    .toSorted((a, b) => {
      const aIsPVE = maybePveChampion(a.id)
      const bIsPVE = maybePveChampion(b.id)

      if (aIsPVE && !bIsPVE) {
        return 1
      } else if (!aIsPVE && bIsPVE) {
        return -1
      } else if (aIsPVE && bIsPVE) {
        return a.name.localeCompare(b.name, 'zh-Hans-CN')
      }

      const aConfigCount = (a.hasRunes ? 1 : 0) + (a.hasSpells ? 1 : 0)
      const bConfigCount = (b.hasRunes ? 1 : 0) + (b.hasSpells ? 1 : 0)

      if (aConfigCount === 0 && bConfigCount === 0) {
        return a.name.localeCompare(b.name, 'zh-Hans-CN')
      }
      if (aConfigCount === 0 && bConfigCount !== 0) {
        return 1
      }
      if (aConfigCount !== 0 && bConfigCount === 0) {
        return -1
      }

      if (aConfigCount === bConfigCount) {
        if (aConfigCount === 2) {
          return a.name.localeCompare(b.name, 'zh-Hans-CN')
        }
        if (aConfigCount === 1) {
          if (a.hasRunes && b.hasSpells) {
            return -1
          }
          if (a.hasSpells && b.hasRunes) {
            return 1
          }
          return a.name.localeCompare(b.name, 'zh-Hans-CN')
        }
      } else {
        return aConfigCount > bConfigCount ? -1 : 1
      }

      return a.name.localeCompare(b.name, 'zh-Hans-CN')
    })

  const isEmpty = filterInput.value.trim() === ''
  const nonEmpty = sorted.filter((b) => b.id !== -1)

  if (isEmpty) {
    return nonEmpty.map((b) => ({
      value: b.id,
      label: b.name,
      hasRunes: b.hasRunes,
      hasSpells: b.hasSpells
    }))
  } else {
    return nonEmpty
      .filter((b) => isNameMatch(filterInput.value, b.name, b.id))
      .map((b) => ({
        value: b.id,
        label: b.name,
        hasRunes: b.hasRunes,
        hasSpells: b.hasSpells
      }))
  }
})

const message = useMessage()

const selectedId = ref<number | null>(null)
const currentType = ref('ranked')
const currentConfig = ref('runes')
const currentPosition = ref('default')

const tempEditingRunes = ref<ChampionRunesConfig | null>(null)
const tempEditingSpells = ref<SummonerSpellsConfig | null>(null)

watch(
  [
    () => selectedId.value,
    () => currentType.value,
    () => currentConfig.value,
    () => currentPosition.value
  ],
  ([id, type, config, position]) => {
    if (!id) {
      tempEditingRunes.value = null
      tempEditingSpells.value = null
      return
    }

    if (config === 'runes') {
      tempEditingSpells.value = null
      tempEditingRunes.value = null

      if (acs.settings.runesV2[id]) {
        if (type === 'ranked') {
          tempEditingRunes.value = structuredClone(
            acs.settings.runesV2[id][`${type}-${position}`] || null
          )
        } else {
          tempEditingRunes.value = structuredClone(acs.settings.runesV2[id][type] || null)
        }
      } else {
      }
    } else if (config === 'spells') {
      tempEditingRunes.value = null
      tempEditingSpells.value = null

      if (acs.settings.summonerSpells[id]) {
        if (type === 'ranked') {
          tempEditingSpells.value = acs.settings.summonerSpells[id][`${type}-${position}`] || null
        } else {
          tempEditingSpells.value = acs.settings.summonerSpells[id][type] || null
        }
      } else {
      }
    }
  },
  { immediate: true }
)

const handleChangeChampion = (id: number) => {
  selectedId.value = id
}

// Here just create an object and the RuneV2Edit will handle the initialization and correct the data
const handleCreateRunesConfig = () => {
  if (!selectedId.value) {
    return
  }

  tempEditingRunes.value = {
    primaryStyleId: 0,
    subStyleId: 0,
    selectedPerkIds: []
  }
}

const handleSaveRunes = async () => {
  if (!selectedId.value) {
    return
  }

  if (currentType.value === 'ranked') {
    await ac.updatePositionRunes(
      selectedId.value,
      currentType.value,
      currentPosition.value,
      toRaw(tempEditingRunes.value)
    )
  } else {
    await ac.updateRunes(selectedId.value, currentType.value, toRaw(tempEditingRunes.value))
  }

  message.success(() => t('ChampionConfig.runesSaved'))
}

const handleClearRunes = () => {
  if (!selectedId.value) {
    return
  }

  tempEditingRunes.value = null
}

const handleCreateSpellsConfig = () => {
  if (!selectedId.value) {
    return
  }

  tempEditingSpells.value = {
    spell1Id: 0,
    spell2Id: 0
  }
}

const handleSaveSpells = async () => {
  if (!selectedId.value) {
    return
  }

  if (currentType.value === 'ranked') {
    await ac.updatePositionSummonerSpells(
      selectedId.value,
      currentType.value,
      currentPosition.value,
      toRaw(tempEditingSpells.value)
    )
  } else {
    await ac.updateSummonerSpells(
      selectedId.value,
      currentType.value,
      toRaw(tempEditingSpells.value)
    )
  }

  message.success(() => t('ChampionConfig.spellsSaved'))
}

const handleClearSpells = () => {
  if (!selectedId.value) {
    return
  }

  tempEditingSpells.value = null
}

const handleRestoreSpells = () => {
  if (!selectedId.value) {
    return
  }

  if (currentType.value === 'ranked') {
    tempEditingSpells.value = structuredClone(
      acs.settings.summonerSpells[selectedId.value]?.[
        `${currentType.value}-${currentPosition.value}`
      ] || null
    )
  } else {
    tempEditingSpells.value = structuredClone(
      acs.settings.summonerSpells[selectedId.value]?.[currentType.value] || null
    )
  }

  message.success(() => t('ChampionConfig.spellsRestored'))
}

const handleRestoreRunes = () => {
  if (!selectedId.value) {
    return
  }

  if (currentType.value === 'ranked') {
    tempEditingRunes.value = structuredClone(
      acs.settings.runesV2[selectedId.value]?.[`${currentType.value}-${currentPosition.value}`] ||
        null
    )
  } else {
    tempEditingRunes.value = structuredClone(
      acs.settings.runesV2[selectedId.value]?.[currentType.value] || null
    )
  }

  message.success(() => t('ChampionConfig.runesRestored'))
}

// 在可用时始终选择一个英雄
watch(
  () => championOptions.value,
  (options) => {
    if (!selectedId.value && options.length) {
      selectedId.value = options[0].value
    }
  },
  { immediate: true }
)

// 在发生变化时更新到当前配置
watch(
  () => acs.settings.runesV2,
  (runes) => {
    if (!selectedId.value) {
      return
    }

    if (currentConfig.value === 'runes' && runes[selectedId.value]) {
      if (currentType.value === 'ranked') {
        const currentPageValue =
          runes[selectedId.value][`${currentType.value}-${currentPosition.value}`] || null
        tempEditingRunes.value = structuredClone(currentPageValue)
      } else {
        tempEditingRunes.value = runes[selectedId.value][currentType.value] || null
      }
    } else {
      tempEditingRunes.value = null
    }
  }
)

watch(
  () => acs.settings.summonerSpells,
  (spells) => {
    if (!selectedId.value) {
      return
    }

    if (currentConfig.value === 'spells' && spells[selectedId.value]) {
      if (currentType.value === 'ranked') {
        tempEditingSpells.value = structuredClone(
          spells[selectedId.value][`${currentType.value}-${currentPosition.value}`] || null
        )
      } else {
        tempEditingSpells.value = structuredClone(
          spells[selectedId.value][currentType.value] || null
        )
      }
    } else {
      tempEditingSpells.value = null
    }
  }
)

const isRunesUnchanged = computed(() => {
  if (!selectedId.value) {
    return true
  }

  if (currentConfig.value === 'runes') {
    if (currentType.value === 'ranked') {
      return _.isEqual(
        tempEditingRunes.value,
        acs.settings.runesV2[selectedId.value]?.[`${currentType.value}-${currentPosition.value}`] ||
          null
      )
    } else {
      return _.isEqual(
        tempEditingRunes.value,
        acs.settings.runesV2[selectedId.value]?.[currentType.value] || null
      )
    }
  }

  return true
})

const isRunesValid = computed(() => {
  if (!tempEditingRunes.value) {
    return true
  }

  return useValidatedRunes(tempEditingRunes.value).value
})

const isSpellsUnchanged = computed(() => {
  if (!selectedId.value) {
    return true
  }

  if (currentConfig.value === 'spells') {
    if (currentType.value === 'ranked') {
      return _.isEqual(
        tempEditingSpells.value,
        acs.settings.summonerSpells[selectedId.value]?.[
          `${currentType.value}-${currentPosition.value}`
        ] || null
      )
    } else {
      return _.isEqual(
        tempEditingSpells.value,
        acs.settings.summonerSpells[selectedId.value]?.[currentType.value] || null
      )
    }
  }

  return true
})

const mapAssets = useMapAssets()
const gameModeIconUri = computed(() => {
  if (!mapAssets.value) {
    return {}
  }

  const gameModeUri: Record<string, string> = {}
  const flattened = Object.values(mapAssets.value).flat()

  for (const item of flattened) {
    if (gameModeUri[item.gameMode]) {
      continue
    }

    gameModeUri[item.gameMode] = item.assets?.['game-select-icon-hover']
  }

  return gameModeUri
})

const typeToGameMode = (type: string) => {
  switch (type) {
    case 'ranked':
      return 'CLASSIC'
    case 'normal':
      return 'CLASSIC'
    case 'aram':
      return 'ARAM'
    case 'urf':
      return 'URF'
    case 'nexusblitz':
      return 'NEXUSBLITZ'
    case 'ultbook':
      return 'ULTBOOK'
  }

  return 'CLASSIC'
}

const configExistence = computed(() => {
  if (!selectedId.value) {
    return {
      runes: [],
      spells: []
    }
  }

  const runes = acs.settings.runesV2[selectedId.value]
  const spells = acs.settings.summonerSpells[selectedId.value]

  const runesKeys = runes
    ? Object.entries(runes)
        .filter((kv) => kv[1])
        .map((kv) => kv[0])
    : []
  const spellsKeys = spells
    ? Object.entries(spells)
        .filter((kv) => kv[1])
        .map((kv) => kv[0])
    : []

  return {
    runes: runesKeys,
    spells: spellsKeys
  }
})
</script>

<style lang="less" scoped>
.header {
  display: flex;
  align-items: center;
  gap: 8px;

  .header-icon {
    width: 20px;
    height: 20px;
  }
}

.tabs {
  height: 100%;
}

.content {
  display: flex;
  gap: 16px;
  height: 100%;

  .filter-area {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 200px;
    height: 100%;

    .champion-list {
      flex-grow: 1;
      height: 0;
    }
  }

  .divider {
    width: 1px;
    height: 100%;
    background-color: #fff1;
  }

  .config-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 540px;

    .tabs-sections {
      display: flex;
      gap: 8px;
    }

    .tabs-section {
      margin-bottom: 8px;

      .tab-title {
        font-size: 11px;
        color: #fff8;
        margin-bottom: 4px;
      }

      &:last-child {
        margin-bottom: 16px;
      }
    }

    .spells,
    .runes {
      flex: 1;
      padding: 16px;
      margin-bottom: 8px;
      background-color: #fff1;
      border-radius: 2px;
    }

    .runes,
    .spells {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .empty-placeholder {
      display: flex;
      flex-direction: column;
      gap: 8px;
      justify-content: center;
      align-items: center;
      height: 100%;
      color: #fff8;
    }
  }

  .config-area-empty-placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    min-width: 540px;
    color: #fff8;
  }
}

.champion-item {
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 8px;
  box-sizing: border-box;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
  margin-bottom: 2px;
  border-radius: 2px;
  color: #fff8;

  &:hover {
    background-color: #fff1;
  }

  &.selected {
    color: #ffff;
    background-color: #fff1;
  }

  .icon {
    width: 20px;
    height: 20px;
    background-color: #fff1;
    margin-right: 8px;
  }

  .champion-name {
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    margin-right: 8px;
  }

  .configure-status {
    font-size: 20px;

    &:not(:last-child) {
      margin-right: 4px;
    }

    &.configured {
      color: #63e2b7;
    }

    &.not-configured {
      color: #646464;
    }
  }
}

.radio-button-inner {
  position: relative;
  display: flex;
  align-items: center;
  font-size: 12px;
  gap: 4px;

  .mode-icon {
    width: 16px;
    height: 16px;
  }

  .check-icon {
    font-size: 14px;
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}
</style>

<style lang="less" module>
.champion-config-wrapper {
  height: 580px;
  width: fit-content;
  min-width: 940px;
}
</style>
