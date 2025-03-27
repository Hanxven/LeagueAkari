<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <NCard size="small">
          <template #header>
            <span class="card-header-title">{{ t('AutoChampConfig.title') }}</span>
          </template>
          <ControlItem
            :label="t('AutoChampConfig.enabled.label')"
            :label-description="t('AutoChampConfig.enabled.description')"
            class="control-item-margin"
            :label-width="260"
          >
            <NSwitch
              @update:value="(v) => ac.setEnabled(v)"
              :value="acs.settings.enabled"
              size="small"
            ></NSwitch>
          </ControlItem>
          <ControlItem
            :label="t('AutoChampConfig.configure.label')"
            class="control-item-margin"
            :label-width="260"
          >
            <ChampionConfig />
          </ControlItem>
        </NCard>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoChampConfigRenderer } from '@renderer-shared/shards/auto-champ-config'
import { useAutoChampConfigStore } from '@renderer-shared/shards/auto-champ-config/store'
import { useTranslation } from 'i18next-vue'
import { NCard, NScrollbar, NSwitch } from 'naive-ui'

import ChampionConfig from '@main-window/components/auto-champ-config/ChampionConfig.vue'

const { t } = useTranslation()

const acs = useAutoChampConfigStore()
const ac = useInstance(AutoChampConfigRenderer)
</script>

<style lang="less" scoped>
@import './automation-styles.less';
</style>
