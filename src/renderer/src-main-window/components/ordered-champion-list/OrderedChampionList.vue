<template>
  <div class="ordered-champion-list-wrapper">
    <NModal v-model:show="show">
      <NTransfer
        class="transfer"
        size="small"
        v-model:value="champions"
        virtual-scroll
        :options="championOptions"
        :render-source-label="renderSourceLabel"
        :render-target-label="renderTargetLabel"
        :source-filter-placeholder="t('OrderedChampionList.searchForChampion')"
        :filter="(a, b) => filterChampions(a, b as any)"
        :source-title="renderPositionFilter"
        source-filterable
      />
    </NModal>
    <NButton size="tiny" type="primary" style="margin-right: 8px" @click="show = true">{{
      t('OrderedChampionList.edit')
    }}</NButton>
    <div class="champions">
      <LcuImage
        :src="championIconUri(c)"
        class="champion"
        :title="lcs.gameData.champions[c]?.name"
        :class="{
          [styles['not-pickable']]:
            lcs.gameflow.phase === 'ChampSelect' &&
            (type === 'pick'
              ? !lcs.champSelect.currentPickableChampionIds.has(c)
              : !lcs.champSelect.currentBannableChampionIds.has(c))
        }"
        v-for="c of champions.slice(0, maxShow)"
        :key="c"
      />
      <div class="hint" v-if="champions.length > maxShow">+{{ champions.length - maxShow }}</div>
      <div class="hint" v-if="champions.length === 0">
        {{ t('OrderedChampionList.unselected') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { maybePveChampion } from '@shared/types/league-client/game-data'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NModal,
  NTransfer,
  TransferRenderSourceLabel,
  TransferRenderTargetLabel
} from 'naive-ui'
import { computed, h, ref, useCssModule, watch } from 'vue'

import { useChampionNameMatch } from '@main-window/compositions/useChampionNameMatch'
import { useRecommendedChampionPositions } from '@main-window/compositions/useRecommendedChampionPositions'

import PositionFilter from './PositionFilter.vue'

const { t } = useTranslation()

const {
  maxShow = 6,
  allowEmpty = false,
  type = 'pick'
} = defineProps<{
  maxShow?: number
  maxCount?: number
  type?: 'pick' | 'ban'
  allowEmpty?: boolean
}>()

const show = defineModel<boolean>('show', { default: false })
const champions = defineModel<number[]>('champions', { default: () => [] })

const styles = useCssModule()

const lcs = useLeagueClientStore()

const championOptions = computed(() => {
  const sorted = Object.values(lcs.gameData.champions).toSorted((a, b) => {
    // 以防有人看不到, 决定将空英雄放在最前面
    if (a.id === -1 || b.id === -1) {
      return -1
    }

    // 只要是 PVE 英雄，直接放在最后面以防止失误选择
    if (maybePveChampion(a.id) || maybePveChampion(b.id)) {
      return 1
    }

    return a.name.localeCompare(b.name, 'zh-Hans-CN')
  })

  return sorted
    .filter((b) => {
      // 这个值只会在进入英雄选择阶段才会更新
      if (lcs.champSelect.disabledChampionIds.has(b.id)) {
        return false
      }

      if (allowEmpty) {
        return b.id !== 0
      }

      return b.id !== 0 && b.id !== -1
    })
    .map((b) => ({
      value: b.id,
      label: maybePveChampion(b.id) ? `${b.name} (PVE)` : b.name
    }))
})

const { match: isNameMatch } = useChampionNameMatch()

const renderSourceLabel: TransferRenderSourceLabel = ({ option }) => {
  let pickable = true
  if (lcs.gameflow.phase === 'ChampSelect') {
    if (type === 'pick') {
      pickable = lcs.champSelect.currentPickableChampionIds.has(option.value as number)
    } else {
      pickable = lcs.champSelect.currentBannableChampionIds.has(option.value as number)
    }
  }

  return h(
    'div',
    {
      style: { display: 'flex', 'align-items': 'center', gap: '4px' },
      class: {
        [styles['not-pickable']]: !pickable
      }
    },
    [
      h(LcuImage, {
        src: championIconUri(option.value as number),
        style: { width: '18px', height: '18px' }
      }),
      h('span', { style: { 'margin-left': '4px', 'font-size': '13px' } }, option.label)
    ]
  )
}

const renderTargetLabel: TransferRenderTargetLabel = ({ option }) => {
  let pickable = true
  if (lcs.gameflow.phase === 'ChampSelect') {
    if (type === 'pick') {
      pickable = lcs.champSelect.currentPickableChampionIds.has(option.value as number)
    } else {
      pickable = lcs.champSelect.currentBannableChampionIds.has(option.value as number)
    }
  }

  return h(
    'div',
    {
      style: { display: 'flex', 'align-items': 'center', gap: '4px' },
      class: {
        [styles['target-item']]: true,
        [styles['not-pickable']]: !pickable
      },
      draggable: true,
      onDragover: (e) => e.preventDefault(),
      onDragstart: () => handleDragStart(option.value as number),
      onDragenter: () => handleDragEnter(option.value as number),
      onDragleave: () => handleDragLeaveOrEnd(option.value as number),
      onDragend: () => handleDragLeaveOrEnd(option.value as number),
      onDrop: () => handleDrop(option.value as number)
    },
    [
      h(LcuImage, {
        src: championIconUri(option.value as number),
        style: { width: '18px', height: '18px' }
      }),
      h('span', { style: { 'margin-left': '4px', 'font-size': '13px' } }, option.label),
      h(
        NButton,
        {
          size: 'tiny',
          quaternary: true,
          style: { 'margin-left': 'auto' },
          focusable: false,
          class: styles['move-btn'],
          onClick: () => moveUp(option.value as number),
          disabled: champions.value.indexOf(option.value as number) === 0
        },
        () => '↑上移'
      ),
      h(
        NButton,
        {
          size: 'tiny',
          quaternary: true,
          style: { 'margin-left': '2px', 'margin-right': '2px' },
          focusable: false,
          class: styles['move-btn'],
          onClick: () => moveDown(option.value as number),
          disabled: champions.value.indexOf(option.value as number) === champions.value.length - 1
        },
        () => '↓下移'
      )
    ]
  )
}

const moveUp = (value: number) => {
  const index = champions.value.indexOf(value)
  if (index === 0) {
    return
  }

  const newValue = [...champions.value]
  newValue.splice(index, 1)
  newValue.splice(index - 1, 0, value)
  champions.value = newValue
}

const moveDown = (value: number) => {
  const index = champions.value.indexOf(value)
  if (index === champions.value.length - 1) {
    return
  }

  const newValue = [...champions.value]
  newValue.splice(index, 1)
  newValue.splice(index + 1, 0, value)
  champions.value = newValue
}

const dragging = ref<number | null>(null)
const hovering = ref<number | null>(null)

const handleDragStart = (id: number) => {
  dragging.value = id
}

const handleDragEnter = (id: number) => {
  hovering.value = id
}

const handleDragLeaveOrEnd = (_id: number) => {
  hovering.value = null
}

const handleDrop = (id: number) => {
  if (id === dragging.value) {
    return
  }

  const index = champions.value.indexOf(dragging.value as number)
  const newValue = [...champions.value]
  newValue.splice(index, 1)
  newValue.splice(champions.value.indexOf(id), 0, dragging.value as number)
  champions.value = newValue

  dragging.value = null
}

const renderPositionFilter = () => {
  return h(PositionFilter, {
    position: selectedPosition.value,
    'onUpdate:position': (value: string | null) => {
      selectedPosition.value = value
    }
  })
}

const selectedPosition = ref<string | null>(null)
const { positionMap } = useRecommendedChampionPositions()

const filterChampions = (a: string, b: { label: string; value: number }) => {
  if (positionMap.value && selectedPosition.value) {
    const position = positionMap.value[selectedPosition.value]
    if (position && !position.has(b.value)) {
      return false
    }
  }

  return isNameMatch(a, b.label, b.value)
}

watch(
  () => show.value,
  (show) => {
    if (show) {
      selectedPosition.value = null
    }
  }
)
</script>

<style lang="less" scoped>
.ordered-champion-list-wrapper {
  display: flex;
  align-items: center;
}

.champions {
  display: flex;
  gap: 4px;
  align-items: center;

  .champion {
    width: 24px;
    height: 24px;
    border-radius: 4px;
  }

  .hint {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }
}

.transfer {
  width: 600px;
  height: 65vh;
  background-color: rgba(24, 24, 24, 0.98);
}
</style>

<style lang="less" module>
.target-item .move-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

:global(.n-transfer-list-item--target:hover) {
  .move-btn {
    opacity: 1;
  }
}

.not-pickable {
  filter: brightness(0.5);
}
</style>
