<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <TemplateEdit />
        <NCard size="small" style="margin-top: 8px">
          <template #header>
            <span class="card-header-title">{{ t('InGameSend.settings.title') }}</span>
          </template>
          <ControlItem
            :label-width="260"
            :disabled="!as.isAdministrator"
            class="control-item-margin"
            :label="t('InGameSend.settings.cancelShortcut.label')"
            :label-description="t('InGameSend.settings.cancelShortcut.description')"
          >
            <ShortcutSelector
              :disabled="!as.isAdministrator"
              :target-id="InGameSendRenderer.SHORTCUT_ID_SEND_ALLY"
              :shortcut-id="igs.settings.cancelShortcut"
              @update:shortcut-id="(id) => ig.setCancelShortcut(id)"
            />
          </ControlItem>
          <ControlItem
            :label-width="260"
            class="control-item-margin"
            :label="t('InGameSend.settings.sendInterval.label')"
            :label-description="t('InGameSend.settings.sendInterval.description')"
          >
            <NInputNumber
              @update:value="(val) => ig.setSendInterval(val || 65)"
              :value="igs.settings.sendInterval"
              size="small"
              :disabled="!as.isAdministrator"
              :min="10"
              :max="3500"
              :step="15"
              style="width: 120px"
              secondary
              type="warning"
            ></NInputNumber>
          </ControlItem>
        </NCard>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import { useInGameSendStore } from '@renderer-shared/shards/in-game-send/store'
import { useTranslation } from 'i18next-vue'
import { NCard, NInputNumber, NScrollbar, useDialog } from 'naive-ui'
import { reactive, ref, watch, watchEffect } from 'vue'

import ShortcutSelector from '@main-window/components/ShortcutSelector.vue'

import TemplateEdit from './TemplateEdit.vue'

const { t } = useTranslation()

const as = useAppCommonStore()
const igs = useInGameSendStore()

const ig = useInstance(InGameSendRenderer)

const currentCustomSendTab = ref('')

const tempMessageInput: Record<string, string> = reactive({})
const tempNameInput: Record<string, string> = reactive({})

watchEffect(() => {
  // 永远保证有一个 tab 是打开的
  const currentTab = igs.settings.customSend.findIndex((s) => s.id === currentCustomSendTab.value)
  if (currentTab === -1 && igs.settings.customSend.length) {
    currentCustomSendTab.value = igs.settings.customSend[0].id
  }
})

watch(
  () => igs.settings.customSend,
  (list) => {
    for (const item of list) {
      tempNameInput[item.id] = item.name
      tempMessageInput[item.id] = item.message
    }
  },
  { immediate: true }
)

const lastSendCustomTemplateError = ref<{
  reason: string
} | null>()

ig.onSendCustomTemplateError((message) => {
  lastSendCustomTemplateError.value = {
    reason: message
  }
})

ig.onSendCustomTemplateSuccess(() => {
  lastSendCustomTemplateError.value = null
})
</script>

<style lang="less" scoped>
@import '../toolkit-styles.less';

.padding {
  padding: 8px 12px;
}

.addable-tab {
  font-size: 13px;

  .empty {
    filter: opacity(0.8);
  }
}

.empty-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  padding: 16px;
  border-radius: 4px;
}

[data-theme='dark'] {
  .empty-placeholder {
    color: #fff8;
    background-color: #ffffff05;
  }
}

[data-theme='light'] {
  .empty-placeholder {
    color: #0008;
    background-color: #00000005;
  }
}
</style>
