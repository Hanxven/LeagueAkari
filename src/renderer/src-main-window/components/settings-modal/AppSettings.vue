<template>
  <NScrollbar style="max-height: 65vh" trigger="none">
    <NCard size="small">
      <template #header><span class="card-header-title">基础</span></template>
      <ControlItem
        class="control-item-margin"
        label="窗口关闭策略"
        label-description="当关闭主窗口时所执行的行为"
        :label-width="320"
      >
        <NSelect
          style="width: 160px"
          size="small"
          :value="wms.settings.mainWindowCloseAction"
          @update:value="(val) => wm.setMainWindowCloseAction(val)"
          :options="closeActions"
        />
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">应用更新</span></template>
      <ControlItem
        class="control-item-margin"
        label="自动检查更新"
        label-description="在应用启动时，自动从 Github 拉取最新版本信息"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="sus.settings.autoCheckUpdates"
          @update:value="(val: boolean) => su.setAutoCheckUpdates(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="自动安装更新"
        label-description="检测到更新后，尝试下载并安装更新"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="sus.settings.autoDownloadUpdates"
          @update:value="(val: boolean) => su.setAutoDownloadUpdates(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="更新源"
        label-description="检查更新或下载更新时所使用的源"
        :label-width="320"
      >
        <NFlex align="center">
          <NSelect
            style="width: 160px"
            size="small"
            :value="sus.settings.downloadSource"
            @update:value="(val) => su.setDownloadSource(val)"
            :options="updateDownloadSource"
          />
          <NTooltip>
            <template #trigger><div class="hover-text">如何选择?</div></template>
            <div style="font-size: 12px">
              <span style="display: inline-block; width: 44px; font-weight: bold">Gitee</span>
              - 在中国大陆内拥有较好的响应速度
            </div>
            <div style="font-size: 12px">
              <span style="display: inline-block; width: 44px; font-weight: bold">Github</span>
              - 在中国大陆外拥有较好的响应速度
            </div>
          </NTooltip>
        </NFlex>
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">LCU 连接</span></template>
      <ControlItem
        class="control-item-margin"
        label="自动连接"
        label-description="存在唯一的客户端时，则自动连接该客户端"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="lcs.settings.autoConnect"
          @update:value="(val: boolean) => lc.setAutoConnect(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="使用 WMIC"
        label-description="使用 WMIC 获取客户端命令行信息，而不是默认的 Win32 API 方式。需要管理员权限"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="lcus.settings.useWmic"
          @update:value="(val: boolean) => lcu.setUseWmic(val)"
        />
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">其他</span></template>
      <ControlItem
        class="control-item-margin"
        label="禁用硬件加速"
        label-description="禁用硬件加速，可能会解决一些渲染问题，如字体模糊"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="as.baseConfig?.disableHardwareAcceleration ?? false"
          @update:value="(val: boolean) => handleDisableHardwareAcceleration(val)"
        />
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LeagueClientUxRenderer } from '@renderer-shared/shards/league-client-ux'
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { SelfUpdateRenderer } from '@renderer-shared/shards/self-update'
import { useSelfUpdateStore } from '@renderer-shared/shards/self-update/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useWindowManagerStore } from '@renderer-shared/shards/window-manager/store'
import { NCard, NFlex, NScrollbar, NSelect, NSwitch, NTooltip, useDialog } from 'naive-ui'

const lcus = useLeagueClientUxStore()
const lcs = useLeagueClientStore()
const sus = useSelfUpdateStore()
const wms = useWindowManagerStore()
const as = useAppCommonStore()

const su = useInstance<SelfUpdateRenderer>('self-update-renderer')
const wm = useInstance<WindowManagerRenderer>('window-manager-renderer')
const app = useInstance<AppCommonRenderer>('app-common-renderer')
const lcu = useInstance<LeagueClientUxRenderer>('league-client-ux-renderer')
const lc = useInstance<LeagueClientRenderer>('league-client-renderer')

const closeActions = [
  { label: '最小化到托盘区', value: 'minimize-to-tray' },
  { label: '退出程序', value: 'quit' },
  { label: '每次询问', value: 'ask' }
]

const updateDownloadSource = [
  { label: 'Gitee', value: 'gitee' },
  { label: 'Github', value: 'github' }
]

const dialog = useDialog()
const handleDisableHardwareAcceleration = (val: boolean) => {
  dialog.warning({
    title: `${val ? '启用' : '禁用'}硬件加速`,
    content: '是否确认更改硬件加速设置？将重启应用以应用更改',
    positiveText: '退出',
    negativeText: '取消',
    onPositiveClick: async () => {
      await app.setDisableHardwareAcceleration(val)
    }
  })
}
</script>

<style lang="less" scoped>
.control-item-margin {
  &:not(:last-child) {
    margin-bottom: 12px;
  }
}

.card-header-title {
  font-weight: bold;
  font-size: 18px;
}

.hover-text {
  font-size: 12px;
  color: #aaa;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #fff;
  }
}
</style>
