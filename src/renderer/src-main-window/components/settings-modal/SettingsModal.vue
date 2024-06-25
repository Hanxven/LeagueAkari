<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :class="styles['settings-modal']"
  >
    <template #header><span class="card-header-title">设置</span></template>
    <NTabs type="line" animated size="small" v-model:value="tabName">
      <NTabPane name="basic" tab="应用"><AppSettings /></NTabPane>
      <NTabPane name="general" tab="通用"><GeneralSettings /></NTabPane>
      <NTabPane name="process" tab="进程"><ProcessSettings /></NTabPane>
      <NTabPane name="debug" tab="调试"><DebugSettings /></NTabPane>
      <NTabPane name="about" tab="关于"><AboutPane /></NTabPane>
    </NTabs>
  </NModal>
</template>

<script setup lang="ts">
import { NModal, NTabPane, NTabs } from 'naive-ui'
import { useCssModule } from 'vue'

import AboutPane from './AboutPane.vue'
import AppSettings from './AppSettings.vue'
import DebugSettings from './DebugSettings.vue'
import GeneralSettings from './GeneralSettings.vue'
import ProcessSettings from './ProcessSettings.vue'

const styles = useCssModule()
const show = defineModel<boolean>('show', { default: false })

const tabName = defineModel<string>('tabName', { default: 'basic' })
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
  max-width: 768px;
}
</style>
