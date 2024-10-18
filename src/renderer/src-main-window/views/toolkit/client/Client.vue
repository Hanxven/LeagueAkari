<template>
  <NScrollbar class="outer-wrapper">
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
            :disabled="lcs.connectionState !== 'connected'"
            size="small"
            secondary
            type="warning"
            @click="handleDisconnect"
            >断开</NButton
          >
        </ControlItem>
        <ControlItem
          class="control-item-margin"
          label="关闭客户端进程"
          label-description="关闭 LeagueClient"
          :label-width="320"
        >
          <NButton
            :disabled="lcs.connectionState !== 'connected'"
            size="small"
            secondary
            type="warning"
            @click="handleQuitClient"
            >关闭 Client 进程</NButton
          >
        </ControlItem>
        <ControlItem
          class="control-item-margin"
          label-description="当游戏端正在运行且在前台时，使用 Alt+F4 快捷键可强制结束游戏端 (游戏本体) 进程。请注意，此操作为强制结束进程，而非正常的游戏退出流程，可能产生意料之外的副作用"
          :disabled="!as.isAdministrator"
          :label="
            as.isAdministrator
              ? '使用 Alt+F4 结束游戏端'
              : '使用 Alt+F4 结束游戏端 (需要管理员权限)'
          "
          :label-width="320"
        >
          <NSwitch
            :disabled="!as.isAdministrator || lcs.connectionState !== 'connected'"
            size="small"
            type="warning"
            :value="gcs.settings.terminateGameClientOnAltF4"
            @update:value="(v) => gc.setTerminateGameClientOnAltF4(v)"
          />
        </ControlItem>
      </NCard>
      <NCard size="small" style="margin-top: 8px">
        <template #header><span class="card-header-title">League Client UX</span></template>
        <ControlItem
          class="control-item-margin"
          :disabled="!as.isAdministrator"
          :label="as.isAdministrator ? '调整窗口大小' : '调整窗口大小 (需要管理员权限)'"
          label-description="FixLCUWindow - 以 WinAPI 方式调整窗口的大小。在客户端界面大小不正确时，可尝试此操作"
          :label-width="320"
        >
          <div class="control" style="display: flex; gap: 4px; align-items: baseline">
            <NInputNumber
              style="width: 80px"
              size="small"
              :disabled="!as.isAdministrator || lcs.connectionState !== 'connected'"
              :show-button="false"
              :min="1"
              v-model:value="fixWindowMethodAOptions.baseWidth"
              @keyup.enter="() => fixWindowInputButton2?.focus()"
            >
              <template #prefix>W</template>
            </NInputNumber>
            <NInputNumber
              ref="input-2"
              style="width: 80px"
              :disabled="!as.isAdministrator || lcs.connectionState !== 'connected'"
              size="small"
              :show-button="false"
              :min="1"
              v-model:value="fixWindowMethodAOptions.baseHeight"
              @keyup.enter="() => handleFixWindowMethodA()"
              ><template #prefix>H</template>
            </NInputNumber>
            <NButton
              :disabled="!as.isAdministrator || lcs.connectionState !== 'connected'"
              size="small"
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
            :disabled="lcs.connectionState !== 'connected'"
            size="small"
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
            :disabled="lcs.connectionState !== 'connected'"
            type="warning"
            secondary
            size="small"
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
            :disabled="lcs.connectionState !== 'connected'"
            type="warning"
            secondary
            size="small"
            @click="handleLaunchUx"
            >启动 UX 进程</NButton
          >
        </ControlItem>
      </NCard>
    </div>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { GameClientRenderer } from '@renderer-shared/shards/game-client'
import { useGameClientStore } from '@renderer-shared/shards/game-client/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { NButton, NCard, NInputNumber, NScrollbar, NSwitch, useDialog } from 'naive-ui'
import { reactive, ref, toRaw, useTemplateRef } from 'vue'

const as = useAppCommonStore()
const lcs = useLeagueClientStore()
const gcs = useGameClientStore()

const lc = useInstance<LeagueClientRenderer>('league-client-renderer')
const gc = useInstance<GameClientRenderer>('game-client-renderer')

const dialog = useDialog()

const handleQuitClient = async () => {
  dialog.warning({
    title: '退出客户端进程',
    content: '是否退出客户端进程？这将直接关闭游戏。',
    positiveText: '退出',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await lc.api.processControl.quit()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const handleDisconnect = async () => {
  await lc.disconnect()
}

const handleRestartUx = async () => {
  dialog.warning({
    title: '重启 UX 进程',
    content: '是否重启 UX 进程？当客户端无法正常显示时，可尝试执行此操作。',
    positiveText: '重启',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await lc.api.riotclient.restartUx()
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
        await lc.api.riotclient.killUx()
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
        await lc.api.riotclient.launchUx()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const fixWindowInputButton2 = useTemplateRef('input-2')

const fixWindowMethodAOptions = reactive({
  baseWidth: 720,
  baseHeight: 1280
})

const handleFixWindowMethodA = async () => {
  dialog.warning({
    title: '修复客户端窗口',
    content: '修复客户端窗口？当客户端无法正常显示时，可尝试执行此操作。',
    positiveText: '执行',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await lc.fixWindowMethodA(toRaw(fixWindowMethodAOptions))
      } catch (error) {
        console.error(error)
      }
    }
  })
}
</script>

<style lang="less" scoped>
.outer-wrapper {
  position: relative;
  height: 100%;
  max-width: 100%;
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
