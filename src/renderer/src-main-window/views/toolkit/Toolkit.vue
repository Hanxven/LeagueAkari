<template>
  <div class="automation-page">
    <div class="sections">
      <div class="section-icon-container">
        <NIcon class="section-icon"><ToolkitIcon /></NIcon>
        <span class="session-label">{{ t('Toolkit.title') }}</span>
      </div>
      <NTabs
        v-model:value="currentTab"
        :theme-overrides="{ tabGapMediumBar: '18px' }"
        size="medium"
      >
        <NTab name="client">
          <span class="tab-name">{{ t('Toolkit.client') }}</span>
        </NTab>
        <NTab name="in-game-send" class="tab-name">
          <span class="tab-name">{{ t('Toolkit.in-game-send') }}</span>
        </NTab>
        <NTab name="in-process" class="tab-name">
          <span class="tab-name">{{ t('Toolkit.in-process') }}</span>
        </NTab>
        <NTab name="lobby" class="tab-name">
          <span class="tab-name">{{ t('Toolkit.lobby') }}</span>
        </NTab>
        <NTab name="misc" class="tab-name">
          <span class="tab-name">{{ t('Toolkit.misc') }}</span>
        </NTab>
      </NTabs>
    </div>
    <div class="contents">
      <Transition name="move-fade">
        <KeepAlive>
          <Client v-if="currentTab === 'client'" />
          <InGameSend v-else-if="currentTab === 'in-game-send'" />
          <InProcess v-else-if="currentTab === 'in-process'" />
          <Lobby v-else-if="currentTab === 'lobby'" />
          <Misc v-else-if="currentTab === 'misc'" />
        </KeepAlive>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ToolKit as ToolkitIcon } from '@vicons/carbon'
import { useTranslation } from 'i18next-vue'
import { NIcon, NTab, NTabs } from 'naive-ui'
import { ref } from 'vue'

import Client from './client/Client.vue'
import InGameSend from './in-game-send/InGameSend.vue'
import InProcess from './in-process/InProcess.vue'
import Lobby from './lobby/Lobby.vue'
import Misc from './misc/Misc.vue'

const { t } = useTranslation()

const currentTab = ref('client')
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
</style>
