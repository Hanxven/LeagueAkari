<template>
  <NScrollbar style="max-height: 60vh" trigger="none">
    <NCard size="small">
      <template #header><span class="card-header-title">Riot Client</span></template>
      <ControlItem
        class="control-item-margin"
        label="关闭游戏客户端进程"
        label-description="这会导致游戏客户端立刻关闭"
        :label-width="320"
      >
        <NButton
          :disabled="lcuState.state !== 'connected'"
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
        v-if="appState.isAdmin"
        label="调整窗口大小"
        label-description="以 WinAPI 方式调整窗口的大小，请谨慎使用该功能。在客户端界面大小不正确时，可尝试此操作"
        :label-width="320"
      >
        <div class="control" style="display: flex; gap: 4px; align-items: baseline">
          <NInputNumber
            style="width: 80px"
            size="tiny"
            :disabled="lcuState.state !== 'connected'"
            :show-button="false"
            :min="1"
            @update:value="
              (v) =>
                setFixWindowMethodAOptions(v || 1, settings.app.fixWindowMethodAOptions.baseHeight)
            "
            :value="settings.app.fixWindowMethodAOptions.baseWidth"
            @keyup.enter="() => fixWindowInputButton2?.focus()"
          >
            <template #prefix>W</template>
          </NInputNumber>
          <NInputNumber
            ref="fixWindowInputButton2"
            style="width: 80px"
            :disabled="lcuState.state !== 'connected'"
            size="tiny"
            :show-button="false"
            :min="1"
            @update:value="
              (v) =>
                setFixWindowMethodAOptions(settings.app.fixWindowMethodAOptions.baseWidth, v || 1)
            "
            :value="settings.app.fixWindowMethodAOptions.baseHeight"
            @keyup.enter="() => handleFixWindowMethodA()"
            ><template #prefix>H</template>
          </NInputNumber>
          <NButton
            :disabled="lcuState.state !== 'connected'"
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
          :disabled="lcuState.state !== 'connected'"
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
          :disabled="lcuState.state !== 'connected'"
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
          :disabled="lcuState.state !== 'connected'"
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
import { NButton, NCard, NInputNumber, NScrollbar, useDialog } from 'naive-ui'
import { reactive, ref } from 'vue'

import { setFixWindowMethodAOptions } from '@renderer/features/app'
import { useAppState } from '@renderer/features/stores/app'
import { useLcuStateStore } from '@renderer/features/stores/lcu-connection'
import { useSettingsStore } from '@renderer/features/stores/settings'
import { quit } from '@renderer/http-api/process-control'
import { killUx, launchUx, restartUx } from '@renderer/http-api/riotclient'
import { call } from '@renderer/ipc'

import ControlItem from '../ControlItem.vue'

const lcuState = useLcuStateStore()
const appState = useAppState()
const settings = useSettingsStore()

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
      } catch (err) {
        console.error(err)
      }
    }
  })
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
      } catch (err) {
        console.error(err)
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
      } catch (err) {
        console.error(err)
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
      } catch (err) {
        console.error(err)
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
        await call('fixWindowMethodA', { ...fixWindowMethodAOptions })
      } catch (err) {
        console.error(err)
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
