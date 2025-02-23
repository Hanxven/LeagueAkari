<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <NCard size="small">
          <template #header>
            <span class="card-header-title">{{
              as.isAdministrator
                ? t('InGameSend.sendStats.title')
                : t('InGameSend.sendStats.titleRequireAdmin')
            }}</span>
          </template>
          <ControlItem
            :disabled="!as.isAdministrator"
            :label-width="260"
            class="control-item-margin"
            :label="t('InGameSend.sendStats.enabled.label')"
            :label-description="t('InGameSend.sendStats.enabled.description')"
          >
            <NSwitch
              @update:value="(val) => ig.setSendStatsEnabled(val)"
              :value="igs.settings.sendStatsEnabled"
              size="small"
              :disabled="!as.isAdministrator"
              secondary
              type="warning"
            ></NSwitch>
          </ControlItem>
          <ControlItem
            :disabled="!as.isAdministrator"
            :label-width="260"
            class="control-item-margin"
            :label="t('InGameSend.sendStats.sendAllyShortcut.label')"
            :label-description="t('InGameSend.sendStats.sendAllyShortcut.description')"
          >
            <ShortcutSelector
              :disabled="!as.isAdministrator"
              :target-id="InGameSendRenderer.SHORTCUT_ID_SEND_ALLY"
              :shortcut-id="igs.settings.sendAllyShortcut"
              @update:shortcut-id="
                (id) => ig.setSendAllyShortcut(id! /* language-tools 1e84c6a  */)
              "
            />
          </ControlItem>
          <ControlItem
            :disabled="!as.isAdministrator"
            :label-width="260"
            class="control-item-margin"
            :label="t('InGameSend.sendStats.sendEnemyShortcut.label')"
            :label-description="t('InGameSend.sendStats.sendEnemyShortcut.description')"
          >
            <ShortcutSelector
              :disabled="!as.isAdministrator"
              :target-id="InGameSendRenderer.SHORTCUT_ID_SEND_ENEMY"
              :shortcut-id="igs.settings.sendEnemyShortcut"
              @update:shortcut-id="
                (id) => ig.setSendEnemyShortcut(id! /* language-tools 1e84c6a  */)
              "
            />
          </ControlItem>
          <ControlItem
            :disabled="!as.isAdministrator"
            :label-width="260"
            class="control-item-margin"
            :label="t('InGameSend.sendStats.sendAllAlliesShortcut.label')"
            :label-description="t('InGameSend.sendStats.sendAllAlliesShortcut.description')"
          >
            <ShortcutSelector
              :disabled="!as.isAdministrator"
              :target-id="InGameSendRenderer.SHORTCUT_ID_SEND_ALL_ALLIES"
              :shortcut-id="igs.settings.sendAllAlliesShortcut"
              @update:shortcut-id="
                (id) => ig.setSendAllAlliesShortcut(id! /* language-tools 1e84c6a  */)
              "
            />
          </ControlItem>
          <ControlItem
            :disabled="!as.isAdministrator"
            :label-width="260"
            class="control-item-margin"
            :label="t('InGameSend.sendStats.sendAllEnemiesShortcut.label')"
            :label-description="t('InGameSend.sendStats.sendAllEnemiesShortcut.description')"
          >
            <ShortcutSelector
              :disabled="!as.isAdministrator"
              :target-id="InGameSendRenderer.SHORTCUT_ID_SEND_ALL_ENEMIES"
              :shortcut-id="igs.settings.sendAllEnemiesShortcut"
              @update:shortcut-id="
                (id) => ig.setSendAllEnemiesShortcut(id! /* language-tools 1e84c6a  */)
              "
            />
          </ControlItem>
          <ControlItem
            :disabled="!as.isAdministrator"
            :label-width="260"
            class="control-item-margin"
            :label="t('InGameSend.sendStats.sendStatsUseDefaultTemplate.label')"
            :label-description="t('InGameSend.sendStats.sendStatsUseDefaultTemplate.description')"
          >
            <NSwitch
              @update:value="(val) => ig.setSendStatsUseDefaultTemplate(val)"
              :value="igs.settings.sendStatsUseDefaultTemplate"
              size="small"
              :disabled="!as.isAdministrator"
              secondary
              type="warning"
            ></NSwitch>
          </ControlItem>
          <ControlItem
            :disabled="!as.isAdministrator"
            :label-width="260"
            class="control-item-margin"
            :label="t('InGameSend.sendStats.sendStatsTemplate.label')"
            v-show="!igs.settings.sendStatsUseDefaultTemplate"
          >
            <template #labelDescription>
              <div>{{ t('InGameSend.sendStats.sendStatsTemplate.description') }}</div>
              <div style="font-weight: bold">
                {{ t('InGameSend.sendStats.sendStatsTemplate.descriptionDanger') }}
              </div>
              <div
                style="margin-top: 8px"
                v-html="
                  t('InGameSend.sendStats.sendStatsTemplate.descriptionReferTo', {
                    url: 'https://hanxven.github.io/LeagueAkari/in-game-send-templates.html'
                  })
                "
              ></div>
            </template>
            <div>
              <NAlert
                style="width: 420px"
                v-if="lastSendCustomTemplateError"
                type="error"
                closable
                :title="t('InGameSend.errorSendStatsUseCustomTemplateTitle')"
              >
                {{ lastSendCustomTemplateError?.reason }}
              </NAlert>
              <NInput
                :disabled="!as.isAdministrator"
                :placeholder="t('InGameSend.sendStats.sendStatsTemplate.inputPlaceholder')"
                v-model:value="tempTemplateInput"
                ref="use-template-input"
                style="margin-top: 4px; width: 420px; font-family: monospace; font-size: 12px"
                size="small"
                :status="igs.settings.sendStatsTemplate.isValid ? 'success' : 'warning'"
                type="textarea"
                :autosize="{ minRows: 5, maxRows: 20 }"
              />
              <div style="margin-top: 4px; display: flex; gap: 4px">
                <NButton
                  :disabled="!as.isAdministrator"
                  size="tiny"
                  @click="tempTemplateInput = igs.settings.sendStatsTemplate.template"
                  >{{ t('InGameSend.sendStats.sendStatsTemplate.cancelButton') }}</NButton
                >
                <NButton
                  :disabled="!as.isAdministrator"
                  size="tiny"
                  type="primary"
                  @click="handleSaveTemplate(tempTemplateInput)"
                  >{{ t('InGameSend.sendStats.sendStatsTemplate.submitButton') }}</NButton
                >
              </div>
            </div>
          </ControlItem>
          <ControlItem
            :disabled="!as.isAdministrator"
            :label-width="260"
            class="control-item-margin"
            :label="t('InGameSend.sendStats.dryRun.label')"
            :label-description="t('InGameSend.sendStats.dryRun.description')"
          >
            <div style="display: flex; gap: 4px">
              <NButton
                :disabled="!as.isAdministrator"
                size="tiny"
                @click="handleDryRun('all')"
                secondary
                >{{ t('InGameSend.sendStats.dryRun.button') }}</NButton
              >
              <NButton
                :disabled="!as.isAdministrator"
                size="tiny"
                @click="handleDryRun('ally')"
                secondary
                >{{ t('InGameSend.sendStats.dryRun.buttonAllies') }}</NButton
              >
              <NButton
                :disabled="!as.isAdministrator"
                size="tiny"
                @click="handleDryRun('enemy')"
                secondary
                >{{ t('InGameSend.sendStats.dryRun.buttonEnemies') }}</NButton
              >
            </div>
          </ControlItem>
        </NCard>
        <NCard size="small" style="margin-top: 8px">
          <template #header>
            <span class="card-header-title">{{
              as.isAdministrator
                ? t('InGameSend.customSend.title')
                : t('InGameSend.customSend.titleRequireAdmin')
            }}</span>
          </template>
          <NTabs
            v-if="igs.settings.customSend.length"
            size="small"
            v-model:value="currentCustomSendTab"
            :addable="igs.settings.customSend.length < 50"
            type="card"
            @add="handleAddCustomSend"
            placement="left"
            style="max-height: 1000px"
          >
            <NTabPane
              display-directive="show"
              v-for="s of igs.settings.customSend"
              :key="s.id"
              :name="s.id"
              :tab="s.name"
            >
              <template #tab>
                <div class="addable-tab">
                  <NEllipsis v-if="s.name" style="width: 96px">{{ s.name }}</NEllipsis>
                  <div v-else class="empty">{{ t('InGameSend.customSend.unnamed') }}</div>
                </div>
              </template>
              <div class="padding">
                <ControlItem
                  :label-width="120"
                  class="control-item-margin"
                  :disabled="!as.isAdministrator"
                  :label="t('InGameSend.customSend.enabled')"
                >
                  <NSwitch
                    @update:value="(val) => ig.updateCustomSend(s.id, { enabled: val })"
                    :value="s.enabled"
                    size="small"
                    :disabled="!as.isAdministrator"
                    secondary
                    type="warning"
                  ></NSwitch>
                </ControlItem>
                <ControlItem
                  :label-width="120"
                  :disabled="!as.isAdministrator"
                  class="control-item-margin"
                  :label="t('InGameSend.customSend.name')"
                >
                  <NInput
                    :disabled="!as.isAdministrator"
                    :placeholder="t('InGameSend.customSend.name')"
                    v-model:value="tempNameInput[s.id]"
                    @blur="() => handleSaveName(s.id, tempNameInput[s.id])"
                    style="width: 420px"
                    size="small"
                  ></NInput>
                </ControlItem>
                <ControlItem
                  :label-width="120"
                  :disabled="!as.isAdministrator"
                  class="control-item-margin"
                  :label="t('InGameSend.customSend.shortcut')"
                >
                  <ShortcutSelector
                    :disabled="!as.isAdministrator"
                    :target-id="ig.shortcutTargetId(s.id)"
                    :shortcut-id="s.shortcut"
                    @update:shortcut-id="(id) => ig.updateCustomSend(s.id, { shortcut: id })"
                  />
                </ControlItem>
                <ControlItem
                  :disabled="!as.isAdministrator"
                  :label-width="120"
                  class="control-item-margin"
                  :label="t('InGameSend.customSend.message')"
                >
                  <NInput
                    :placeholder="t('InGameSend.customSend.message')"
                    v-model:value="tempMessageInput[s.id]"
                    @blur="() => handleSaveMessage(s.id, tempMessageInput[s.id])"
                    style="width: 420px; font-family: monospace"
                    size="small"
                    :disabled="!as.isAdministrator"
                    type="textarea"
                    :autosize="{ minRows: 5, maxRows: 5 }"
                  ></NInput>
                </ControlItem>
                <ControlItem
                  :disabled="!as.isAdministrator"
                  :label-width="120"
                  class="control-item-margin"
                  :label="t('InGameSend.customSend.delete.label')"
                >
                  <NPopconfirm
                    :positive-button-props="{ type: 'error' }"
                    @positive-click="() => ig.deleteCustomSend(s.id)"
                  >
                    <template #trigger>
                      <NButton type="error" size="tiny">{{
                        t('InGameSend.customSend.delete.button')
                      }}</NButton>
                    </template>
                    {{ t('InGameSend.customSend.delete.popconfirm') }}
                  </NPopconfirm>
                </ControlItem>
              </div>
            </NTabPane>
          </NTabs>
          <div v-else class="empty-placeholder">
            <span>{{ t('InGameSend.customSend.emptyPlaceholder') }}</span>
            <NButton type="primary" size="small" @click="handleAddCustomSend">{{
              t('InGameSend.customSend.buttonAdd')
            }}</NButton>
          </div>
        </NCard>
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
              @update:shortcut-id="(id) => ig.setCancelShortcut(id! /* language-tools 1e84c6a  */)"
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
import {
  NAlert,
  NButton,
  NCard,
  NEllipsis,
  NInput,
  NInputNumber,
  NPopconfirm,
  NScrollbar,
  NSwitch,
  NTabPane,
  NTabs,
  useDialog,
  useMessage
} from 'naive-ui'
import { h, reactive, ref, useTemplateRef, watch, watchEffect } from 'vue'

