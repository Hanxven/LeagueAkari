<template>
  <NCard v-if="isCustomGame !== null" size="small">
    <NFlex align="center" v-if="!isCustomGame" class="control-item">
      <span class="label" style="flex: 1">退出英雄选择</span>
      <NPopconfirm
        @positive-click="handleDodge"
        :positive-button-props="{ type: 'error', size: 'tiny' }"
        :negative-button-props="{ size: 'tiny' }"
        negative-text="取消"
        positive-text="退出"
      >
        <template #trigger>
          <NButton size="tiny" type="warning" secondary style="font-size: 10px">立即秒退</NButton>
        </template>
        <span style="font-size: 12px">这将退出英雄选择阶段</span>
      </NPopconfirm>
    </NFlex>
    <NFlex align="center" class="control-item" v-if="!isCustomGame">
      <span class="label" style="flex: 1">{{ dodgeAtLastSecondLabelText }}</span>
      <NSwitch
        size="small"
        :value="agf.willDodgeAtLastSecond"
        @update:value="(val) => agfm.setDodgeAtLastSecond(val)"
      />
    </NFlex>
    <NFlex align="center" class="control-item" v-if="!isCustomGame">
      <span class="label" style="flex: 1">最后一秒秒退阈值</span>
      <NInputNumber
        size="tiny"
        :min="0"
        :max="10"
        :step="0.1"
        style="width: 80px"
        :value="agf.settings.dodgeAtLastSecondThreshold"
        @update:value="(val) => agfm.setDodgeAtLastSecondThreshold(val || 2)"
      />
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
import { useCountdownSeconds } from '@renderer-shared/compositions/useCountdown'
import { dodge } from '@renderer-shared/http-api/login'
import { autoGameflowRendererModule as agfm } from '@renderer-shared/modules/auto-gameflow'
import { useAutoGameflowStore } from '@renderer-shared/modules/auto-gameflow/store'
import { autoSelectRendererModule as asm } from '@renderer-shared/modules/auto-select'
import { useAutoSelectStore } from '@renderer-shared/modules/auto-select/store'
import { useChampSelectStore } from '@renderer-shared/modules/lcu-state-sync/champ-select'
import { useGameflowStore } from '@renderer-shared/modules/lcu-state-sync/gameflow'
import { isBenchEnabledSession } from '@shared/types/lcu/champ-select'
import { NButton, NCard, NFlex, NInputNumber, NPopconfirm, NSwitch, useMessage } from 'naive-ui'
import { computed, watchEffect } from 'vue'

const gameflow = useGameflowStore()
const as = useAutoSelectStore()
const cs = useChampSelectStore()
const agf = useAutoGameflowStore()

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

const { countdownTime } = useCountdownSeconds(
  () => agf.willDodgeAtLastSecond,
  () => agf.willDodgeAt
)

const dodgeAtLastSecondLabelText = computed(() => {
  if (agf.willDodgeAtLastSecond) {
    if (agf.willDodgeAt < 0) {
      return `最后一秒秒退 (等待时机)`
    }

    return `最后一秒秒退 (${countdownTime.value.toFixed(1)} s)`
  }

  return '最后一秒秒退'
})

const message = useMessage()

let isShownWarning = false
watchEffect(() => {
  if (agf.settings.dodgeAtLastSecondThreshold <= 1.5 && !isShownWarning) {
    isShownWarning = true
    message.warning(
      `过低的阈值 (${agf.settings.dodgeAtLastSecondThreshold.toFixed(1)} s) 可能会导致秒退失败`
    )
  }
})
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
