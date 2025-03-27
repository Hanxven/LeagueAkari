<template>
  <div class="automation-page">
    <div class="sections">
      <div class="section-icon-container">
        <NIcon class="section-icon"><AiStatusIcon /></NIcon>
        <span class="session-label">{{ t('Automation.title') }}</span>
      </div>
      <NTabs
        v-model:value="currentTab"
        :theme-overrides="{ tabGapMediumBar: '18px' }"
        size="medium"
      >
        <NTab v-for="tab in tabs" :key="tab.key" :name="tab.key" :tab="tab.name">
          <span class="tab-name">{{ tab.name }}</span>
        </NTab>
      </NTabs>
    </div>
    <div class="contents">
      <Transition :name="transitionType">
        <KeepAlive>
          <AutoGameflow v-if="currentTab === 'auto-gameflow'" />
          <AutoSelect v-else-if="currentTab === 'auto-select'" />
          <AutoChampConfig v-else-if="currentTab === 'auto-champ-config'" />
          <AutoMisc v-else-if="currentTab === 'misc'" />
        </KeepAlive>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { AiStatus as AiStatusIcon } from '@vicons/carbon'
import { useTranslation } from 'i18next-vue'
import { NIcon, NTab, NTabs } from 'naive-ui'
import { computed, onActivated, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AutoChampConfig from './AutoChampConfig.vue'
import AutoGameflow from './AutoGameflow.vue'
import AutoMisc from './AutoMisc.vue'
import AutoSelect from './AutoSelect.vue'

/**
 * 此文件逻辑于 Toolkit.vue 完全相同，甚至属于是一个文件的两份复制
 * TODO: 合并此逻辑
 */

const { t } = useTranslation()

const currentTab = ref('auto-gameflow')

const tabs = computed(() => [
  {
    key: 'auto-gameflow',
    name: t('Automation.autoGameflow')
  },
  {
    key: 'auto-select',
    name: t('Automation.autoSelect')
  },
  {
    key: 'auto-champ-config',
    name: t('Automation.autoChampConfig')
  },
  {
    key: 'misc',
    name: t('Automation.autoMisc')
  }
])

const transitionType = ref<'move-from-right-fade' | 'move-from-left-fade'>('move-from-left-fade')
watch(
  () => currentTab.value,
  (cur, prev) => {
    if (!prev) {
      transitionType.value = 'move-from-right-fade'
      return
    }

    const curIndex = tabs.value.findIndex((tab) => tab.key === cur)
    const prevIndex = tabs.value.findIndex((tab) => tab.key === prev)

    if (curIndex > prevIndex) {
      transitionType.value = 'move-from-right-fade'
    } else {
      transitionType.value = 'move-from-left-fade'
    }
  },
  { immediate: true }
)

const route = useRoute()
const router = useRouter()

onActivated(() => {
  router.replace({ name: 'automation', params: { section: currentTab.value } })
})

watch(
  () => currentTab.value,
  (cur) => {
    router.replace({ name: 'automation', params: { section: cur } })
  },
  { immediate: true }
)

// route to section
watch(
  [() => route.name, () => route.params.section],
  ([name, section]) => {
    if (name !== 'automation' || !section) {
      return
    }

    currentTab.value = section as string
  },
  { immediate: true }
)
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
  }

  .contents {
    position: relative;
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

  .section-icon {
    font-size: 24px;
  }

  .session-label {
    font-size: 16px;
    font-weight: bold;
  }
}

[data-theme='dark'] {
  .automation-page {
    .sections {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  .section-icon-container {
    color: rgba(255, 255, 255, 0.8);
  }
}

[data-theme='light'] {
  .automation-page {
    .sections {
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
  }

  .section-icon-container {
    color: rgba(0, 0, 0, 0.8);
  }
}

.transition-single-root {
  height: 100%;
}
</style>
