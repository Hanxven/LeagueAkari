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
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{ t('MiscSettings.streamerMode.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('MiscSettings.streamerMode.enabled.label')"
        :label-description="t('MiscSettings.streamerMode.enabled.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="as.settings.streamerMode"
          @update:value="(val) => a.setStreamerMode(val)"
        />
      </ControlItem>
      <NCollapseTransition :show="as.settings.streamerMode">
        <ControlItem
          class="control-item-margin"
          :label="t('MiscSettings.streamerMode.useAkariStyledName.label')"
          :label-description="t('MiscSettings.streamerMode.useAkariStyledName.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="as.settings.streamerModeUseAkariStyledName"
            @update:value="(val) => a.setStreamerModeUseAkariStyledName(val)"
          />
        </ControlItem>
      </NCollapseTransition>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { RespawnTimerRenderer } from '@renderer-shared/shards/respawn-timer'
import { useRespawnTimerStore } from '@renderer-shared/shards/respawn-timer/store'
import { useTranslation } from 'i18next-vue'
import { NCard, NCollapseTransition, NScrollbar, NSwitch } from 'naive-ui'

const { t } = useTranslation()

const a = useInstance(AppCommonRenderer)
const as = useAppCommonStore()
const rts = useRespawnTimerStore()
const rt = useInstance(RespawnTimerRenderer)
</script>

<style lang="less" scoped>
.card-header-title.disabled {
  color: rgba(255, 255, 255, 0.35);
}
</style>
