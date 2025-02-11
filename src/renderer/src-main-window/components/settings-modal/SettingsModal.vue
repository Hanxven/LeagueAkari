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
    <NTabs ref="tabs" type="line" animated size="small" v-model:value="tabName">
      <NTabPane name="basic" :tab="t('AppSettings.title')">
        <AppSettings />
      </NTabPane>
      <NTabPane name="match-history-tabs" :tab="t('MatchHistoryTabsSettings.title')">
        <MatchHistoryTabsSettings />
      </NTabPane>
      <NTabPane name="ongoing-game" :tab="t('OngoingGameSettings.title')">
        <OngoingGameSettings />
      </NTabPane>
      <NTabPane name="aux-window" :tab="t('AuxWindowSettings.title')">
        <AuxWindowSettings />
      </NTabPane>
      <NTabPane name="opgg-window" :tab="t('OpggWindowSettings.title')">
        <OpggWindowSettings />
      </NTabPane>
      <NTabPane name="misc" :tab="t('MiscSettings.title')">
        <MiscSettings />
      </NTabPane>
      <NTabPane name="debug" :tab="t('DebugSettings.title')">
        <DebugSettings />
      </NTabPane>
      <NTabPane v-if="as.settings.isInKyokoMode" name="storage" :tab="`存储`">
        <StorageSettings />
      </NTabPane>
      <NTabPane name="about" :tab="t('AboutPane.title')">
        <AboutPane />
      </NTabPane>
    </NTabs>
  </NModal>
</template>

<script setup lang="ts">
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useTranslation } from 'i18next-vue'
import { NModal, NTabPane, NTabs } from 'naive-ui'
import { nextTick, useCssModule, useTemplateRef, watch } from 'vue'

import AboutPane from './AboutPane.vue'
import AppSettings from './AppSettings.vue'
import AuxWindowSettings from './AuxWindowSettings.vue'
import OpggWindowSettings from './OpggWindowSettings.vue'
import DebugSettings from './DebugSettings.vue'
import MatchHistoryTabsSettings from './MatchHistoryTabsSettings.vue'
import MiscSettings from './MiscSettings.vue'
import OngoingGameSettings from './OngoingGameSettings.vue'
import StorageSettings from './StorageSettings.vue'

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

.card-header-title {
  font-weight: bold;
  font-size: 18px;
}

.divider {
  height: 1px;
  background-color: rgb(54, 54, 54);
  margin: 12px 24px;
}
</style>

<style lang="less" module>
.settings-modal {
  width: 90%;
  min-width: 720px;
  max-width: 1000px;
}
</style>
