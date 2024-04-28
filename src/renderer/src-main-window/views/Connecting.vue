<template>
  <div class="waiting-screen">
    <div class="border"></div>
    <div class="inner-content">
      <LeagueAkariSpan class="akari-text" bold />
      <template
        v-if="app.lcuConnectionState === 'disconnected' || app.lcuConnectionState === 'connecting'"
      >
        <div v-if="existingClients.length" class="text-line-1">
          <template v-if="existingClients.length">
            <div class="servers-available">已启动的客户端</div>
            <NScrollbar style="max-height: 45vh" trigger="none">
              <div
                v-for="a of existingClients"
                :key="a.pid"
                class="client"
                :style="{
                  cursor:
                    currentConnectingClientPid && currentConnectingClientPid !== a.pid
                      ? 'not-allowed'
                      : 'cursor'
                }"
                @click="() => handleConnect(a)"
              >
                <span class="region" title="地区"
                  ><NSpin
                    v-if="currentConnectingClientPid === a.pid"
                    :size="12"
                    class="left-widget"
                  /><NIcon v-else class="left-widget" style="vertical-align: text-bottom"
                    ><CubeSharp
                  /></NIcon>
                  {{ regionText[a.region] || a.region }}</span
                >
                <span class="rso" title="区服">{{
                  rsoPlatformText[a.rsoPlatformId] || a.rsoPlatformId
                }}</span>
                <span class="pid" title="Process ID">{{ a.pid }}</span>
              </div>
            </NScrollbar>
          </template>
        </div>
        <div v-else class="text-line-1">等待游戏客户端启动</div>
        <div v-if="isErr" class="error-hint">无法获取连接信息。请检查游戏客户端是否已经开启</div>
      </template>
      <div v-else class="connected-text">已连接，加载中</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LeagueAkariSpan from '@shared/renderer/components/LeagueAkariSpan.vue'
import { useAppStore } from '@shared/renderer/features/app/store'
import { laNotification } from '@shared/renderer/notification'
import { mainCall } from '@shared/renderer/utils/ipc'
import { regionText, rsoPlatformText } from '@shared/utils/rso-platforms'
import { sleep } from '@shared/utils/sleep'
import { CubeSharp } from '@vicons/ionicons5'
import { useTimeoutPoll } from '@vueuse/core'
import { NIcon, NScrollbar, NSpin, useNotification } from 'naive-ui'
import { ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'

const existingClients = shallowRef<any[]>([])
const isErr = ref(false)

const router = useRouter()
const notification = useNotification()

const NOTIFY_THRESHOLD = 10

const attempts = ref(0)
const currentConnectingClientPid = ref<number | null>(null)

const tryConnect = async (maxAttempts = 3, auth: any) => {
  if (currentConnectingClientPid.value) {
    return
  }

  attempts.value = 0

  currentConnectingClientPid.value = auth.pid
  while (attempts.value < maxAttempts) {
    if (existingClients.value.findIndex((v) => v.pid === currentConnectingClientPid.value) === -1) {
      currentConnectingClientPid.value = null
      break
    }

    try {
      await mainCall('lcu-connection/connect', auth) // 尝试连接
      isErr.value = false
      currentConnectingClientPid.value = null
      return
    } catch (error) {
      if (!app.isAdministrator || attempts.value > NOTIFY_THRESHOLD) {
        notification.warning({
          duration: 5000,
          content: (error as any).message ? (error as any).message : '发生错误'
        })
      }

      attempts.value++ // 增加尝试次数
      console.warn(`连接失败，正在尝试第 ${attempts.value} 次重连：`, error)
      if (attempts.value >= maxAttempts) {
        isErr.value = true
        currentConnectingClientPid.value = null
        break
      }
      await sleep(2000)
    }
  }
}

const app = useAppStore()

watch(
  () => app.lcuConnectionState,
  (s) => {
    if (s === 'connected') {
      router.replace(`/match-history`)
    }
  },
  { immediate: true }
)

// 重复等待客户端启动
useTimeoutPoll(
  async () => {
    try {
      existingClients.value = await mainCall('league-client-ux/lcu-auth/query')
    } catch (error) {
      laNotification.warn(
        '进程轮询',
        `尝试检查进程存在时发生错误：${(error as any)?.message}`,
        error
      )
    }
  },
  1000,
  { immediate: true }
)

watch(
  () => existingClients.value,
  (a) => {
    if (a) {
      if (!existingClients.value.length) {
        return
      }

      if (existingClients.value.length === 1 && app.settings.autoConnect) {
        tryConnect(Infinity, existingClients.value[0])
      }
    }
  }
)

const handleConnect = (auth: any) => {
  tryConnect(Infinity, auth)
}
</script>

<style scoped lang="less">
.waiting-screen {
  position: relative;
  height: 100%;
  background-color: var(--background-color-primary);
  box-sizing: border-box;
}

.border {
  position: absolute;
  inset: 0;
  border: 1px rgb(73, 73, 73) solid;
  border-radius: 4px;
  margin: 18px;
}

.akari-text {
  font-size: 22px;
  margin-bottom: 12px;
}

.inner-content {
  display: flex;
  position: relative;
  top: calc(var(--title-bar-height) * -1);
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100%;
}

.text-line-1 {
  color: rgb(174, 174, 174);
  font-size: 14px;
  font-weight: 700;
}

.text-line-1:not(:last-child) {
  margin-bottom: 12px;
}

.admin-hint {
  text-align: center;
  color: rgb(127, 127, 127);
  font-size: 12px;
  margin-bottom: 12px;

  .em {
    color: rgb(180, 180, 180);
    font-weight: 700;
  }
}

.error-hint {
  text-align: center;
  color: rgb(185, 135, 135);
  font-size: 12px;
}

.client {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 24px;
  transition: 0.3s all ease;
  cursor: pointer;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.03);
  width: 240px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  &:active {
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
    font-size: 12px;
    color: #5d5c5c;
    margin-left: 8px;
  }

  .left-widget {
    margin-right: 8px;
    font-size: 16px;
  }
}

.servers-available {
  font-size: 16px;
  font-weight: 700;
  padding: 0 24px;
  margin-bottom: 12px;
  color: #fff;
  text-align: center;
}

.connected-text {
  font-size: 16px;
  font-weight: 700;
  padding: 0 24px;
  color: #fff;
  text-align: center;
}
</style>
