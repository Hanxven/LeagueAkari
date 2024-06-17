<template>
  <div class="ordered-champion-list-wrapper">
    <NPopover trigger="click" ref="popover" v-model:show="show">
      <template #trigger>
        <NButton size="tiny" type="primary" style="margin-right: 8px">编辑</NButton>
      </template>
      <div class="editor-wrapper">
        <div class="operations">
          <NSelect
            size="tiny"
            class="select"
            :options="championOptions"
            v-model:value="selectCurrent"
            placeholder="英雄"
            filterable
            ref="select"
            :filter="(a, b) => isChampionNameMatch(a, b.label as string)"
          ></NSelect>
          <NButton
            class="button"
            size="tiny"
            type="primary"
            title="添加英雄"
            @click="() => handleAdd()"
            :disabled="!addable"
            >+</NButton
          >
          <NButton
            size="tiny"
            class="button"
            type="error"
            title="移除英雄"
            @click="() => handleRemove()"
            :disabled="listCurrent === null"
            >-</NButton
          >
          <NButton
            size="tiny"
            class="button"
            title="排序上升"
            @click="() => handleMove('up')"
            :disabled="!movable.up"
            >↑</NButton
          >
          <NButton
            size="tiny"
            class="button"
            title="排序下降"
            @click="() => handleMove('down')"
            :disabled="!movable.down"
            >↓</NButton
          >
        </div>
        <div class="list-scroll-wrapper">
          <div class="list">
            <div
              class="list-item"
              v-for="(c, i) of props.value"
              :key="c"
              @click="handleSetCurrent(c)"
              :class="{
                'not-pickable':
                  gameflow.phase === 'ChampSelect' &&
                  (type === 'pick'
                    ? !champSelect.currentPickableChampions.has(c)
                    : !champSelect.currentBannableChampions.has(c)),
                current: listCurrent === c
              }"
              :title="gameData.champions[c]?.name"
            >
              <span class="order">#{{ i + 1 }}</span>
              <LcuImage class="list-item-image" :src="championIcon(c)" />
              <span>{{ gameData.champions[c]?.name }}</span>
            </div>
          </div>
          <div class="placeholder" v-if="arr.length === 0">未选择任何英雄</div>
        </div>
      </div>
    </NPopover>
    <div class="champions">
      <LcuImage
        :src="championIcon(c)"
        class="champion"
        :title="gameData.champions[c]?.name"
        :class="{
          'not-pickable':
            gameflow.phase === 'ChampSelect' &&
            (type === 'pick'
              ? !champSelect.currentPickableChampions.has(c)
              : !champSelect.currentBannableChampions.has(c))
        }"
        v-for="c of arr.slice(0, maxShow)"
        :key="c"
      />
      <div class="hint" v-if="arr.length > maxShow">+{{ arr.length - maxShow }}</div>
      <div class="hint" v-if="arr.length === 0">未选择</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import { championIcon } from '@shared/renderer/modules/game-data'
import { useChampSelectStore } from '@shared/renderer/modules/lcu-state-sync/champ-select'
import { useGameDataStore } from '@shared/renderer/modules/lcu-state-sync/game-data'
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync/gameflow'
import { isChampionNameMatch } from '@shared/utils/string-match'
import { NButton, NPopover, NSelect } from 'naive-ui'
import { computed, nextTick, ref, watch } from 'vue'

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

const select = ref()
const show = defineModel<boolean>({ default: false })

watch(
  () => show.value,
  (show) => {
    if (show) {
      nextTick(() => {
        select.value?.focusInput()
      })
    }
  }
)

const arr = defineModel<number[]>('value', { default: () => [] })

const gameData = useGameDataStore()
const popover = ref()

const champSelect = useChampSelectStore()
const gameflow = useGameflowStore()

const selectCurrent = ref<number | null>(null)
const listCurrent = ref<number | null>(null)

const selectedChampions = computed(() => {
  const set = new Set<number>()
  arr.value.forEach((value) => set.add(value))
  return set
})

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
      label: b.name,
      disabled: selectedChampions.value.has(b.id)
    }))
})

watch(
  () => arr.value,
  (list) => {
    if (listCurrent.value === null && list.length !== 0) {
      listCurrent.value = list[0]
    }
    nextTick(() => popover.value?.syncPosition())
  },
  { immediate: true }
)

const movable = computed(() => {
  if (listCurrent.value === null) {
    return {
      down: false,
      up: false
    }
  }

  const index = arr.value.indexOf(listCurrent.value)

  if (index === -1) {
    return {
      down: false,
      up: false
    }
  }

  return {
    down: index !== arr.value.length - 1,
    up: index !== 0
  }
})

const addable = computed(() => {
  return (
    selectCurrent.value !== null &&
    !arr.value.includes(selectCurrent.value) &&
    arr.value.length < props.maxCount
  )
})

const handleSetCurrent = (id: number) => {
  listCurrent.value = id
}

const handleMove = (direction: 'up' | 'down') => {
  if (listCurrent.value === null) {
    return
  }

  const index = arr.value.indexOf(listCurrent.value)
  if (index === -1) {
    return
  }

  const newArr = [...arr.value]
  if (direction === 'up') {
    if (index === 0) {
      return
    }

    ;[newArr[index], newArr[index - 1]] = [newArr[index - 1], newArr[index]]
  } else if (direction === 'down') {
    if (index === arr.value.length - 1) {
      return
    }

    ;[newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]]
  }

  arr.value = newArr
}

const handleAdd = () => {
  if (selectCurrent.value === null || arr.value.includes(selectCurrent.value)) {
    return
  }

  arr.value = [selectCurrent.value, ...arr.value]
}

const handleRemove = () => {
  if (listCurrent.value === null) {
    return
  }

  const index = arr.value.indexOf(listCurrent.value)
  const isLastElement = index === arr.value.length - 1
  const newValue = arr.value.filter((c) => c !== listCurrent.value)

  arr.value = newValue

  if (newValue.length > 0) {
    if (isLastElement) {
      listCurrent.value = newValue[index - 1]
    } else {
      listCurrent.value = newValue[index]
    }
  } else {
    listCurrent.value = null
  }
}
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
    background-color: black;
  }

  .hint {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }
}

// .editor-wrapper {
// }

.operations {
  display: flex;
  margin-bottom: 4px;
  gap: 4px;

  .add {
    margin-right: auto;
  }

  .button {
    width: 22px;
  }

  .select {
    width: 140px;
  }
}

.list-scroll-wrapper {
  height: 160px;
  border: 1px solid rgb(112, 112, 112);
  border-radius: 4px;
  overflow: auto;

  .placeholder {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
    margin-top: 66px;
  }
}

.list {
  .list-item {
    display: flex;
    align-items: center;
    height: 28px;
    font-size: 12px;
    transition: background-color 0.2s ease;
    cursor: pointer;
    padding: 2px 4px;
    box-sizing: border-box;

    .list-item-image {
      margin-left: 4px;
      margin-right: 4px;
      width: 20px;
      height: 20px;
      border-radius: 4px;
    }

    .order {
      color: rgb(159, 159, 159);
    }

    &:not(:last-child) {
      margin-bottom: 2px;
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  .list-item.current {
    background-color: rgba(255, 255, 255, 0.15);
  }
}

.not-pickable {
  filter: brightness(0.5);
}
</style>
@shared/renderer/modules/lcu-state-sync/champ-select@shared/renderer/modules/lcu-state-sync/game-data@shared/renderer/modules/lcu-state-sync/gameflow