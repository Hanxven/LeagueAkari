<template>
  <NScrollbar style="max-height: 60vh" trigger="none">
    <NCard size="small">
      <template #header><span class="card-header-title">League Client</span></template>
      <ControlItem
        class="control-item-margin"
        label="断开连接"
        label-description="断开 League Akari 与游戏客户端的连接"
        :label-width="320"
      >
        <NButton
          :disabled="app.lcuConnectionState !== 'connected'"
          size="tiny"
          secondary
          type="warning"
          @click="handleDisconnect"
          >断开</NButton
        >
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="关闭游戏客户端进程"
        label-description="这会导致游戏客户端立刻关闭"
        :label-width="320"
      >
        <NButton
          :disabled="app.lcuConnectionState !== 'connected'"
          size="tiny"
          secondary
          type="warning"
          @click="handleQuitClient"
          >关闭 Client 进程</NButton
        >
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">League Client UX</span></template>
      <ControlItem
        class="control-item-margin"
        v-if="app.isAdministrator"
        label="调整窗口大小"
        label-description="以 WinAPI 方式调整窗口的大小，请谨慎使用该功能。在客户端界面大小不正确时，可尝试此操作"
        :label-width="320"
      >
        <div class="control" style="display: flex; gap: 4px; align-items: baseline">
          <NInputNumber
            style="width: 80px"
            size="tiny"
            :disabled="app.lcuConnectionState !== 'connected'"
            :show-button="false"
            :min="1"
            @update:value="
              (v) =>
                setFixWindowMethodAOptions({
                  baseWidth: v || 1,
                  baseHeight: app.settings.fixWindowMethodAOptions.baseHeight
                })
            "
            :value="app.settings.fixWindowMethodAOptions.baseWidth"
            @keyup.enter="() => fixWindowInputButton2?.focus()"
          >
            <template #prefix>W</template>
          </NInputNumber>
          <NInputNumber
            ref="fixWindowInputButton2"
            style="width: 80px"
            :disabled="app.lcuConnectionState !== 'connected'"
            size="tiny"
            :show-button="false"
            :min="1"
            @update:value="
              (v) =>
                setFixWindowMethodAOptions({
                  baseWidth: app.settings.fixWindowMethodAOptions.baseWidth || 1,
                  baseHeight: v || 1
                })
            "
            :value="app.settings.fixWindowMethodAOptions.baseHeight"
            @keyup.enter="() => handleFixWindowMethodA()"
            ><template #prefix>H</template>
          </NInputNumber>
          <NButton
            :disabled="app.lcuConnectionState !== 'connected'"
            size="tiny"
            secondary
            type="warning"
            @click="handleFixWindowMethodA"
            >调整</NButton
          >
        </div>
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="重启 UX 进程"
        label-description="立即重启渲染进程。该操作不会影响正在进行中的活动，适用于修复客户端界面错误"
        :label-width="320"
      >
        <NButton
          :disabled="app.lcuConnectionState !== 'connected'"
          size="tiny"
          secondary
          type="warning"
          @click="handleRestartUx"
          >重启 UX 进程</NButton
        >
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="结束 UX 进程"
        label-description="立即关闭渲染进程。该操作不会影响正在进行中的活动"
        :label-width="320"
      >
        <NButton
          :disabled="app.lcuConnectionState !== 'connected'"
          type="warning"
          secondary
          size="tiny"
          @click="handleKillUx"
          >结束 UX 进程</NButton
        >
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="启动 UX 进程"
        label-description="如果渲染进程已经关闭，则立即启动渲染进程"
        :label-width="320"
      >
        <NButton
          :disabled="app.lcuConnectionState !== 'connected'"
          type="warning"
          secondary
          size="tiny"
          @click="handleLaunchUx"
          >启动 UX 进程</NButton
        >
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import { setFixWindowMethodAOptions } from '@shared/renderer/modules/app'
import { useAppStore } from '@shared/renderer/modules/app/store'
import { quit } from '@shared/renderer/http-api/process-control'
import { killUx, launchUx, restartUx } from '@shared/renderer/http-api/riotclient'
import { mainCall } from '@shared/renderer/utils/ipc'
import { NButton, NCard, NInputNumber, NScrollbar, useDialog } from 'naive-ui'
import { reactive, ref } from 'vue'

const app = useAppStore()

const dialog = useDialog()

const handleQuitClient = async () => {
  dialog.warning({
    title: '退出客户端进程',
    content: '是否退出客户端进程？这将直接关闭游戏。',
    positiveText: '退出',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await quit()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const handleDisconnect = async () => {
  await mainCall('lcu-connection/disconnect')
}

const handleRestartUx = async () => {
  dialog.warning({
    title: '重启 UX 进程',
    content: '是否重启 UX 进程？当客户端无法正常显示时，可尝试执行此操作。',
    positiveText: '重启',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await restartUx()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const handleKillUx = async () => {
  dialog.warning({
    title: '结束 UX 进程',
    content:
      '是否结束 UX 进程？你可能需要重新启动此进程。结束 UX 进程并不会导致游戏退出，但可以显著减少性能占用。',
    positiveText: '结束',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await killUx()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const handleLaunchUx = async () => {
  dialog.warning({
    title: '启动 UX 进程',
    content: '是否启动 UX 进程？',
    positiveText: '启动',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await launchUx()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const fixWindowInputButton2 = ref()

const fixWindowMethodAOptions = reactive({
  baseWidth: 1600,
  baseHeight: 900
})

const handleFixWindowMethodA = async () => {
  dialog.warning({
    title: '修复客户端窗口',
    content: '修复客户端窗口？当客户端无法正常显示时，可尝试执行此操作。',
    positiveText: '执行',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await mainCall('league-client-ux/fix-window-method-a', { ...fixWindowMethodAOptions })
      } catch (error) {
        console.error(error)
      }
    }
  })
}
</script>

<style lang="less" scoped>
.card-header-title {
  font-weight: bold;
  font-size: 18px;
}

.control-line {
  display: flex;
  align-items: center;
  font-size: 13px;
  height: 30px;

  &:not(:last-child) {
    margin-bottom: 16px;
  }

  .label {
    width: 130px;
  }

  .input-number {
    width: 120px;
  }
}

.control-item-margin {
  &:not(:last-child) {
    margin-bottom: 12px;
  }
}
</style>
