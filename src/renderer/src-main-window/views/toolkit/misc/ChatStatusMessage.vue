<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ t('ChatStatusMessage.title') }}</span>
    </template>
    <ControlItem
      :label="t('ChatStatusMessage.message.label')"
      class="control-item-margin"
      :label-width="260"
    >
      <NButton
        :loading="isSetting"
        @click="handleSetChatStatusMessage"
        type="primary"
        size="small"
        :disabled="lcs.connectionState !== 'connected'"
        >{{ t('ChatStatusMessage.message.button') }}</NButton
      >
    </ControlItem>
    <ControlItem
      :label="t('ChatStatusMessage.text.label')"
      class="control-item-margin"
      :label-description="t('ChatStatusMessage.text.description')"
      :label-width="260"
    >
      <NInput
        style="width: 360px; font-family: monospace"
        type="textarea"
        v-model:value="text"
        :autosize="{ maxRows: 3, minRows: 1 }"
        :placeholder="t('ChatStatusMessage.text.placeholder')"
        size="small"
      ></NInput>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NInput, useMessage } from 'naive-ui'
import { ref } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const lc = useInstance(LeagueClientRenderer)

const text = ref('')
const isSetting = ref(false)
const message = useMessage()

const handleSetChatStatusMessage = async () => {
  if (isSetting.value) {
    return
  }

  try {
    isSetting.value = true
    await lc.api.chat.setChatStatusMessage(text.value)
    message.success(t('ChatStatusMessage.message.success'))
  } catch (error) {
    console.warn(error)
    message.warning(
      t('ChatStatusMessage.message.failedNotification.description', {
        reason: (error as Error).message
      })
    )
  } finally {
    isSetting.value = false
  }
}
</script>

<style lang="less" scoped></style>
