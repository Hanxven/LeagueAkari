<template>
  <NScrollbar style="max-height: 65vh" trigger="none">
    <NCard size="small">
      <template #header><span class="card-header-title">其他</span></template>
      <ControlItem
        class="control-item-margin"
        label="重生倒计时"
        label-description="在标题栏展示一个距离重生剩余时间的指示器"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="rt.settings.enabled"
          @update:value="(val) => rtm.setEnabled(val)"
        />
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">战绩页面</span></template>
      <ControlItem
        class="control-item-margin"
        label="更新页面战绩"
        label-description="在对局结束后，主动刷新所有涉及到本次对局的战绩页面。由于服务器的更新延迟，获取到的战绩仍可能非最新"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="cf.settings.fetchAfterGame"
          @update:value="(val) => cfm.setFetchAfterGame(val)"
        />
      </ControlItem>
      <ControlItem
        v-if="app.settings.isInKyokoMode"
        class="control-item-margin"
        label="战绩页面拉取详细对局"
        label-description="在请求页面战绩列表时，也同时加载所有对局的详细信息"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="cf.settings.fetchDetailedGame"
          @update:value="(val) => cfm.setFetchDetailedGame(val)"
        />
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">数据源</span></template>
      <ControlItem class="control-item-margin" label="使用 SGP API" :label-width="320">
        <template #labelDescription>
          <div>
            部分接口将首选从 SGP API 获取数据。使用 SGP 接口可获得更多特性的支持，包括：
            <div style="margin-left: 12px; font-weight: bold; color: #63e2b7">
              · 战绩页面可按照队列进行全局筛选
            </div>
            <div style="margin-left: 12px; font-weight: bold; color: #63e2b7">· 更稳定的客户端</div>
            若当前服务器的 SGP 接口不在支持范围内，则使用 LCU API
          </div>
          <template v-if="cf.settings.useSgpApi && lc.state === 'connected'">
            <div
              v-if="eds.sgpAvailability.currentSgpServerSupported"
              style="color: #63e2b7; font-weight: bold; user-select: text"
            >
              当前 ({{
                eds.sgpAvailability.currentRegion === 'TENCENT'
                  ? `TENCENT-${eds.sgpAvailability.currentSgpServerId}`
                  : eds.sgpAvailability.currentSgpServerId
              }}) SGP Server:
              {{
                eds.sgpAvailability.supportedSgpServers.servers[
                  eds.sgpAvailability.currentSgpServerId
                ].server
              }}
            </div>
            <div v-else style="color: rgb(209, 170, 124); font-weight: bold">
              暂不支持当前服务器使用 SGP 接口:
              {{
                eds.sgpAvailability.currentRegion === 'TENCENT'
                  ? eds.sgpAvailability.currentRsoPlatform
                  : eds.sgpAvailability.currentRegion
              }}
            </div>
          </template>
        </template>
        <NSwitch
          size="small"
          :value="cf.settings.useSgpApi"
          @update:value="(val) => cfm.setUseSgpApi(val)"
        />
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">小窗口</span></template>
      <ControlItem
        class="control-item-margin"
        label="使用小窗口"
        label-description="在一些游戏流程中使用小窗口来展示状态以及提供额外操作"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="aux.settings.enabled"
          @update:value="(val) => awm.setEnabled(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="自动弹出和关闭"
        label-description="在游戏流程的部分阶段，自动弹出或关闭小窗口"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="aux.settings.autoShow"
          @update:value="(val) => awm.setAutoShow(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="小窗口不透明度"
        label-description="小窗口的半透明状态"
        :label-width="320"
      >
        <NSlider
          size=""
          style="width: 120px"
          :min="0.3"
          :max="1"
          :step="0.01"
          :format-tooltip="(v) => `${(v * 100).toFixed()} %`"
          @update:value="(val) => awm.setOpacity(val)"
          :value="aux.settings.opacity"
        ></NSlider>
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="皮肤设置器"
        label-description="在小窗口展示一个设置皮肤的快捷入口"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="aux.settings.showSkinSelector"
          @update:value="(val) => awm.setShowSkinSelector(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="缩放"
        label-description="可以调整小窗口的整体大小"
        :label-width="320"
      >
        <NInputNumber
          style="width: 100px"
          size="small"
          :min="1"
          :max="3"
          step="0.1"
          :value="aux.settings.zoomFactor"
          @update:value="(val) => awm.setZoomFactor(val || 1.0)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="重置小窗口位置"
        label-description="重新设置小窗口的位置，还原到默认主屏幕正中心"
        :label-width="320"
      >
        <NButton size="small" type="warning" secondary @click="() => awm.resetWindowPosition()"
          >重设</NButton
        >
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useAppStore } from '@renderer-shared/modules/app/store'
import { auxiliaryWindowRendererModule as awm } from '@renderer-shared/modules/auxiliary-window'
import { useAuxiliaryWindowStore } from '@renderer-shared/modules/auxiliary-window/store'
import { coreFunctionalityRendererModule as cfm } from '@renderer-shared/modules/core-functionality'
import { useCoreFunctionalityStore } from '@renderer-shared/modules/core-functionality/store'
import { useExternalDataSourceStore } from '@renderer-shared/modules/external-data-source/store'
import { useLcuConnectionStore } from '@renderer-shared/modules/lcu-connection/store'
import { respawnTimerRendererModule as rtm } from '@renderer-shared/modules/respawn-timer'
import { useRespawnTimerStore } from '@renderer-shared/modules/respawn-timer/store'
import {
  NButton,
  NCard,
  NInputNumber,
  NScrollbar,
  NSlider,
  NSwitch
} from 'naive-ui'

const rt = useRespawnTimerStore()
const cf = useCoreFunctionalityStore()
const aux = useAuxiliaryWindowStore()
const app = useAppStore()
const eds = useExternalDataSourceStore()
const lc = useLcuConnectionStore()

const matchHistorySourceOptions = [
  { label: 'SGP', value: 'sgp' },
  { label: 'LCU', value: 'lcu' }
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

.card-header-title.disabled {
  color: rgb(97, 97, 97);
}
</style>
