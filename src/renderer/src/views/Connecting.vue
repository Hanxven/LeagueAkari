<template>
  <div class="waiting-screen">
    <div class="inner-content">
      <div v-if="isClientExists" class="text-line-1">
        <template v-if="isAttemptingConnect">即将连接...</template
        ><template v-else>客户端已启动，等待获取连接信息</template>
      </div>
      <div v-else class="text-line-1">游戏客户端未启动，等待客户端启动</div>
      <div v-if="!appState.isAdmin" class="admin-hint">
        <div>获取客户端连接信息需要<span class="em">管理员</span>权限</div>
        <div>您可将程序设置为以管理员权限启动，以避免重复的授权过程</div>
      </div>
      <NButton
        size="tiny"
        secondary
        v-if="!appState.isAdmin || (appState.isAdmin && isErr)"
        :type="isClientExists ? 'primary' : 'default'"
        :loading="
          lcuState.state === 'connecting' || isAttemptingConnect || lcuState.state === 'connected'
        "
        @click="() => handleConnect(1)"
        ><template v-if="isAttemptingConnect">尝试连接...</template>
        <template v-else
          ><template v-if="appState.isAdmin">手动连接</template
          ><template v-else>连接到客户端</template></template
        ></NButton
      >
      <div v-if="isErr" class="error-hint">
        无法获取连接信息。请检查<template v-if="!appState.isAdmin"
          >是否提供了管理员权限，或</template
        >游戏客户端是否已经开启
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTimeoutPoll } from '@vueuse/core'
import { NButton, useNotification } from 'naive-ui'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useAppState } from '@renderer/features/stores/app'
import { useLcuStateStore } from '@renderer/features/stores/lcu-connection'
import { useSettingsStore } from '@renderer/features/stores/settings'
import { call } from '@renderer/ipc'

const isClientExists = ref(false)
const isErr = ref(false)

const router = useRouter()
const notification = useNotification()

const handleConnect = async (maxAttempts = 3) => {
  let attempts = 0 // 初始化尝试次数

  if (isAttemptingConnect.value) {
    return
  }

  isAttemptingConnect.value = true
  while (attempts < maxAttempts && isAttemptingConnect.value) {
    try {
      await call<void>('connect') // 尝试连接
      isErr.value = false
      isAttemptingConnect.value = false
      return
    } catch (err) {
      notification.warning({
        duration: 5000,
        content: (err as any).message ? (err as any).message : '发生错误'
      })

      attempts++ // 增加尝试次数
      console.warn(`连接失败，正在尝试第 ${attempts} 次重连：`, err)
      if (attempts >= maxAttempts) {
        isErr.value = true
        isAttemptingConnect.value = false
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 2000)) // 等待2秒后重试
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
    isClientExists.value = await call<boolean>('isLeagueClientExists')
  },
  1000,
  { immediate: true }
)

const isAttemptingConnect = ref(false)
watch(
  () => isClientExists.value,
  (b) => {
    if (b) {
      if (!settings.app.autoConnect) {
        return
      }

      if (appState.isAdmin) {
        handleConnect(10000)
      } else {
        handleConnect(10)
      }
    } else {
      isAttemptingConnect.value = false
    }
  }
)
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
</style>
