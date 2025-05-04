<template>
  <div
    class="sidebar-menu"
    :class="{ 'test-page': currentActiveItem === 'test' }"
    ref="sidebar-menu"
    :style="{
      '--indicator-top': `${indicatorPosition.top}px`,
      '--indicator-rail-height': `${indicatorPosition.height}px`
    }"
  >
    <NTooltip v-for="item of showItems" :key="item.key" placement="right">
      <template #trigger>
        <div
          class="menu-item"
          :data-key="item.key"
          @click="handleMenuChange(item.key)"
          :class="{ active: currentActiveItem === item.key }"
        >
          <div class="menu-item-inner">
            <NBadge :show="!!item.inProgress" dot>
              <component :is="item.icon" class="menu-item-icon" />
            </NBadge>
          </div>
        </div>
      </template>
      <span class="menu-item-popover">{{ item.name }}</span>
    </NTooltip>
    <div class="indicator-rail"></div>
  </div>
</template>

<script setup lang="ts">
import { NBadge, NTooltip } from 'naive-ui'
import {
  Component as ComponentC,
  computed,
  nextTick,
  ref,
  useTemplateRef,
  watch,
  watchEffect
} from 'vue'

const { defaultValue, items = [] } = defineProps<{
  defaultValue?: string
  items?: { key: string; icon: ComponentC; name: string; show?: boolean; inProgress?: boolean }[]
}>()

const showItems = computed(() => items.filter((item) => item.show !== false))
const currentActiveItem = defineModel<string>('current')

watchEffect(() => {
  currentActiveItem.value = defaultValue
})

const handleMenuChange = (key: string) => {
  currentActiveItem.value = key
}

const sidebarMenu = useTemplateRef('sidebar-menu')
const indicatorPosition = ref({
  top: 0,
  height: 0
})
const updateIndicatorPosition = () => {
  if (!sidebarMenu.value) {
    return
  }

  const activeItem = sidebarMenu.value.querySelector('.menu-item.active') as HTMLElement
  if (activeItem) {
    const { top: itemTop, height } = activeItem.getBoundingClientRect()
    const { top: sidebarTop } = sidebarMenu.value.getBoundingClientRect()

    const thatHeight = 0.4 * height
    indicatorPosition.value.top = itemTop - sidebarTop + (height - thatHeight) / 2
    indicatorPosition.value.height = thatHeight
  }
}

watch(
  () => currentActiveItem.value,
  () => {
    nextTick(() => updateIndicatorPosition())
  },
  { immediate: true }
)
</script>

<style lang="less" scoped>
.sidebar-menu {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;

  .indicator-rail {
    position: absolute;
    top: 0;
    left: 4px;
    width: 4px;
    height: 100%;
    pointer-events: none;

    &::before,
    &::after {
      content: '';
      position: absolute;
      width: 4px;
      height: var(--indicator-rail-height);
      top: var(--indicator-top);
      border-radius: 2px;

      // now for dark only
      background-color: #26dd0e;
    }

    &::before {
      transition:
        background-color 0.2s,
        top 0.2s cubic-bezier(0.65, 0, 0.35, 1),
        height 0.2s cubic-bezier(0.65, 0, 0.35, 1);
    }

    &::after {
      transition:
        background-color 0.2s,
        top 0.16s cubic-bezier(0.65, 0, 0.35, 1),
        height 0.16s cubic-bezier(0.65, 0, 0.35, 1);
    }
  }

  // dedicated for test page
  &.test-page .indicator-rail {
    &::before,
    &::after {
      background-color: #f94395;
    }
  }
}

.menu-item {
  position: relative;
  height: 52px;
  width: 52px;
  padding: 4px;
  box-sizing: border-box;
  cursor: pointer;

  .menu-item-inner {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    border-radius: 8px;
    transition: background-color 0.2s;
    overflow: hidden;
  }

  .menu-item-icon {
    font-size: 20px;
    transition: color 0.2s;
    left: 0px;
  }
}

[data-theme='dark'] {
  .menu-item {
    &:hover {
      .menu-item-icon {
        color: #fff;
      }

      .menu-item-inner {
        background-color: #fff1;
      }
    }

    &:active {
      .menu-item-icon {
        color: #fff8;
      }
    }

    .menu-item-icon {
      color: rgba(255, 255, 255, 0.45);
    }

    &.active {
      .menu-item-icon {
        color: #fff;
      }

      .menu-item-inner {
        background-color: #fff1;
      }
    }
  }
}

[data-theme='light'] {
  .menu-item {
    &:hover {
      .menu-item-icon {
        color: #000;
      }
    }

    &:active {
      .menu-item-icon {
        color: #0008;
      }
    }

    .menu-item-icon {
      color: rgba(0, 0, 0, 0.45);
    }

    &.active {
      .menu-item-icon {
        color: #000;
      }
    }
  }
}

.menu-item-popover {
  font-weight: bold;
  font-size: 14px;
}
</style>
