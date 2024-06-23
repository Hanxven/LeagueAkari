<template>
  <NScrollbar style="max-height: 60vh" trigger="none">
    <NCard size="small">
      <template #header><span class="card-header-title">基础</span></template>
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
        label="更新源"
        label-description="检查更新或下载更新时所使用的源"
        :label-width="320"
      >
        <NSelect
          style="width: 160px"
          size="tiny"
          :value="au.settings.downloadSource"
          @update:value="(val) => aum.setDownloadSource(val)"
          :options="updateDownloadSource"
        />
      </ControlItem>
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
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import { appRendererModule as am } from '@shared/renderer/modules/app'
import { useAppStore } from '@shared/renderer/modules/app/store'
import { autoUpdateRendererModule as aum } from '@shared/renderer/modules/auto-update'
import { useAutoUpdateStore } from '@shared/renderer/modules/auto-update/store'
import { lcuConnectionRendererModule as lcm } from '@shared/renderer/modules/lcu-connection'
import { useLcuConnectionStore } from '@shared/renderer/modules/lcu-connection/store'
import { NCard, NScrollbar, NSelect, NSwitch } from 'naive-ui'

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
</style>
