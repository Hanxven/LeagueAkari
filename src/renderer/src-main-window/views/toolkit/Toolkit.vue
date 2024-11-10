<template>
  <div class="automation-page">
    <div class="sections">
      <div class="section-icon-container">
        <NIcon class="section-icon"><AppSwitcherIcon /></NIcon>
        <span class="session-label">工具集</span>
      </div>
      <NTabs
        v-model:value="currentTab"
        :theme-overrides="{ tabGapMediumBar: '18px' }"
        size="medium"
      >
        <NTab name="client">
          <span class="tab-name">客户端 / 游戏端</span>
        </NTab>
        <NTab name="in-process" class="tab-name">
          <span class="tab-name">过程中</span>
        </NTab>
        <NTab name="lobby" class="tab-name">
          <span class="tab-name">房间工具</span>
        </NTab>
        <NTab name="misc" class="tab-name">
          <span class="tab-name">百宝箱</span>
        </NTab>
      </NTabs>
    </div>
    <div class="contents">
      <Transition name="move-fade">
        <KeepAlive>
          <Client v-if="currentTab === 'client'" />
          <InProcess v-else-if="currentTab === 'in-process'" />
          <Lobby v-else-if="currentTab === 'lobby'" />
          <Misc v-else-if="currentTab === 'misc'" />
        </KeepAlive>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { AppSwitcher as AppSwitcherIcon } from '@vicons/carbon'
import { NIcon, NTab, NTabs } from 'naive-ui'
import { ref } from 'vue'

import Client from './client/Client.vue'
import InProcess from './in-process/InProcess.vue'
import Lobby from './lobby/Lobby.vue'
import Misc from './misc/Misc.vue'

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
