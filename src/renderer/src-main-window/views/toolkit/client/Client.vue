<template>
  <div class="outer-wrapper" ref="el">
    <div class="inner-wrapper">
      <NCard size="small">
        <template #header><span class="card-header-title">League Client</span></template>
        <ControlItem
          class="control-item-margin"
          label="断开连接"
          label-description="断开 League Akari 与游戏客户端的连接"
          :label-width="320"
        >
          <NButton
            :disabled="lc.state !== 'connected'"
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
            :disabled="lc.state !== 'connected'"
            size="tiny"
            secondary
            type="warning"
            @click="handleQuitClient"
            >关闭 Client 进程</NButton
          >
        </ControlItem>
        <ControlItem
          class="control-item-margin"
          label-description="当游戏客户端正在运行且在前台时，使用 Alt+F4 快捷键可强制结束游戏客户端进程"
          :disabled="!app.isAdministrator"
          :label="
            app.isAdministrator
              ? '使用 Alt+F4 结束游戏客户端'
              : '使用 Alt+F4 结束游戏客户端 (需要管理员权限)'
          "
          :label-width="320"
        >
          <NSwitch
            :disabled="!app.isAdministrator || lc.state !== 'connected'"
            size="small"
            type="warning"
            :value="lc2.settings.terminateGameClientOnAltF4"
            @update:value="(v) => lcm2.setTerminateGameClientOnAltF4(v)"
          />
        </ControlItem>
      </NCard>
      <NCard size="small" style="margin-top: 8px">
        <template #header><span class="card-header-title">League Client UX</span></template>
        <ControlItem
          class="control-item-margin"
          :disabled="!app.isAdministrator"
          :label="app.isAdministrator ? '调整窗口大小' : '调整窗口大小 (需要管理员权限)'"
          label-description="FixLCUWindow - 以 WinAPI 方式调整窗口的大小。在客户端界面大小不正确时，可尝试此操作"
          :label-width="320"
        >
          <div class="control" style="display: flex; gap: 4px; align-items: baseline">
            <NInputNumber
              style="width: 80px"
              size="tiny"
              :disabled="!app.isAdministrator || lc.state !== 'connected'"
              :show-button="false"
              :min="1"
              @update:value="
                (v) =>
                  lcm2.setFixWindowMethodAOptions({
                    baseWidth: v || 1,
                    baseHeight: lc2.settings.fixWindowMethodAOptions.baseHeight
                  })
              "
              :value="lc2.settings.fixWindowMethodAOptions.baseWidth"
              @keyup.enter="() => fixWindowInputButton2?.focus()"
            >
              <template #prefix>W</template>
            </NInputNumber>
            <NInputNumber
              ref="fixWindowInputButton2"
              style="width: 80px"
              :disabled="!app.isAdministrator || lc.state !== 'connected'"
              size="tiny"
              :show-button="false"
              :min="1"
              @update:value="
                (v) =>
                  lcm2.setFixWindowMethodAOptions({
                    baseWidth: lc2.settings.fixWindowMethodAOptions.baseWidth || 1,
                    baseHeight: v || 1
                  })
              "
              :value="lc2.settings.fixWindowMethodAOptions.baseHeight"
              @keyup.enter="() => handleFixWindowMethodA()"
              ><template #prefix>H</template>
            </NInputNumber>
            <NButton
              :disabled="!app.isAdministrator || lc.state !== 'connected'"
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
            :disabled="lc.state !== 'connected'"
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
            :disabled="lc.state !== 'connected'"
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
            :disabled="lc.state !== 'connected'"
            type="warning"
            secondary
            size="tiny"
            @click="handleLaunchUx"
            >启动 UX 进程</NButton
          >
        </ControlItem>
      </NCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import { useKeepAliveScrollPositionMemo } from '@shared/renderer/compositions/useKeepAliveScrollPositionMemo'
import { quit } from '@shared/renderer/http-api/process-control'
import { killUx, launchUx, restartUx } from '@shared/renderer/http-api/riotclient'
import { useAppStore } from '@shared/renderer/modules/app/store'
import { lcuConnectionRendererModule as lcm } from '@shared/renderer/modules/lcu-connection'
import { useLcuConnectionStore } from '@shared/renderer/modules/lcu-connection/store'
import { leagueClientRendererModule as lcm2 } from '@shared/renderer/modules/league-client'
import { useLeagueClientStore } from '@shared/renderer/modules/league-client/store'
import { NButton, NCard, NInputNumber, NSwitch, useDialog } from 'naive-ui'
import { ref } from 'vue'

const app = useAppStore()
const lc = useLcuConnectionStore()
const lc2 = useLeagueClientStore()

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
  await lcm.lcuDisconnect()
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

const handleFixWindowMethodA = async () => {
  dialog.warning({
    title: '修复客户端窗口',
    content: '修复客户端窗口？当客户端无法正常显示时，可尝试执行此操作。',
    positiveText: '执行',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await lcm2.fixWindowMethodA()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const el = ref()
useKeepAliveScrollPositionMemo(el)
</script>

<style lang="less" scoped>
.outer-wrapper {
  position: relative;
  height: 100%;
  max-width: 100%;
  overflow: auto;
}

.inner-wrapper {
  padding: 24px;
  margin: 0 auto;
  max-width: 800px;

  :deep(.n-card) {
    background-color: transparent;
  }
}

.control-item-margin {
  &:not(:last-child) {
    margin-bottom: 12px;
  }
}

.card-header-title {
  font-weight: bold;
  font-size: 18px;
}
</style>