import ShortcutSelector from '@main-window/components/ShortcutSelector.vue'

const { t } = useTranslation()

const as = useAppCommonStore()
const igs = useInGameSendStore()

const ig = useInstance<InGameSendRenderer>('in-game-send-renderer')

const dialog = useDialog()

const currentCustomSendTab = ref('')

const tempMessageInput: Record<string, string> = reactive({})
const tempNameInput: Record<string, string> = reactive({})

const tempTemplateInput = ref('')

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

watch(
  () => igs.settings.sendStatsTemplate,
  (template) => {
    tempTemplateInput.value = template.template
  },
  { immediate: true }
)

const handleAddCustomSend = async () => {
  const added = await ig.createCustomSend(t('InGameSend.customSend.newItem'))
  currentCustomSendTab.value = added.id
}

const message = useMessage()

const handleSaveName = async (id: string, name: string) => {
  await ig.updateCustomSend(id, { name })
  message.success(t('InGameSend.saved'))
}

const handleSaveMessage = async (id: string, text: string) => {
  await ig.updateCustomSend(id, { message: text })
  message.success(t('InGameSend.saved'))
}

const inputEl = useTemplateRef('use-template-input')

const handleSaveTemplate = async (template: string) => {
  const { isValid } = await ig.updateSendStatsTemplate(template)

  if (isValid) {
    message.success(t('InGameSend.compiled'))
  } else {
    message.error(t('InGameSend.invalidTemplate'))
  }

  inputEl.value?.blur()
}

