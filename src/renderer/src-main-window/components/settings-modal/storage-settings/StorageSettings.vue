<template>
  <NTabs
    size="small"
    style="height: 65vh"
    placement="left"
    :tabs-padding="4"
    :tab-style="{
      padding: '6px 24px 6px 12px'
    }"
    :pane-style="{
      'padding-left': '16px',
      'border-left': '1px solid var(--n-border-color)'
    }"
  >
    <NTabPane
      :tab="t('StorageSettings.tabs.tagged-players')"
      name="tagged-players"
      display-directive="show"
    >
      <TaggedPlayers />
    </NTabPane>
    <NTabPane :tab="t('StorageSettings.tabs.settings')" name="settings" display-directive="show">
      <SavedSettings />
    </NTabPane>
  </NTabs>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'
import { NTabPane, NTabs } from 'naive-ui'

import SavedSettings from './SavedSettings.vue'
import TaggedPlayers from './TaggedPlayers.vue'

const { t } = useTranslation()
</script>

<style lang="less" scoped>
.operations {
  display: flex;
  margin-bottom: 8px;
}
</style>

<style lang="less" module>
.row-base {
  font-size: 12px;
}

.empty {
  color: #ffffff80;
}
</style>
