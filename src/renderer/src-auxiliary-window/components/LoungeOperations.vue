<template>
  <NCard size="small">
    <NFlex align="center" class="control-item">
      <span class="label" style="flex: 1"
        >自动接受 ({{
          isCustomGame ? '模式不适用' : formatDelayText(agf.settings.autoAcceptDelaySeconds)
        }})</span
      >
      <NSwitch
        size="small"
        :value="agf.settings.autoAcceptEnabled"
        @update:value="(val) => agfm.setAutoAcceptEnabled(val)"
      />
    </NFlex>
    <NFlex align="center" class="control-item">
      <span class="label" style="flex: 1"
        >自动匹配 ({{
          isCustomGame ? '模式不适用' : formatDelayText(agf.settings.autoSearchMatchDelaySeconds)
        }})</span
      >
      <NSwitch
        size="small"
        :value="agf.settings.autoSearchMatchEnabled"
        @update:value="(val) => agfm.setAutoSearchMatchEnabled(val)"
      />
    </NFlex>
  </NCard>
</template>

<script setup lang="ts">
import { autoGameflowRendererModule as agfm } from '@shared/renderer/modules/auto-gameflow'
import { useAutoGameflowStore } from '@shared/renderer/modules/auto-gameflow/store'
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync/gameflow'
import { NCard, NFlex, NSwitch } from 'naive-ui'
import { computed } from 'vue'

const agf = useAutoGameflowStore()
const gameflow = useGameflowStore()

const isCustomGame = computed(() => {
  if (!gameflow.session) {
    return null
  }

  return gameflow.session.gameData.isCustomGame
})

const formatDelayText = (d: number) => {
  if (d <= 0.05) {
    return `立即`
  }
  return `${d.toFixed(1)} s`
}
</script>

<style scoped lang="less">
.label {
  font-size: 10px;
  color: rgb(178, 178, 178);
}

.control-item {
  height: 24px;

  &:not(:last-child) {
    margin-bottom: 2px;
  }
}
</style>
@shared/renderer/modules/auto-gameflow@shared/renderer/modules/auto-gameflow/store@shared/renderer/modules/lcu-state-sync/gameflow