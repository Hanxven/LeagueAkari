<template>
  <div class="panel">
    <div class="sider">
      <NMenu
        :collapsed="false"
        :options="options"
        :value="currentMenu"
        @update:value="handleMenuChange"
      ></NMenu>
      <div class="bottom-operations">
        <NPopover
          trigger="click"
          placement="right"
          v-model:show="isClientsPreviewShow"
          scrollable
          :disabled="lc.state !== 'connected' && lc.launchedClients.length === 0"
          style="max-height: 240px"
        >
          <template #trigger>
            <div
              :title="
                lc.launchedClients.length === 0 && lc.state === 'disconnected'
                  ? '没有检测到已运行的客户端'
                  : '当前正在运行的英雄联盟客户端'
              "
              class="operation"
              :class="{ disabled: lc.state !== 'connected' && lc.launchedClients.length === 0 }"
            >
              <NIcon class="icon"><ApplicationIcon /></NIcon>
              <div class="label" v-if="lc.auth">
                {{ regionText[lc.auth.region] || lc.auth.region }}
              </div>
              <div class="label" v-else>客户端</div>
            </div>
          </template>
          <div
            v-for="c of clientsToConnect"
            :key="c.pid"
            class="client"
            :class="{ connected: c.connected }"
            :style="{
              cursor: c.disabled ? 'not-allowed' : 'cursor'
            }"
            @click="() => handleConnectToLcu(c)"
          >
            <span class="region" title="地区"
              ><NSpin v-if="c.loading" :size="12" class="left-widget" /><NIcon
                v-else
                class="left-widget"
                style="vertical-align: text-bottom"
                ><CubeSharpIcon
              /></NIcon>
              {{ regionText[c.region] || c.region }}</span
            >
            <span class="rso" title="区服">{{
              rsoPlatformText[c.rsoPlatformId] || c.rsoPlatformId
            }}</span>
            <span class="pid" title="Process ID">{{ c.pid }}</span>
            <span class="connected-label" v-if="c.connected">已连接</span>
          </div>
        </NPopover>
        <div class="operation" title="设置" @click="handleOpenSettingsModal">
          <NIcon class="icon"><SettingsIcon /></NIcon>
          <span class="label">设置</span>
        </div>
      </div>
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
import { lcuConnectionRendererModule as lcm } from '@shared/renderer/modules/lcu-connection'
import { LcuAuth, useLcuConnectionStore } from '@shared/renderer/modules/lcu-connection/store'
import { leagueClientRendererModule as lcm2 } from '@shared/renderer/modules/league-client'
import { regionText, rsoPlatformText } from '@shared/utils/rso-platforms'
import {
  AiStatus as AiStatusIcon,
  AppSwitcher as AppSwitcherIcon,
  Layers as LayersIcon,
  Template as TemplateIcon
} from '@vicons/carbon'
import { Application as ApplicationIcon, Settings as SettingsIcon } from '@vicons/carbon'
import { CubeSharp as CubeSharpIcon } from '@vicons/ionicons5'
import { useIntervalFn } from '@vueuse/core'
import { MenuOption, NIcon, NMenu, NPopover, NSpin } from 'naive-ui'
import {
  Component as ComponentC,
  computed,
  h,
  inject,
  ref,
  shallowRef,
  watch,
  watchEffect
} from 'vue'
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
    label: '自动化',
    key: 'automation',
    icon: renderIcon(AiStatusIcon)
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
  } catch (error) {
    console.error('routing', error)
  }
}

const appInject = inject('app') as any

const handleOpenSettingsModal = () => {
  appInject.openSettingsModal()
}

const lc = useLcuConnectionStore()
const isClientsPreviewShow = ref(false)
const launchedClients = shallowRef<LcuAuth[]>([])
const updateCurrentLaunchedClients = async () => {
  launchedClients.value = await lcm2.getLaunchedClients()
}

const clientsToConnect = computed(() => {
  if (lc.state === 'connected') {
    const c = launchedClients.value.map((m) => {
      return {
        ...m,
        connected: lc.auth?.pid === m.pid,
        disabled: lc.auth?.pid === m.pid,
        loading: lc.connectingClient?.pid === m.pid
      }
    })

    if (c.length === 0) {
      c.push({
        ...lc.auth!,
        loading: false,
        connected: true,
        disabled: true
      })
    }

    return c
  } else {
    return lc.launchedClients.map((m) => {
      return {
        ...m,
        connected: lc.auth?.pid === m.pid,
        disabled: lc.connectingClient?.pid === m.pid,
        loading: lc.connectingClient?.pid === m.pid
      }
    })
  }
})

const { pause, resume } = useIntervalFn(updateCurrentLaunchedClients, 1000, {
  immediate: false,
  immediateCallback: true
})

watch(
  () => isClientsPreviewShow.value,
  (show) => {
    if (show) {
      resume()
    } else {
      pause()
    }
  }
)

// 善意的提醒，以防用户一直在等
watchEffect(() => {
  if (lc.state === 'disconnected' && lc.launchedClients.length > 1) {
    isClientsPreviewShow.value = true
  }
})

const handleConnectToLcu = (auth: LcuAuth) => {
  if (lc.state === 'connected' && lc.auth?.pid === auth.pid) {
    return
  }

  lcm.lcuConnect(auth)
}

const emits = defineEmits<{
  (e: 'openSettings'): void
}>()
</script>

<style lang="less" scoped>
.panel {
  display: flex;
  width: 100%;
  height: 100%;

  .sider {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
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

    .bottom-operations {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px;

      .operation {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 4px 8px;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.3s ease;

        &:hover:not(.disabled) {
          background-color: rgb(67, 67, 67);
        }

        &:active:not(.disabled) {
          background-color: rgb(55, 55, 55);
        }
      }

      .disabled {
        cursor: not-allowed;
        color: #5d5c5c;
      }

      .icon {
        font-size: 16px;
      }

      .label {
        width: 36px;
        font-size: 12px;
        text-align: left;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
    }
  }

  .right-side-content {
    flex: 1;
    width: 0;
  }
}

.client {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 24px;
  transition: 0.3s all ease;
  cursor: pointer;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.03);
  width: 160px;

  &:hover:not(.connected) {
    background-color: rgba(255, 255, 255, 0.15);
  }

  &:active:not(.connected) {
    background-color: rgba(255, 255, 255, 0.2);
  }

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  .region {
    font-size: 14px;
    color: #fff;
  }

  .rso {
    font-size: 14px;
    font-weight: 700;
    margin-left: 8px;
  }

  .pid {
    position: absolute;
    bottom: 0px;
    right: 6px;
    font-size: 12px;
    color: #6a6a6ae3;
    margin-left: 8px;
  }

  .connected-label {
    position: absolute;
    top: 0px;
    right: 6px;
    font-size: 12px;
    color: #8aa08ee7;
    margin-left: 8px;
  }

  .left-widget {
    margin-right: 6px;
    font-size: 16px;
  }

  &.connected {
    :is(.rso, .region) {
      color: #696969;
    }
  }
}
</style>
