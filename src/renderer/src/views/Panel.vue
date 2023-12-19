<template>
  <div class="panel">
    <div class="sider">
      <NMenu
        :collapsed="false"
        :options="options"
        :value="currentMenu"
        @update:value="handleMenuChange"
      ></NMenu>
    </div>
    <div class="right-side-content">
      <RouterView v-slot="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AppSwitcher as AppSwitcherIcon,
  Layers as LayersIcon,
  Template as TemplateIcon
} from '@vicons/carbon'
import { MenuOption, NIcon, NMenu } from 'naive-ui'
import { Component as ComponentC, h, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const renderIcon = (icon: ComponentC) => {
  return () => h(NIcon, null, () => h(icon))
}

const options = ref<MenuOption[]>([
  {
    label: '战绩',
    key: 'match-history',
    icon: renderIcon(LayersIcon)
  },
  {
    label: '对局',
    key: 'ongoing-game',
    icon: renderIcon(TemplateIcon)
  },
  {
    label: '工具',
    key: 'toolkit',
    icon: renderIcon(AppSwitcherIcon)
  }
])

const router = useRouter()
const route = useRoute()

const currentMenu = ref('match-history')

watchEffect(() => {
  currentMenu.value = route.name as string
})

const handleMenuChange = async (val: string) => {
  try {
    await router.replace({ name: val })
  } catch (err) {
    console.error('routing', err)
  }
}
</script>

<style lang="less" scoped>
.panel {
  display: flex;
  width: 100%;
  height: 100%;

  .sider {
    flex-shrink: 0;
    box-sizing: border-box;
    border-right: 1px solid rgb(43, 43, 43);

    :deep(.n-menu-item) {
      --n-item-height: 32px;
      font-size: 12px;

      .n-menu-item-content__icon .n-icon {
        font-size: 16px;
      }

      .n-menu-item-content {
        padding-left: 12px !important;
      }
    }
  }

  .right-side-content {
    flex: 1;
    width: 0;
  }
}
</style>
