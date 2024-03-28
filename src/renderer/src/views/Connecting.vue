<template>
  <div class="waiting-screen">
    <div class="inner-content">
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
              <span class="rso" title="区服"
                ><NSpin
                  v-if="currentConnectingClientPid === a.pid"
                  :size="12"
                  class="left-widget"
                /><NIcon v-else class="left-widget"><CubeSharp /></NIcon>
                {{ regionText[a.region] || a.region }}</span
              >
              <span class="region" title="地区">{{
                rsoPlatformText[a.rsoPlatformId] || a.rsoPlatformId
              }}</span>
              <span class="pid" title="Process ID">{{ a.pid }}</span>
            </div>
          </NScrollbar>
        </template>
      </div>
      <div v-else class="text-line-1">游戏客户端未启动，等待客户端启动</div>
      <div v-if="isErr" class="error-hint">无法获取连接信息。请检查游戏客户端是否已经开启。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CubeSharp } from '@vicons/ionicons5'
import { useTimeoutPoll } from '@vueuse/core'
import { NIcon, NScrollbar, NSpin, useNotification } from 'naive-ui'
import { ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useAppState } from '@renderer/features/stores/app'
import { useLcuStateStore } from '@renderer/features/stores/lcu-connection'
import { useSettingsStore } from '@renderer/features/stores/settings'
import { call } from '@renderer/ipc'
import { regionText, rsoPlatformText } from '@shared/utils/rso-platforms'
import { sleep } from '@renderer/utils/sleep'

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
      await call<void>('connect', auth) // 尝试连接
      isErr.value = false
      currentConnectingClientPid.value = null
      return
    } catch (err) {
      if (!appState.isAdmin || attempts.value > NOTIFY_THRESHOLD) {
        notification.warning({
          duration: 5000,
          content: (err as any).message ? (err as any).message : '发生错误'
        })
      }

      attempts.value++ // 增加尝试次数
      console.warn(`连接失败，正在尝试第 ${attempts.value} 次重连：`, err)
      if (attempts.value >= maxAttempts) {
        isErr.value = true
        currentConnectingClientPid.value = null
        break
      }
      await sleep(2000)
    }
  }
}

const lcuState = useLcuStateStore()

watch(
  () => lcuState.state,
  (s) => {
    if (s === 'connected') {
      router.replace(`/match-history`)
    }
  },
  { immediate: true }
)

const appState = useAppState()
const settings = useSettingsStore()

// 重复等待客户端启动
useTimeoutPoll(
  async () => {
    try {
      existingClients.value = await call('queryLcuAuth')
    } catch (error) {
      console.error('尝试检查进程存在时发生错误', error)
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

      if (existingClients.value.length === 1 && settings.app.autoConnect) {
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
  height: 100%;
  background-color: var(--background-color-primary);
  padding: 24px;
  box-sizing: border-box;
}

.inner-content {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100%;
  border-radius: 4px;
  border: 1px rgb(73, 73, 73) solid;
}

.text-line-1 {
  color: rgb(174, 174, 174);
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 700;
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
  margin-top: 4px;
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
    margin-left: 8px;
    font-size: 14px;
    color: #fff;
  }

  .rso {
    font-size: 14px;
    font-weight: 700;
  }

  .pid {
    font-size: 12px;
    color: #5d5c5c;
    margin-left: 8px;
  }

  .left-widget {
    margin-right: 8px;
    font-size: 16px;
    vertical-align: text-bottom;
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
</style>
