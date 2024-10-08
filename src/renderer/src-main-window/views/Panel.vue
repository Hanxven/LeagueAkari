<template>
  <div class="panel">
    <div class="sider">
      <NMenu
        :root-indent="12"
        :collapsed="false"
        :icon-size="18"
        default-expand-all
        :options="options"
        :value="currentMenu"
        @update:value="handleMenuChange"
      ></NMenu>
      <div class="bottom-operations">
        <div class="operation" title="公告" @click="handleOpenAnnouncementModal">
          <NIcon class="icon"><NotificationIcon /></NIcon>
          <span class="label">公告</span>
        </div>
        <NPopover
          trigger="click"
          placement="right"
          v-model:show="isClientsPreviewShow"
          scrollable
          :disabled="lc.state !== 'connected' && lc.launchedClients.length === 0"
          style="max-height: 240px"
          :delay="50"
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
                {{ REGION_NAME[lc.auth.region] || lc.auth.region }}
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
              {{ REGION_NAME[c.region] || c.region }}</span
            >
            <span class="rso" title="区服">{{
              TENCENT_RSO_PLATFORM_NAME[c.rsoPlatformId] || c.rsoPlatformId
            }}</span>
            <span class="pid" title="Process ID">{{ c.pid }}</span>
            <span class="connected-indicator" v-if="c.connected"></span>
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
import { lcuConnectionRendererModule as lcm } from '@renderer-shared/modules/lcu-connection'
import { UxCommandLine, useLcuConnectionStore } from '@renderer-shared/modules/lcu-connection/store'
import { leagueClientRendererModule as lcm2 } from '@renderer-shared/modules/league-client'
import { REGION_NAME, TENCENT_RSO_PLATFORM_NAME } from '@shared/utils/platform-names'
import {
  AiStatus as AiStatusIcon,
  AppSwitcher as AppSwitcherIcon,
  Application as ApplicationIcon,
  Layers as LayersIcon,
  Notification as NotificationIcon,
  Settings as SettingsIcon,
  Template as TemplateIcon
} from '@vicons/carbon'
import { CubeSharp as CubeSharpIcon, TicketSharp as TicketSharpIcon } from '@vicons/ionicons5'
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
    icon: renderIcon(AiStatusIcon),
    children: [
      {
        label: '自动流程',
        key: 'automation-auto-gameflow'
      },
      {
        label: '选择禁用',
        key: 'automation-auto-select'
      },
      {
        label: '其他',
        key: 'automation-misc'
      }
    ]
  },
  {
    label: '工具',
    key: 'toolkit',
    icon: renderIcon(AppSwitcherIcon),
    children: [
      {
        label: '过程中',
        key: 'toolkit-in-process'
      },
      {
        label: '房间',
        key: 'toolkit-lobby'
      },
      {
        label: '客户端',
        key: 'toolkit-client'
      },
      {
        label: '其他',
        key: 'toolkit-misc'
      }
    ]
  },
  {
    label: '测试',
    key: 'test',
    icon: renderIcon(TicketSharpIcon),
    show: import.meta.env.DEV
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

const handleOpenAnnouncementModal = () => {
  appInject.openAnnouncementModal()
}

const lc = useLcuConnectionStore()
const isClientsPreviewShow = ref(false)
const launchedClients = shallowRef<UxCommandLine[]>([])
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

const handleConnectToLcu = (auth: UxCommandLine) => {
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
    width: 124px;
    flex-direction: column;
    justify-content: space-between;
    flex-shrink: 0;
    box-sizing: border-box;

    :deep(.n-menu-item) {
      --n-item-height: 32px;
      font-size: 12px;

      .n-menu-item-content__icon .n-icon {
        font-size: 16px;
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
        justify-content: center;
        gap: 12px;
        padding: 4px 8px;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.3s ease;

        &:hover:not(.disabled) {
          background-color: rgba(255, 255, 255, 0.12);
        }

        &:active:not(.disabled) {
          background-color: rgba(255, 255, 255, 0.05);
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
  overflow: hidden;

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
    font-weight: bold;
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

  .connected-indicator {
    display: block;
    position: absolute;
    width: 4px;
    height: 100%;
    background-color: #8ede7c;
    left: 0px;
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
