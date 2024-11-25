<template>
  <div class="automation-page">
    <div class="sections">
      <div class="section-icon-container">
        <NIcon class="section-icon"><AiStatusIcon /></NIcon>
        <span class="session-label">{{ t('Automation.title') }}</span>
      </div>
      <NTabs
        ref="tabs"
        v-model:value="currentTab"
        :theme-overrides="{ tabGapMediumBar: '18px' }"
        size="medium"
      >
        <NTab name="auto-gameflow">
          <span class="tab-name">{{ t('Automation.autoGameflow') }}</span>
        </NTab>
        <NTab name="auto-select" class="tab-name">
          <span class="tab-name">{{ t('Automation.autoSelect') }}</span>
        </NTab>
        <NTab name="misc" class="tab-name">
          <span class="tab-name">{{ t('Automation.autoMisc') }}</span>
        </NTab>
      </NTabs>
    </div>
    <div class="contents">
      <Transition name="move-fade">
        <KeepAlive>
          <AutoGameflow v-if="currentTab === 'auto-gameflow'" />
          <AutoSelect v-else-if="currentTab === 'auto-select'" />
          <AutoMisc v-else-if="currentTab === 'misc'" />
        </KeepAlive>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { AiStatus as AiStatusIcon } from '@vicons/carbon'
import { useTranslation } from 'i18next-vue'
import { NIcon, NTab, NTabs } from 'naive-ui'
import { nextTick, ref, useTemplateRef } from 'vue'

import AutoGameflow from './AutoGameflow.vue'
import AutoMisc from './AutoMisc.vue'
import AutoSelect from './AutoSelect.vue'

const currentTab = ref('auto-gameflow')

const { t } = useTranslation()
const as = useAppCommonStore()

const tabsEl = useTemplateRef('tabs')
// watch(
//   () => locale.value,
//   () => {
//     nextTick(() => tabsEl.value?.syncBarPosition())
//   }
// )
</script>

<style lang="less" scoped>
.automation-page {
  display: flex;
  flex-direction: column;
  height: 100%;

  .sections {
    display: flex;
    height: 52px;
    padding: 0 24px;
    align-items: flex-end;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .contents {
    flex: 1;
    height: 0;
  }
}

.tab-name {
  font-weight: bold;
}

.section-icon-container {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-right: 24px;
  margin-bottom: 4px;
  gap: 8px;
  color: rgba(255, 255, 255, 0.8);

  .section-icon {
    font-size: 24px;
  }

  .session-label {
    font-size: 16px;
    font-weight: bold;
  }
}

.transition-single-root {
  height: 100%;
}
</style>
