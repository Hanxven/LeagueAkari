<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <NCard size="small">
          <template #header>
            <span class="card-header-title">{{ t('Client.leagueClient.title') }}</span>
          </template>
          <ControlItem
            class="control-item-margin"
            :label="t('Client.leagueClient.disconnect.label')"
            :label-description="t('Client.leagueClient.disconnect.description')"
            :label-width="320"
          >
            <NButton
              :disabled="lcs.connectionState !== 'connected'"
              size="small"
              secondary
              type="warning"
              @click="handleDisconnect"
              >{{ t('Client.leagueClient.disconnect.button') }}</NButton
            >
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('Client.leagueClient.quitClient.label')"
            :label-description="t('Client.leagueClient.quitClient.description')"
            :label-width="320"
          >
            <NButton
              :disabled="lcs.connectionState !== 'connected'"
              size="small"
              secondary
              type="warning"
              @click="handleQuitClient"
              >{{ t('Client.leagueClient.quitClient.button') }}</NButton
            >
          </ControlItem>
        </NCard>
        <NCard size="small" style="margin-top: 8px">
          <template #header>
            <span class="card-header-title">{{ t('Client.gameClient.title') }}</span>
          </template>
          <ControlItem
            class="control-item-margin"
            :label-description="t('Client.gameClient.terminateGameClientWithShortcut.description')"
            :disabled="!as.isAdministrator"
            :label="
              as.isAdministrator
                ? t('Client.gameClient.terminateGameClientWithShortcut.label')
                : t('Client.gameClient.terminateGameClientWithShortcut.labelAdminRequired')
            "
            :label-width="320"
          >
            <NSwitch
              :disabled="!as.isAdministrator"
              size="small"
              type="warning"
              :value="gcs.settings.terminateGameClientWithShortcut"
              @update:value="(v) => gc.setTerminateGameClientWithShortcut(v)"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label-description="t('Client.gameClient.terminateShortcut.description')"
            :disabled="!as.isAdministrator"
            :label="
              as.isAdministrator
                ? t('Client.gameClient.terminateShortcut.label')
                : t('Client.gameClient.terminateShortcut.labelAdminRequired')
            "
            :label-width="320"
          >
            <ShortcutSelector
              :target-id="GameClientRenderer.SHORTCUT_ID_TERMINATE_GAME_CLIENT"
              :shortcut-id="gcs.settings.terminateShortcut"
              @update:shortcut-id="(v) => gc.setTerminateShortcut(v)"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('Client.gameClient.settingsFileMode.label')"
            :label-description="t('Client.gameClient.settingsFileMode.description')"
            :label-width="320"
          >
            <div style="display: flex; gap: 4px; align-items: center">
              <NButton
                :disabled="lcs.connectionState !== 'connected'"
                size="small"
                @click="() => handleSetSettingsFileMode('readonly')"
                >{{ t('Client.gameClient.settingsFileMode.setReadonlyButton') }}</NButton
              >
              <NButton
                :disabled="lcs.connectionState !== 'connected'"
                size="small"
                @click="() => handleSetSettingsFileMode('writable')"
                >{{ t('Client.gameClient.settingsFileMode.setWritableButton') }}</NButton
              >
              <div class="settings-file-mode-indicator" v-if="settingFileMode !== 'unavailable'">
                {{ t(`Client.gameClient.settingsFileMode.${settingFileMode}`) }}
              </div>
            </div>
          </ControlItem>
        </NCard>
        <NCard size="small" style="margin-top: 8px">
          <template #header>
            <span class="card-header-title">{{ t('Client.leagueClientUx.title') }}</span>
          </template>
          <ControlItem
            class="control-item-margin"
            :disabled="!as.isAdministrator"
            :label="
              as.isAdministrator
                ? t('Client.leagueClientUx.fixWindowMethodAOptions.label')
                : t('Client.leagueClientUx.fixWindowMethodAOptions.labelAdminRequired')
            "
            :label-width="320"
          >
            <template #labelDescription>
              <div v-html="t('Client.leagueClientUx.fixWindowMethodAOptions.description')"></div>
            </template>
            <div class="control" style="display: flex; gap: 4px; align-items: baseline">
              <NInputNumber
                style="width: 80px"
                size="small"
                :disabled="!as.isAdministrator || lcs.connectionState !== 'connected'"
                :show-button="false"
                :min="1"
                @update:value="(val) => (fixWindowMethodAOptions.baseWidth = val || 0)"
                :value="fixWindowMethodAOptions.baseWidth"
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
                @update:value="(val) => (fixWindowMethodAOptions.baseHeight = val || 0)"
                :value="fixWindowMethodAOptions.baseHeight"
                @keyup.enter="() => handleFixWindowMethodA()"
                ><template #prefix>H</template>
              </NInputNumber>
              <NButton
                :disabled="!as.isAdministrator || lcs.connectionState !== 'connected'"
                size="small"
                secondary
                type="warning"
                @click="handleFixWindowMethodA"
                >{{ t('Client.leagueClientUx.fixWindowMethodAOptions.button') }}</NButton
              >
            </div>
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('Client.leagueClientUx.restartUx.label')"
            :label-description="t('Client.leagueClientUx.restartUx.description')"
            :label-width="320"
          >
            <NButton
              :disabled="lcs.connectionState !== 'connected'"
              size="small"
              secondary
              type="warning"
              @click="handleRestartUx"
              >{{ t('Client.leagueClientUx.restartUx.button') }}</NButton
            >
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('Client.leagueClientUx.killUx.label')"
            :label-description="t('Client.leagueClientUx.killUx.description')"
            :label-width="320"
          >
            <NButton
              :disabled="lcs.connectionState !== 'connected'"
              type="warning"
              secondary
              size="small"
              @click="handleKillUx"
              >{{ t('Client.leagueClientUx.killUx.button') }}</NButton
            >
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('Client.leagueClientUx.launchUx.label')"
            :label-description="t('Client.leagueClientUx.launchUx.description')"
            :label-width="320"
          >
            <NButton
              :disabled="lcs.connectionState !== 'connected'"
              type="warning"
              secondary
              size="small"
              @click="handleLaunchUx"
              >{{ t('Client.leagueClientUx.launchUx.button') }}</NButton
            >
          </ControlItem>
        </NCard>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { GameClientRenderer } from '@renderer-shared/shards/game-client'
