<template>
  <NCard v-if="isCustomGame !== null" size="small">
    <NFlex align="center" v-if="!isCustomGame" class="control-item">
      <span class="label" style="flex: 1">退出英雄选择</span>
      <NButton size="tiny" type="warning" secondary @click="handleDodge" style="font-size: 10px"
        >秒退</NButton
      >
    </NFlex>
    <NFlex align="center" v-if="!isBenchMode" class="control-item">
      <span class="label" style="flex: 1">自动选择</span>
      <NSwitch
        size="small"
        :value="as.settings.normalModeEnabled"
        @update:value="(val) => asm.setNormalModeEnabled(val)"
      />
    </NFlex>
    <NFlex align="center" v-if="!isBenchMode" class="control-item">
      <span class="label" style="flex: 1">自动禁用</span>
      <NSwitch
        size="small"
        :value="as.settings.banEnabled"
        @update:value="(val) => asm.setBanEnabled(val)"
      />
    </NFlex>
    <NFlex align="center" v-if="isBenchMode" class="control-item">
      <span class="label" style="flex: 1">自动选择</span>
      <NSwitch
        size="small"
        :value="as.settings.benchModeEnabled"
        @update:value="(val) => asm.setBenchModeEnabled(val)"
      />
    </NFlex>
  </NCard>
</template>

<script setup lang="ts">
import { dodge } from '@shared/renderer/http-api/login'
import { autoSelectRendererModule as asm } from '@shared/renderer/modules/auto-select'
import { useAutoSelectStore } from '@shared/renderer/modules/auto-select/store'
import { useChampSelectStore } from '@shared/renderer/modules/lcu-state-sync/champ-select'
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync/gameflow'
import { isBenchEnabledSession } from '@shared/types/lcu/champ-select'
import { NButton, NCard, NFlex, NSwitch } from 'naive-ui'
import { computed } from 'vue'

const gameflow = useGameflowStore()
const as = useAutoSelectStore()
const cs = useChampSelectStore()

const isBenchMode = computed(() => isBenchEnabledSession(cs.session))

const isCustomGame = computed(() => {
  if (!gameflow.session) {
    return null
  }

  return gameflow.session.gameData.isCustomGame
})

const handleDodge = async () => {
  try {
    await dodge()
  } catch (error) {}
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
@shared/renderer/modules/auto-select@shared/renderer/modules/auto-select/store@shared/renderer/modules/lcu-state-sync/champ-select@shared/renderer/modules/lcu-state-sync/gameflow