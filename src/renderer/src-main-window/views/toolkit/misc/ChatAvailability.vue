<template>
  <NCard size="small">
    <template #header
      ><span class="card-header-title">
        {{ t('ChatAvailability.title') }}
      </span></template
    >
    <ControlItem
      class="control-item-margin"
      :label="t('ChatAvailability.availability.label')"
      :label-description="t('ChatAvailability.availability.description')"
      :label-width="260"
    >
      <NRadioGroup
        size="small"
        :disabled="!lcs.chat.me"
        name="radio-group"
        :value="lcs.chat.me?.availability"
        @update:value="(a) => handleChangeAvailability(a)"
      >
        <NFlex :size="4">
          <NRadio value="chat">{{ t('ChatAvailability.availability.radio.chat') }}</NRadio>
          <NRadio value="mobile">{{ t('ChatAvailability.availability.radio.mobile') }}</NRadio>
          <NRadio value="away">{{ t('ChatAvailability.availability.radio.away') }}</NRadio>
          <NRadio value="offline">{{ t('ChatAvailability.availability.radio.offline') }}</NRadio>
          <NRadio value="dnd">{{ t('ChatAvailability.availability.radio.dnd') }}</NRadio>
          <NRadio value="spectating">{{ t('ChatAvailability.availability.radio.spectating') }}</NRadio>
          <NRadio value="online">{{ t('ChatAvailability.availability.radio.spectating') }}</NRadio>
        </NFlex>
      </NRadioGroup>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { laNotification } from '@renderer-shared/notification'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { AvailabilityType } from '@shared/http-api-axios-helper/league-client/chat'
import { NCard, NFlex, NRadio, NRadioGroup } from 'naive-ui'
import { useTranslation } from 'i18next-vue'


const { t } = useTranslation()

const lcs = useLeagueClientStore()
const lc = useInstance<LeagueClientRenderer>('league-client-renderer')

const handleChangeAvailability = async (availability: string) => {
  try {
    await lc.api.chat.changeAvailability(availability as AvailabilityType)
  } catch (error) {
    laNotification.warn(
      t('ChatAvailability.availability.failedNotification.title'),
      t('ChatAvailability.availability.failedNotification.description', {
        reason: (error as Error).message
      })
    )
  }
}
</script>

<style lang="less" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.control-item-margin {
  &:not(:last-child) {
    margin-bottom: 12px;
  }
}

.card-header-title {
  font-weight: bold;
  font-size: 18px;
}
</style>