import { useGameClientStore } from '@renderer-shared/shards/game-client/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NInputNumber, NScrollbar, NSwitch, useDialog, useMessage } from 'naive-ui'
import { reactive, ref, toRaw, useTemplateRef, watch } from 'vue'

import ShortcutSelector from '@main-window/components/ShortcutSelector.vue'

const { t } = useTranslation()

const as = useAppCommonStore()
const lcs = useLeagueClientStore()
const gcs = useGameClientStore()

const lc = useInstance(LeagueClientRenderer)
const gc = useInstance(GameClientRenderer)

const dialog = useDialog()

const handleQuitClient = async () => {
  dialog.warning({
    title: t('Client.leagueClient.quitClient.dialog.title'),
    content: t('Client.leagueClient.quitClient.dialog.content'),
    positiveText: t('Client.leagueClient.quitClient.dialog.positiveText'),
    negativeText: t('Client.leagueClient.quitClient.dialog.negativeText'),
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
    title: t('Client.leagueClientUx.restartUx.dialog.title'),
    content: t('Client.leagueClientUx.restartUx.dialog.content'),
    positiveText: t('Client.leagueClientUx.restartUx.dialog.positiveText'),
    negativeText: t('Client.leagueClientUx.restartUx.dialog.negativeText'),
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
    title: t('Client.leagueClientUx.killUx.dialog.title'),
    content: t('Client.leagueClientUx.killUx.dialog.content'),
    positiveText: t('Client.leagueClientUx.killUx.dialog.positiveText'),
    negativeText: t('Client.leagueClientUx.killUx.dialog.negativeText'),
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
    title: t('Client.leagueClientUx.launchUx.dialog.title'),
    content: t('Client.leagueClientUx.launchUx.dialog.content'),
    positiveText: t('Client.leagueClientUx.launchUx.dialog.positiveText'),
    negativeText: t('Client.leagueClientUx.launchUx.dialog.negativeText'),
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
  baseWidth: 1280,
  baseHeight: 720
})

const handleFixWindowMethodA = async () => {
  dialog.warning({
    title: t('Client.leagueClientUx.fixWindowMethodAOptions.dialog.title'),
    content: t('Client.leagueClientUx.fixWindowMethodAOptions.dialog.content'),
    positiveText: t('Client.leagueClientUx.fixWindowMethodAOptions.dialog.positiveText'),
    negativeText: t('Client.leagueClientUx.fixWindowMethodAOptions.dialog.negativeText'),
    onPositiveClick: async () => {
      try {
        await lc.fixWindowMethodA(toRaw(fixWindowMethodAOptions))
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const message = useMessage()

const settingFileMode = ref<'readonly' | 'writable' | 'unavailable'>('unavailable')

watch(
  () => lcs.isConnected,
  async (isConnected) => {
    if (isConnected) {
      settingFileMode.value = await gc
        .getSettingsFileReadonlyOrWritable()
        .catch(() => 'unavailable')
    } else {
      settingFileMode.value = 'unavailable'
    }
  },
  { immediate: true }
)

const handleSetSettingsFileMode = async (mode: 'readonly' | 'writable') => {
  try {
    await gc.setSettingsFileReadonlyOrWritable(mode)
    settingFileMode.value = await gc.getSettingsFileReadonlyOrWritable()

    if (mode === 'readonly') {
      message.success(t('Client.gameClient.settingsFileMode.setToReadonly'))
    } else {
      message.success(t('Client.gameClient.settingsFileMode.setToWritable'))
    }
  } catch (error: any) {
    message.warning(
      t('Client.gameClient.settingsFileMode.failedToSet', {
        reason: error.message
      })
    )
    settingFileMode.value = 'unavailable'
  }
}
</script>

<style lang="less" scoped>
@import '../toolkit-styles.less';

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

.settings-file-mode-indicator {
  font-size: 12px;
  font-weight: bold;
  margin-left: 8px;
}

[data-theme='dark'] {
  .settings-file-mode-indicator {
    color: #46ff90d0;
  }
}

[data-theme='light'] {
  .settings-file-mode-indicator {
    color: rgba(0, 122, 49, 0.816);
  }
}
</style>
