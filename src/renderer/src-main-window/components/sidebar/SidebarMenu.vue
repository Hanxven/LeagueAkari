<template>
  <div class="sidebar-menu">
    <NTooltip v-for="item of showItems" :key="item.key" placement="right">
      <template #trigger>
        <div
          class="menu-item"
          @click="handleMenuChange(item.key)"
          :class="{ active: currentActiveItem === item.key }"
        >
          <div class="menu-item-inner">
            <NBadge :show="!!item.inProgress" dot>
              <component :is="item.icon" class="menu-item-icon" />
            </NBadge>
          </div>
          <Transition name="menu-item-move-right-fade">
            <div class="menu-item-indicator" v-if="currentActiveItem === item.key"></div>
          </Transition>
        </div>
      </template>
      <span class="menu-item-popover">{{ item.name }}</span>
    </NTooltip>
  </div>
</template>

<script setup lang="ts">
import { NBadge, NTooltip } from 'naive-ui'
import { Component as ComponentC, computed, watchEffect } from 'vue'

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
</script>

<style lang="less" scoped>
.sidebar-menu {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.menu-item {
  position: relative;
  height: 52px;
  width: 52px;
  padding: 2px;
  box-sizing: border-box;
  cursor: pointer;

  .menu-item-inner {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    border-radius: 2px;
  }

  .menu-item-icon {
    font-size: 24px;
    transition: color 0.2s;
  }

  .menu-item-indicator {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    width: 5px;
    height: 64%;
    border-radius: 4px;
  }

  &.active {
    .menu-item-icon {
      color: #fff;
    }
  }
}

[data-theme='dark'] {
  .menu-item {
    &:hover {
      .menu-item-icon {
        color: #fff;
      }
    }

    .menu-item-icon {
      color: rgba(255, 255, 255, 0.45);
    }

    &.active {
      .menu-item-icon {
        color: #fff;
      }

      .menu-item-indicator {
        background-color: #60f44db9;
        box-shadow: 0 0 8px 0px #60f44db9;
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

    .menu-item-icon {
      color: rgba(0, 0, 0, 0.45);
    }

    &.active {
      .menu-item-icon {
        color: #000;
      }

      .menu-item-indicator {
        background-color: #1e6a14e0;
        box-shadow: 0 0 8px 0px #1e6a14e0;
      }
    }
  }
}

.menu-item-popover {
  font-weight: bold;
  font-size: 14px;
}

.menu-item-move-right-fade-enter-active,
.menu-item-move-right-fade-leave-active {
  transition:
    opacity 0.2s ease,
    left 0.2s cubic-bezier(0.19, 1, 0.22, 1);
}

.menu-item-move-right-fade-enter-from,
.menu-item-move-right-fade-leave-to {
  opacity: 0;
  left: -4px !important;
}

.menu-item-move-right-fade-enter-to,
.menu-item-move-right-fade-leave-from {
  opacity: 1;
  left: 0 !important;
}
</style>
