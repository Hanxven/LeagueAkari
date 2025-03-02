<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :class="styles['settings-modal']"
  >
    <template #header>
      <span class="card-header-title">{{ t('SettingModal.title') }}</span>
    </template>
    <NTabs
      ref="tabs"
      type="line"
      animated
      size="medium"
      v-model:value="tabName"
      :theme-overrides="{ tabGapMediumLine: '18px' }"
    >
      <NTabPane name="basic">
        <template #tab>
          <div class="tab-icon-title">
            <NIcon class="icon"><Settings16FilledIcon /> </NIcon>
            <span>{{ t('AppSettings.title') }}</span>
          </div>
        </template>
        <AppSettings />
      </NTabPane>
      <NTabPane name="match-history-tabs">
        <template #tab>
          <div class="tab-icon-title">
            <NIcon class="icon"><LayersIcon /> </NIcon>
            <span>{{ t('MatchHistorySettings.title') }}</span>
          </div>
        </template>
        <MatchHistorySettings />
      </NTabPane>
      <NTabPane name="ongoing-game">
        <template #tab>
          <div class="tab-icon-title">
            <NIcon class="icon"><Games24FilledIcon /> </NIcon>
            <span>{{ t('OngoingGameSettings.title') }}</span>
          </div>
        </template>
        <OngoingGameSettings />
      </NTabPane>
      <NTabPane name="multi-window">
        <template #tab>
          <div class="tab-icon-title">
            <NIcon class="icon"><WindowMultiple20RegularIcon /> </NIcon>
            <span>{{ t('MultiWindowSettings.title') }}</span>
          </div>
        </template>
        <MultiWindowSettings />
      </NTabPane>
      <NTabPane name="storage">
        <template #tab>
          <div class="tab-icon-title">
            <NIcon class="icon"><Storage24FilledIcon /> </NIcon>
            <span>{{ t('StorageSettings.title') }}</span>
          </div>
        </template>
        <StorageSettings />
      </NTabPane>
      <NTabPane name="misc" :tab="t('MiscSettings.title')">
        <template #tab>
          <div class="tab-icon-title">
            <NIcon class="icon"><ToolkitIcon /> </NIcon>
            <span>{{ t('MiscSettings.title') }}</span>
          </div>
        </template>
        <MiscSettings />
      </NTabPane>
      <NTabPane name="debug">
        <template #tab>
          <div class="tab-icon-title">
            <NIcon class="icon"><DebugIcon /> </NIcon>
            <span>{{ t('DebugSettings.title') }}</span>
          </div>
        </template>
        <DebugSettings />
      </NTabPane>
      <NTabPane name="about">
        <template #tab>
          <div class="tab-icon-title">
            <NIcon class="icon"><InfoSharpIcon /> </NIcon>
            <span>{{ t('AboutPane.title') }}</span>
          </div>
        </template>
        <AboutPane />
      </NTabPane>
    </NTabs>
  </NModal>
</template>

<script setup lang="ts">
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { Debug as DebugIcon, Layers as LayersIcon, ToolKit as ToolkitIcon } from '@vicons/carbon'
import {
  Games24Filled as Games24FilledIcon,
  Settings16Filled as Settings16FilledIcon,
  Storage24Filled as Storage24FilledIcon,
  WindowMultiple20Regular as WindowMultiple20RegularIcon
} from '@vicons/fluent'
import { InfoSharp as InfoSharpIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NIcon, NModal, NTabPane, NTabs } from 'naive-ui'
import { useCssModule, useTemplateRef, watch } from 'vue'

import AboutPane from './AboutPane.vue'
import AppSettings from './AppSettings.vue'
import DebugSettings from './DebugSettings.vue'
import MatchHistorySettings from './MatchHistorySettings.vue'
import MiscSettings from './MiscSettings.vue'
import MultiWindowSettings from './MultiWindowSettings.vue'
import OngoingGameSettings from './OngoingGameSettings.vue'
import StorageSettings from './storage-settings/StorageSettings.vue'

const { t } = useTranslation()

const styles = useCssModule()

const show = defineModel<boolean>('show', { default: false })
const tabName = defineModel<string>('tabName', { default: 'basic' })

const as = useAppCommonStore()

const tabsEl = useTemplateRef('tabs')
watch(
  () => as.settings.locale,
  () => {
    requestAnimationFrame(() => {
      tabsEl.value?.syncBarPosition()
    })
  }
)
</script>

<style lang="less" scoped>
.about-para {
  text-indent: 2em;
  font-size: 13px;
}

.about-para-2 {
  display: flex;
  align-items: center;
  margin-top: 4px;
  text-indent: 2em;
  font-size: 13px;

  img {
    display: block;
  }
}

.copyright {
  margin-top: 8px;
  font-size: 12px;
  color: rgb(87, 87, 87);
}

.divider {
  height: 1px;
  background-color: rgb(54, 54, 54);
  margin: 12px 24px;
}

.tab-icon-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px 0 4px;
  vertical-align: middle;

  .icon {
    font-size: 18px;
  }

  .opgg-icon {
    width: 16px;
    height: 16px;
  }
}
</style>

<style lang="less" module>
.settings-modal {
  width: 90%;
  min-width: 720px;
  max-width: 1106px;
}
</style>
