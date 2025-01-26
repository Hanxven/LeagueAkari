<template>
  <NScrollbar style="height: 65vh">
    <NCard size="small">
      <template #header>
        <span class="card-header-title">{{ t('AppSettings.basic.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('AppSettings.basic.mainWindowCloseAction.label')"
        :label-description="t('AppSettings.basic.mainWindowCloseAction.description')"
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
      <ControlItem
        class="control-item-margin"
        label="语言 / Language"
        label-description="设置应用的主语言 / Set primary language for League Akari"
        :label-width="320"
      >
        <NSelect
          style="width: 160px"
          size="small"
          :value="as.settings.locale"
          @update:value="(val) => app.setLocale(val)"
          :options="locales"
        />
      </ControlItem>
      <ControlItem
        v-if="as.settings.isInKyokoMode"
        class="control-item-margin"
        label="Theme Color (experimental)"
        label-description="Theme color for League Akari"
        :label-width="320"
      >
        <NSelect
          style="width: 160px"
          size="small"
          :value="as.settings.theme"
          @update:value="(val) => app.setTheme(val)"
          :options="themes"
        />
      </ControlItem>
      <!-- 由于 Electron 的 bug (https://github.com/electron/electron/issues/41824), 禁用该功能 -->
      <ControlItem
        v-if="false && as.settings.isInKyokoMode"
        class="control-item-margin"
        :label="t('AppSettings.basic.backgroundMaterial.label')"
        :label-description="t('AppSettings.basic.backgroundMaterial.description')"
        :label-width="320"
      >
        <NSelect
          style="width: 160px"
          size="small"
          :value="wms.settings.backgroundMaterial"
          @update:value="(val) => wm.setBackgroundMaterial(val)"
          :options="backgroundMaterials"
        />
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{ t('AppSettings.selfUpdate.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('AppSettings.selfUpdate.autoCheckUpdates.label')"
        :label-description="t('AppSettings.selfUpdate.autoCheckUpdates.description')"
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
        :label="t('AppSettings.selfUpdate.autoDownloadUpdates.label')"
        :label-description="t('AppSettings.selfUpdate.autoDownloadUpdates.description')"
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
        :label="t('AppSettings.selfUpdate.downloadSource.label')"
        :label-description="t('AppSettings.selfUpdate.downloadSource.description')"
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
            <template #trigger
              ><div class="hover-text">
                {{ t('AppSettings.selfUpdate.tip.title') }}
              </div></template
            >
            <div style="font-size: 12px">
              <span style="display: inline-block; width: 44px; font-weight: bold">Gitee</span>
              {{ t('AppSettings.selfUpdate.tip.gitee') }}
            </div>
            <div style="font-size: 12px">
              <span style="display: inline-block; width: 44px; font-weight: bold">GitHub</span>
              {{ t('AppSettings.selfUpdate.tip.github') }}
            </div>
          </NTooltip>
        </NFlex>
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{ t('AppSettings.mainWindowUi.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('AppSettings.mainWindowUi.useProfileSkinAsBackground.label')"
        :label-description="t('AppSettings.mainWindowUi.useProfileSkinAsBackground.description')"
        :label-width="320"
        :disabled="preferMica"
      >
        <NSwitch
          :disabled="preferMica"
          size="small"
          v-model:value="muis.settings.useProfileSkinAsBackground"
        />
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{ t('AppSettings.lcConnection.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('AppSettings.lcConnection.autoConnect.label')"
        :label-description="t('AppSettings.lcConnection.autoConnect.description')"
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
        :label="t('AppSettings.lcConnection.useWmic.label')"
        :label-description="t('AppSettings.lcConnection.useWmic.description')"
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
      <template #header>
        <span class="card-header-title">{{ t('AppSettings.misc.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('AppSettings.misc.httpProxy.enabled.label')"
        :label-description="t('AppSettings.misc.httpProxy.enabled.description')"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="as.settings.httpProxy.enabled"
          @update:value="(val) => updateHttpProxySettings({ enabled: val })"
        />
      </ControlItem>
      <ControlItem
        v-if="as.settings.httpProxy.enabled"
        class="control-item-margin"
        :label="t('AppSettings.misc.httpProxy.host.label')"
        :label-description="t('AppSettings.misc.httpProxy.host.description')"
        :label-width="320"
      >
        <NInput
          :value="as.settings.httpProxy.host"
          style="width: 160px"
          size="small"
          placeholder="Host"
          :status="as.settings.httpProxy.host.trim() ? 'success' : 'warning'"
          @update:value="(val) => updateHttpProxySettings({ host: val })"
        />
      </ControlItem>
      <ControlItem
        v-if="as.settings.httpProxy.enabled"
        class="control-item-margin"
        :label="t('AppSettings.misc.httpProxy.port.label')"
        :label-description="t('AppSettings.misc.httpProxy.port.description')"
        :label-width="320"
      >
        <NInputNumber
          :show-button="false"
          :min="1"
          :max="65535"
          :value="as.settings.httpProxy.port"
          style="width: 160px"
          size="small"
          @update:value="(val) => updateHttpProxySettings({ port: val || 1 })"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('AppSettings.misc.disableHardwareAcceleration.label')"
        :label-description="t('AppSettings.misc.disableHardwareAcceleration.description')"
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
import { HttpProxySetting, useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LeagueClientUxRenderer } from '@renderer-shared/shards/league-client-ux'
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { SelfUpdateRenderer } from '@renderer-shared/shards/self-update'
import { useSelfUpdateStore } from '@renderer-shared/shards/self-update/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useWindowManagerStore } from '@renderer-shared/shards/window-manager/store'
import { useTranslation } from 'i18next-vue'
import {
  NCard,
  NFlex,
  NInput,
  NInputNumber,
  NScrollbar,
  NSelect,
  NSwitch,
  NTooltip,
  useDialog
} from 'naive-ui'
import { computed } from 'vue'

import { useMicaAvailability } from '@main-window/compositions/useMicaAvailability'
import { useMainWindowUiStore } from '@main-window/shards/main-window-ui/store'

const { t } = useTranslation()

const lcus = useLeagueClientUxStore()
const lcs = useLeagueClientStore()
const sus = useSelfUpdateStore()
const wms = useWindowManagerStore()
const as = useAppCommonStore()
const muis = useMainWindowUiStore()

const su = useInstance<SelfUpdateRenderer>('self-update-renderer')
const wm = useInstance<WindowManagerRenderer>('window-manager-renderer')
const app = useInstance<AppCommonRenderer>('app-common-renderer')
const lcu = useInstance<LeagueClientUxRenderer>('league-client-ux-renderer')
const lc = useInstance<LeagueClientRenderer>('league-client-renderer')

const preferMica = useMicaAvailability()

const closeActions = computed(() => {
  return [
    {
      label: t('AppSettings.basic.mainWindowCloseAction.options.minimize-to-tray'),
      value: 'minimize-to-tray'
    },
    { label: t('AppSettings.basic.mainWindowCloseAction.options.quit'), value: 'quit' },
    { label: t('AppSettings.basic.mainWindowCloseAction.options.ask'), value: 'ask' }
  ]
})

const updateDownloadSource = [
  { label: 'Gitee', value: 'gitee' },
  { label: 'GitHub', value: 'github' }
]

const locales = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en' }
]

const themes = [
  { label: '跟随系统', value: 'default' },
  { label: '亮色', value: 'light' },
  { label: '暗色', value: 'dark' }
]

const backgroundMaterials = computed(() => {
  return [
    { label: '默认', value: 'none' },
    { label: 'Mica', value: 'mica', disabled: !wms.supportsMica }
  ]
})
const dialog = useDialog()
const handleDisableHardwareAcceleration = (val: boolean) => {
  dialog.warning({
    title: val
      ? t('AppSettings.misc.disableHardwareAccelerationDialog.disableText')
      : t('AppSettings.misc.disableHardwareAccelerationDialog.enableText'),
    content: val
      ? t('AppSettings.misc.disableHardwareAccelerationDialog.disableConfirmation')
      : t('AppSettings.misc.disableHardwareAccelerationDialog.enableConfirmation'),
    positiveText: t('AppSettings.misc.disableHardwareAccelerationDialog.positiveText'),
    negativeText: t('AppSettings.misc.disableHardwareAccelerationDialog.negativeText'),
    onPositiveClick: async () => {
      await app.setDisableHardwareAcceleration(val)
    }
  })
}

const updateHttpProxySettings = (obj: Partial<HttpProxySetting>) => {
  app.setHttpProxy({ ...as.settings.httpProxy, ...obj })
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
