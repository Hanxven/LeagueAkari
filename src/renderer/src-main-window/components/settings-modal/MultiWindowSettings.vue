<template>
  <NScrollbar style="height: 65vh">
    <NCard size="small">
      <template #header>
        <span class="card-header-title">{{ t('MultiWindowSettings.auxWindow.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('MultiWindowSettings.auxWindow.enabled.label')"
        :label-width="400"
      >
        <template #labelDescription>
          <div>{{ t('MultiWindowSettings.auxWindow.enabled.description') }}</div>
          <div>
            {{ t('MultiWindowSettings.auxWindow.enabled.descriptionPart1')
            }}<NIcon class="inline-icon"><Window24FilledIcon /></NIcon
            >{{ t('MultiWindowSettings.auxWindow.enabled.descriptionPart2') }}
          </div>
        </template>
        <NSwitch
          size="small"
          :value="aws.settings.enabled"
          @update:value="(val) => wm.auxWindow.setEnabled(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('MultiWindowSettings.auxWindow.autoShow.label')"
        :label-description="t('MultiWindowSettings.auxWindow.autoShow.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="aws.settings.autoShow"
          @update:value="(val) => wm.auxWindow.setAutoShow(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('MultiWindowSettings.auxWindow.opacity.label')"
        :label-description="t('MultiWindowSettings.auxWindow.opacity.description')"
        :label-width="400"
      >
        <NSlider
          size=""
          style="width: 120px"
          :min="0.3"
          :max="1"
          :step="0.01"
          :format-tooltip="(v) => `${(v * 100).toFixed()} %`"
          @update:value="(val) => wm.auxWindow.setOpacity(val)"
          :value="aws.settings.opacity"
        ></NSlider>
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('MultiWindowSettings.auxWindow.showSkinSelector.label')"
        :label-description="t('MultiWindowSettings.auxWindow.showSkinSelector.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="aws.settings.showSkinSelector"
          @update:value="(val) => wm.auxWindow.setShowSkinSelector(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('MultiWindowSettings.auxWindow.resetWindowPosition.label')"
        :label-description="t('MultiWindowSettings.auxWindow.resetWindowPosition.description')"
        :label-width="400"
      >
        <NButton
          size="small"
          type="warning"
          secondary
          @click="() => wm.auxWindow.resetPosition()"
          >{{ t('MultiWindowSettings.auxWindow.resetWindowPosition.button') }}</NButton
        >
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{ t('MultiWindowSettings.opggWindow.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('MultiWindowSettings.opggWindow.enabled.label')"
        :label-width="400"
      >
        <template #labelDescription>
          <div>{{ t('MultiWindowSettings.opggWindow.enabled.description') }}</div>
          <div>
            {{ t('MultiWindowSettings.opggWindow.enabled.descriptionPart1')
            }}<OpggIcon class="inline-icon" />{{
              t('MultiWindowSettings.opggWindow.enabled.descriptionPart2')
            }}
          </div>
        </template>
        <NSwitch
          size="small"
          :value="ows.settings.enabled"
          @update:value="(val) => wm.opggWindow.setEnabled(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('MultiWindowSettings.opggWindow.autoShow.label')"
        :label-description="t('MultiWindowSettings.opggWindow.autoShow.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="ows.settings.autoShow"
          @update:value="(val) => wm.opggWindow.setAutoShow(val)"
        />
      </ControlItem>
      <ControlItem
        :disabled="!as.isAdministrator"
        :label-width="400"
        class="control-item-margin"
        :label="t('MultiWindowSettings.opggWindow.showShortcut.label')"
        :label-description="t('MultiWindowSettings.opggWindow.showShortcut.description')"
      >
        <ShortcutSelector
          :target-id="AkariOpggWindow.SHOW_WINDOW_SHORTCUT_TARGET_ID"
          :shortcut-id="ows.settings.showShortcut"
          @update:shortcut-id="(id) => wm.opggWindow.setShowShortcut(id)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('MultiWindowSettings.opggWindow.opacity.label')"
        :label-description="t('MultiWindowSettings.opggWindow.opacity.description')"
        :label-width="400"
      >
        <NSlider
          size=""
          style="width: 120px"
          :min="0.3"
          :max="1"
          :step="0.01"
          :format-tooltip="(v) => `${(v * 100).toFixed()} %`"
          @update:value="(val) => wm.opggWindow.setOpacity(val)"
          :value="ows.settings.opacity"
        ></NSlider>
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('MultiWindowSettings.opggWindow.resetWindowPosition.label')"
        :label-description="t('MultiWindowSettings.opggWindow.resetWindowPosition.description')"
        :label-width="400"
      >
        <NButton
          size="small"
          type="warning"
          secondary
          @click="() => wm.opggWindow.resetPosition()"
          >{{ t('MultiWindowSettings.opggWindow.resetWindowPosition.button') }}</NButton
        >
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{
          as.isAdministrator
            ? t('MultiWindowSettings.ongoingGameWindow.title')
            : t('MultiWindowSettings.ongoingGameWindow.titleRequireAdmin')
        }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('MultiWindowSettings.ongoingGameWindow.enabled.label')"
        :label-description="t('MultiWindowSettings.ongoingGameWindow.enabled.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="ogws.settings.enabled"
          @update:value="(val) => wm.ongoingGameWindow.setEnabled(val)"
        />
      </ControlItem>
      <ControlItem
        :disabled="!as.isAdministrator"
        :label-width="400"
        class="control-item-margin"
        :label="t('MultiWindowSettings.ongoingGameWindow.showShortcut.label')"
        :label-description="t('MultiWindowSettings.ongoingGameWindow.showShortcut.description')"
      >
        <ShortcutSelector
          :target-id="AkariOngoingGameWindow.SHOW_WINDOW_SHORTCUT_TARGET_ID"
          :shortcut-id="ogws.settings.showShortcut"
          @update:shortcut-id="(id) => wm.ongoingGameWindow.setShowShortcut(id)"
        />
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{
          as.isAdministrator
            ? t('MultiWindowSettings.cdTimerWindow.title')
            : t('MultiWindowSettings.cdTimerWindow.titleRequireAdmin')
        }}</span>
      </template>
      <div class="control-item-margin cd-timer-window-description">
        <div class="line-a">{{ t('MultiWindowSettings.cdTimerWindow.description.lineA') }}</div>
        <div class="line-b indent">
          <span class="emphasize">{{
            t('MultiWindowSettings.cdTimerWindow.description.leftClick1')
          }}</span
          >{{ t('MultiWindowSettings.cdTimerWindow.description.leftClick2') }}
        </div>
        <div class="line-b indent">
          <span class="emphasize">{{
            t('MultiWindowSettings.cdTimerWindow.description.rightDoubleClick1')
          }}</span
          >{{ t('MultiWindowSettings.cdTimerWindow.description.rightDoubleClick2') }}
        </div>
        <div class="line-b indent">
          <span class="emphasize">{{
            t('MultiWindowSettings.cdTimerWindow.description.wheel1')
          }}</span
          >{{ t('MultiWindowSettings.cdTimerWindow.description.wheel2') }}
        </div>
      </div>
      <ControlItem
        class="control-item-margin"
        :label="t('MultiWindowSettings.cdTimerWindow.enabled.label')"
        :label-description="t('MultiWindowSettings.cdTimerWindow.enabled.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="ctws.settings.enabled"
          @update:value="(val) => wm.cdTimerWindow.setEnabled(val)"
        />
      </ControlItem>
      <ControlItem
        :disabled="!as.isAdministrator"
        :label-width="400"
        class="control-item-margin"
        :label="t('MultiWindowSettings.cdTimerWindow.showShortcut.label')"
        :label-description="t('MultiWindowSettings.cdTimerWindow.showShortcut.description')"
      >
        <ShortcutSelector
          :target-id="AkariCdTimerWindow.SHOW_WINDOW_SHORTCUT_TARGET_ID"
          :shortcut-id="ctws.settings.showShortcut"
          @update:shortcut-id="(id) => wm.cdTimerWindow.setShowShortcut(id)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('MultiWindowSettings.cdTimerWindow.timerType.label')"
        :label-description="t('MultiWindowSettings.cdTimerWindow.timerType.description')"
        :label-width="400"
      >
        <NRadioGroup
          size="small"
          :value="ctws.settings.timerType"
          @update:value="(val) => wm.cdTimerWindow.setTimerType(val)"
        >
          <NRadio value="countdown">{{
            t('MultiWindowSettings.cdTimerWindow.timerType.options.countdown')
          }}</NRadio>
          <NRadio value="countup">{{
            t('MultiWindowSettings.cdTimerWindow.timerType.options.countup')
          }}</NRadio>
        </NRadioGroup>
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import OpggIcon from '@renderer-shared/assets/icon/OpggIcon.vue'
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import {
  AkariCdTimerWindow,
  AkariOpggWindow,
  WindowManagerRenderer
} from '@renderer-shared/shards/window-manager'
import { AkariOngoingGameWindow } from '@renderer-shared/shards/window-manager'
import {
  useAuxWindowStore,
  useCdTimerWindowStore,
  useOngoingGameWindowStore,
  useOpggWindowStore
} from '@renderer-shared/shards/window-manager/store'
import { Window24Filled as Window24FilledIcon } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NIcon, NRadio, NRadioGroup, NScrollbar, NSlider, NSwitch } from 'naive-ui'

import ShortcutSelector from '@main-window/components/ShortcutSelector.vue'

const { t } = useTranslation()

const as = useAppCommonStore()
const aws = useAuxWindowStore()
const ows = useOpggWindowStore()
const ogws = useOngoingGameWindowStore()
const ctws = useCdTimerWindowStore()

const wm = useInstance(WindowManagerRenderer)
</script>

<style lang="less" scoped>
.inline-icon {
  width: 16px;
  height: 16px;
  vertical-align: middle;
}

[data-theme='dark'] {
  .inline-icon {
    color: #fff;
  }

  .cd-timer-window-description {
    border: 1px solid #fff1;
  }
}

[data-theme='light'] {
  .inline-icon {
    color: #000;
  }

  .cd-timer-window-description {
    border: 1px solid #0001;
  }
}

.cd-timer-window-description {
  border-radius: 4px;
  font-size: 13px;
  padding: 8px;
  box-sizing: border-box;

  .line-a {
    margin-bottom: 8px;
  }

  .line-a,
  .emphasize {
    font-weight: bold;
  }

  .line-b.indent {
    margin-left: 16px;
  }
}
</style>
