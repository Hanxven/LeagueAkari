<template>
  <div class="menu-list">
    <div v-if="$slots.header" class="menu-list-header">
      <slot name="header"></slot>
    </div>
    <div class="menu-body" ref="menu-body">
      <div
        v-for="item in list"
        :key="item.id"
        class="menu-list-item"
        :data-id="item.id"
        :class="{ active: current === item.id, transiting: isTransitioning }"
        @click="handleChange(item.id)"
      >
        <div class="menu-list-item-icon" v-if="item.icon">
          <component :is="item.icon" />
        </div>
        <div class="menu-list-item-icon-gm" v-else></div>
        <div class="menu-list-item-label">
          <component :is="renderText(item.label || '')" />
        </div>
      </div>
      <div
        class="menu-list-item-indicator"
        @transitionstart="isTransitioning = true"
        @transitionend="isTransitioning = false"
        :style="{
          top: indicatorPosition.top + 'px',
          height: indicatorPosition.height + 'px'
        }"
      />
    </div>
    <div v-if="$slots.footer">
      <slot name="footer" class="menu-list-footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VNodeChild, h, nextTick, onMounted, ref, useTemplateRef } from 'vue'

import { MenuListItem } from './types'

const { list = [] } = defineProps<{
  list?: MenuListItem[]
}>()

const menuBody = useTemplateRef('menu-body')
const current = defineModel<string | number | undefined>('current', { default: undefined })
const isTransitioning = ref(false)

const indicatorPosition = ref({
  top: 0,
  height: 0
})

const updateIndicatorPosition = () => {
  if (menuBody.value) {
    const item = menuBody.value.querySelector(`.menu-list-item[data-id="${current.value}"]`)
    if (item) {
      const { top, height } = item.getBoundingClientRect()
      indicatorPosition.value = {
        top: top - menuBody.value.getBoundingClientRect().top,
        height: height
      }
    }
  } else {
    indicatorPosition.value = {
      top: 0,
      height: 0
    }
  }
}

const renderText = (node: string | (() => VNodeChild)) => {
  if (typeof node === 'string') {
    return h('span', node)
  }

  return { render: node }
}

const handleChange = (id: string | number) => {
  current.value = id
  nextTick(updateIndicatorPosition)
}

onMounted(() => {
  nextTick(updateIndicatorPosition)
})
</script>

<style lang="less" scoped>
.menu-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px;

  .menu-body {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}

.menu-list-item {
  display: flex;
  align-items: center;
  height: 36px;
  border-radius: 4px;
  padding: 0 16px;
  box-sizing: border-box;
  transition:
    background-color 0.2s,
    color 0.2s;
  color: #fffa;

  &:not(.active) {
    cursor: pointer;
  }

  &.active {
    color: #fff;
  }

  &:hover:not(.active) {
    background-color: #fff1;
  }

  &:hover:not(.active) {
    color: #fff;
  }

  .menu-list-item-label {
    margin-left: 8px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
}

.menu-list-item-indicator {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  border-radius: 4px;
  background-color: #fff2;
  z-index: -1;
  transition:
    top 0.2s cubic-bezier(0, 1, 0.1, 0.96),
    height 0.2s;
}

.menu-list-item-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;

  :deep(.n-icon) {
    display: block;
  }
}

.menu-list-item-icon-gm {
  width: 18px;
  height: 18px;
}

.menu-list-header {
  margin-bottom: 8px;
}
</style>
