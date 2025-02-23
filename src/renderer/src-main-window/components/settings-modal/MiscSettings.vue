<template>
  <NScrollbar style="height: 65vh">
    <NCard size="small">
      <template #header>
        <span class="card-header-title">{{ t('MiscSettings.respawnTimer.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('MiscSettings.respawnTimer.enabled.label')"
        :label-description="t('MiscSettings.respawnTimer.enabled.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="rts.settings.enabled"
          @update:value="(val) => rt.setEnabled(val)"
        />
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { RespawnTimerRenderer } from '@renderer-shared/shards/respawn-timer'
import { useRespawnTimerStore } from '@renderer-shared/shards/respawn-timer/store'
import { useTranslation } from 'i18next-vue'
import { NCard, NScrollbar, NSwitch } from 'naive-ui'

const { t } = useTranslation()

const rts = useRespawnTimerStore()
const rt = useInstance<RespawnTimerRenderer>('respawn-timer-renderer')
</script>

<style lang="less" scoped>
.card-header-title.disabled {
  color: rgba(255, 255, 255, 0.35);
}
</style>
