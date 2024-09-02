<template>
  <NScrollbar style="max-height: 60vh" trigger="none">
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
          size="tiny"
          :value="app.settings.closeStrategy"
          @update:value="(val) => am.setCloseStrategy(val)"
          :options="closeStrategies"
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
          :value="au.settings.autoCheckUpdates"
          @update:value="(val: boolean) => aum.setAutoCheckUpdates(val)"
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
          :value="au.settings.autoDownloadUpdates"
          @update:value="(val: boolean) => aum.setAutoDownloadUpdates(val)"
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
            size="tiny"
            :value="au.settings.downloadSource"
            @update:value="(val) => aum.setDownloadSource(val)"
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
          :value="lc.settings.autoConnect"
          @update:value="(val: boolean) => lcm.setAutoConnect(val)"
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
          :value="app.settings.useWmic"
          @update:value="(val: boolean) => am.setUseWmic(val)"
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
          :value="app.baseConfig?.disableHardwareAcceleration ?? false"
          @update:value="(val: boolean) => handleDisableHardwareAcceleration(val)"
        />
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { appRendererModule as am } from '@renderer-shared/modules/app'
import { useAppStore } from '@renderer-shared/modules/app/store'
import { autoUpdateRendererModule as aum } from '@renderer-shared/modules/auto-update'
import { useAutoUpdateStore } from '@renderer-shared/modules/auto-update/store'
import { lcuConnectionRendererModule as lcm } from '@renderer-shared/modules/lcu-connection'
import { useLcuConnectionStore } from '@renderer-shared/modules/lcu-connection/store'
import { NCard, NFlex, NScrollbar, NSelect, NSwitch, NTooltip, useDialog } from 'naive-ui'

const app = useAppStore()
const lc = useLcuConnectionStore()
const au = useAutoUpdateStore()

const closeStrategies = [
  { label: '最小化到托盘区', value: 'minimize-to-tray' },
  { label: '退出程序', value: 'quit' },
  { label: '每次询问', value: 'unset' }
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
      await am.setDisableHardwareAcceleration(val)
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
