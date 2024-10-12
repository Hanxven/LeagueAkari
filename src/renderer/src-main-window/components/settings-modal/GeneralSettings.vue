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
      <template #header><span class="card-header-title">WeGame API</span></template>
      <ControlItem
        class="control-item-margin"
        label="使用WeGame API"
        label-description=""
        :label-width="320"
      >
        <template #labelDescription>
          <div>
            登录QQ后可查看WeGame评分
            <div style="font-weight: bold; color: #63e2b7">
              战绩页中如果选择“所有队列”，由于WeGame中不展示训练模式，会导致MVP显示缺失
            </div>
          </div>
        </template>
        <NFlex align="center">
          <NSwitch
            size="small"
            :value="ta.settings.enabled"
            @update:value="handleChangeUseTgpApi"
          />
          <div v-if="ta.settings.enabled && !ta.settings.expired">
            <NButton size="small" type="error" @click="handleLogout">
              注销QQ: {{ ta.settings.qq }}
            </NButton>
          </div>
        </NFlex>
      </ControlItem>
      <ControlItem
        v-if="ta.settings.enabled && ta.settings.expired"
        class="control-item-margin"
        label="扫描二维码登录"
        label-description="扫描二维码登录"
        :label-width="320"
      >
        <NBadge :value="qrcodeStatus">
          <NImage
            v-if="qrcodeImage"
            width="120"
            :src="qrcodeImage"
          />
        </NBadge>
      </ControlItem>
      <NTable v-if="ta.settings.enabled && !ta.settings.expired" size="small" bordered>
        <colgroup>
          <col style="width: 120px" />
          <col />
        </colgroup>
        <tbody>
        <tr>
          <td>TGP ID</td>
          <td><CopyableText>{{ta.settings.tgpId}}</CopyableText></td>
        </tr>
        <tr>
          <td>TGP TICKET</td>
          <td><CopyableText>{{ta.settings.tgpTicket}}</CopyableText></td>
        </tr>
        </tbody>
      </NTable>
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
              v-if="eds.sgpAvailability.sgpServerId"
              style="color: #63e2b7; font-weight: bold; user-select: text"
            >
              当前 SGP Server: {{ eds.sgpAvailability.sgpServerId }}
            </div>
            <div v-else style="color: rgb(209, 170, 124); font-weight: bold">
              暂不支持当前服务器使用 SGP 接口:
              {{ eds.sgpAvailability.sgpServerId }}
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
import { tgpApiRendererModule as tam } from '@renderer-shared/modules/tgp-api'
import { useTgpApiStore } from '@renderer-shared/modules/tgp-api/store'
import { NButton, NCard, NFlex, NImage, NInputNumber, NScrollbar, NSlider, NSwitch, NBadge, NTable } from 'naive-ui'
import { onMounted, ref } from 'vue'
import CopyableText from '@renderer-shared/components/CopyableText.vue'

const rt = useRespawnTimerStore()
const cf = useCoreFunctionalityStore()
const aux = useAuxiliaryWindowStore()
const app = useAppStore()
const eds = useExternalDataSourceStore()
const lc = useLcuConnectionStore()
const ta = useTgpApiStore()

const matchHistorySourceOptions = [
  { label: 'SGP', value: 'sgp' },
  { label: 'LCU', value: 'lcu' }
]

const qrcodeImage = ref<string | null>(null)
const qrcodeStatus = ref<string>('')

let pollingInterval: NodeJS.Timeout | null = null;

onMounted(async () => { await generateQrcode() });

const handleChangeUseTgpApi = async (val) => {
  await tam.setEnabled(val)
  await generateQrcode()
}

const handleLogout = async () => {
  await tam.logout()
  await generateQrcode()
}

const generateQrcode = async () => {
  if (ta.settings.expired) {
    qrcodeStatus.value = ''
    const [image, qrsig] = await tam.getQrCode()
    qrcodeImage.value = image
    startPolling(qrsig)
  }
};

const startPolling = (qrsig) => {
  pollingInterval = setInterval(async () => {
    const status = await tam.checkQrCodeStatus(qrsig);
    qrcodeStatus.value = status;
    if (status === '二维码已失效' || status === '登录成功' || status === '登录失败') {
      clearPolling();
    }
  }, 2000);
};

const clearPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
};
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
