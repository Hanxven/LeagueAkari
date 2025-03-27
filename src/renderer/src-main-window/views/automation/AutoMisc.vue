<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <NCard size="small">
          <template #header>
            <span class="card-header-title">{{ t('AutoMisc.autoReply.title') }}</span>
          </template>
          <ControlItem
            :label="t('AutoMisc.autoReply.enabled.label')"
            class="control-item-margin"
            :label-width="260"
          >
            <NSwitch
              @update:value="(v) => arm.setEnabled(v)"
              :value="ar.settings.enabled"
              size="small"
            ></NSwitch>
          </ControlItem>
          <ControlItem
            :label="t('AutoMisc.autoReply.enableOnAway.label')"
            class="control-item-margin"
            :label-description="t('AutoMisc.autoReply.enableOnAway.description')"
            :label-width="260"
          >
            <NSwitch
              @update:value="(v) => arm.setEnableOnAway(v)"
              :value="ar.settings.enableOnAway"
              size="small"
            ></NSwitch>
          </ControlItem>
          <ControlItem
            :label="t('AutoMisc.autoReply.text.label')"
            class="control-item-margin"
            :label-description="t('AutoMisc.autoReply.text.description')"
            :label-width="260"
          >
            <NInput
              :status="ar.settings.text.length === 0 && ar.settings.enabled ? 'warning' : 'success'"
              style="max-width: 360px; width: 360px"
              v-model:value="tempText"
              @blur="handleSaveText"
              :autosize="{
                minRows: 2,
                maxRows: 4
              }"
              type="textarea"
              size="small"
            ></NInput>
          </ControlItem>
        </NCard>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoReplyRenderer } from '@renderer-shared/shards/auto-reply'
import { useAutoReplyStore } from '@renderer-shared/shards/auto-reply/store'
import { useTranslation } from 'i18next-vue'
import { NCard, NInput, NScrollbar, NSwitch, useMessage } from 'naive-ui'
import { ref, watchEffect } from 'vue'

const { t } = useTranslation()

const ar = useAutoReplyStore()
const arm = useInstance(AutoReplyRenderer)

const message = useMessage()
const tempText = ref('')

const handleSaveText = async () => {
  await arm.setText(tempText.value)
  message.success(() => t('AutoMisc.autoReply.updated'))
}

watchEffect(() => {
  tempText.value = ar.settings.text
})
</script>

<style lang="less" scoped>
@import './automation-styles.less';
</style>
