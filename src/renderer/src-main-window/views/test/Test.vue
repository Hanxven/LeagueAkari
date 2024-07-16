<template>
  <NTransfer
    style="width: 600px"
    size="small"
    v-model:value="champions"
    virtual-scroll
    :options="championOptions"
    :render-source-label="renderSourceLabel"
    :render-target-label="renderTargetLabel"
    source-filter-placeholder="搜索英雄"
    :filter="
      (a, b) =>
        isChampionNameMatch(a, b.label as string) || Boolean(b.value?.toString().includes(a))
    "
    source-filterable
  />
</template>

<script lang="ts" setup>
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import { championIcon } from '@shared/renderer/modules/game-data'
import { useChampSelectStore } from '@shared/renderer/modules/lcu-state-sync/champ-select'
import { useGameDataStore } from '@shared/renderer/modules/lcu-state-sync/game-data'
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync/gameflow'
import { isChampionNameMatch } from '@shared/utils/string-match'
import { NButton, NTransfer, TransferRenderSourceLabel, TransferRenderTargetLabel } from 'naive-ui'
import { computed, h, ref, useCssModule } from 'vue'

const props = withDefaults(
  defineProps<{
    value?: number[]
    maxShow?: number
    maxCount?: number
    type?: 'pick' | 'ban'
    allowEmpty?: boolean
  }>(),
  {
    maxShow: 6,
    maxCount: Infinity,
    allowEmpty: false,
    type: 'pick'
  }
)

const styles = useCssModule()

const gameData = useGameDataStore()
const gameflow = useGameflowStore()
const champSelect = useChampSelectStore()
const champions = ref<number[]>([])

const championOptions = computed(() => {
  const sorted = Object.values(gameData.champions).sort((a, b) =>
    a.name.localeCompare(b.name, 'zh-Hans-CN')
  )

  return sorted
    .filter((b) => {
      if (props.allowEmpty) {
        return b.id !== 0
      }

      return b.id !== 0 && b.id !== -1
    })
    .map((b) => ({
      value: b.id,
      label: b.name
    }))
})

const renderSourceLabel: TransferRenderSourceLabel = ({ option }) => {
  let pickable = true
  if (gameflow.phase === 'ChampSelect') {
    if (props.type === 'pick') {
      pickable = champSelect.currentPickableChampions.has(option.value as number)
    } else {
      pickable = champSelect.currentBannableChampions.has(option.value as number)
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
        src: championIcon(option.value as number),
        style: { width: '18px', height: '18px' }
      }),
      h('span', { style: { marginLeft: '4px' } }, option.label)
    ]
  )
}

const renderTargetLabel: TransferRenderTargetLabel = ({ option }) => {
  let pickable = true
  if (gameflow.phase === 'ChampSelect') {
    if (props.type === 'pick') {
      pickable = champSelect.currentPickableChampions.has(option.value as number)
    } else {
      pickable = champSelect.currentBannableChampions.has(option.value as number)
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
        src: championIcon(option.value as number),
        style: { width: '18px', height: '18px' }
      }),
      h('span', { style: { marginLeft: '4px' } }, option.label),
      h(
        NButton,
        {
          size: 'tiny',
          quaternary: true,
          style: { 'margin-left': 'auto' },
          focusable: false,
          class: styles['move-btn'],
          onClick: () => moveUp(option.value as number)
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

  // 插入到目标的前面
  const index = champions.value.indexOf(dragging.value as number)
  const newValue = [...champions.value]
  newValue.splice(index, 1)
  newValue.splice(champions.value.indexOf(id), 0, dragging.value as number)
  champions.value = newValue

  dragging.value = null
}
</script>

<style lang="less" scoped></style>

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