const handleDryRun = async (target: string) => {
  const { data, error, reason, extra } = await ig.dryRunStatsSend(target)
  if (error) {
    switch (reason) {
      case 'not-compiled':
        message.error(t('InGameSend.not-compiled'))
        break
      case 'stage-unavailable':
        message.error(t('InGameSend.stage-unavailable'))
        break
      case 'execution-error':
        message.error(`${t('InGameSend.execution-error')}: ${extra}`)
        break
      default:
        message.error(t('InGameSend.error'))
        break
    }
  } else {
    dialog.info({
      title: 'Dry Run',
      content: () =>
        h(
          'div',
          { style: { 'user-select': 'text' } },
          data.map((line) => h('div', line))
        ),
      positiveText: t('InGameSend.confirm')
    })
  }
}

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

watch(
  () => igs.settings.sendStatsUseDefaultTemplate,
  () => {
    if (igs.settings.sendStatsUseDefaultTemplate) {
      lastSendCustomTemplateError.value = null
    }
  }
)
</script>

<style lang="less" scoped>
.outer-wrapper {
  position: relative;
  height: 100%;
  max-width: 100%;
}

.inner-wrapper {
  padding: 24px;
  margin: 0 auto;
  max-width: 800px;

  :deep(.n-card) {
    background-color: transparent;
  }
}

.single-root {
  height: 100%;
}

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
