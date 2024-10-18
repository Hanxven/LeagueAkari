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
        :value="agfs.willDodgeAtLastSecond"
        @update:value="(val) => agf.setWillDodgeAtLastSecond(val)"
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
        :value="agfs.settings.dodgeAtLastSecondThreshold"
        @update:value="(val) => agf.setDodgeAtLastSecondThreshold(val || 2)"
      />
    </NFlex>
    <NFlex align="center" v-if="!isBenchMode" class="control-item">
      <span class="label" style="flex: 1">自动选择</span>
      <NSwitch
        size="small"
        :value="as2.settings.normalModeEnabled"
        @update:value="(val) => as.setNormalModeEnabled(val)"
      />
    </NFlex>
    <NFlex align="center" v-if="!isBenchMode" class="control-item">
      <span class="label" style="flex: 1">自动禁用</span>
      <NSwitch
        size="small"
        :value="as2.settings.banEnabled"
        @update:value="(val) => as.setBanEnabled(val)"
      />
    </NFlex>
    <NFlex align="center" v-if="isBenchMode" class="control-item">
      <span class="label" style="flex: 1">自动选择</span>
      <NSwitch
        size="small"
        :value="as2.settings.benchModeEnabled"
        @update:value="(val) => as.setBenchModeEnabled(val)"
      />
    </NFlex>
  </NCard>
</template>

<script setup lang="ts">
import { useCountdownSeconds } from '@renderer-shared/compositions/useCountdown'
import { useInstance } from '@renderer-shared/shards'
import { AutoGameflowRenderer } from '@renderer-shared/shards/auto-gameflow'
import { useAutoGameflowStore } from '@renderer-shared/shards/auto-gameflow/store'
import { AutoSelectRenderer } from '@renderer-shared/shards/auto-select'
import { useAutoSelectStore } from '@renderer-shared/shards/auto-select/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { isBenchEnabledSession } from '@shared/types/league-client/champ-select'
import { NButton, NCard, NFlex, NInputNumber, NPopconfirm, NSwitch, useMessage } from 'naive-ui'
import { computed, watchEffect } from 'vue'

const lcs = useLeagueClientStore()
const as2 = useAutoSelectStore()
const agfs = useAutoGameflowStore()

const agf = useInstance<AutoGameflowRenderer>('auto-gameflow-renderer')
const as = useInstance<AutoSelectRenderer>('auto-select-renderer')
const lc = useInstance<LeagueClientRenderer>('league-client-renderer')

const isBenchMode = computed(() => isBenchEnabledSession(lcs.champSelect.session))

const isCustomGame = computed(() => {
  if (!lcs.gameflow.session) {
    return null
  }

  return lcs.gameflow.session.gameData.isCustomGame
})

const handleDodge = async () => {
  try {
    await lc.api.login.dodge()
  } catch (error) {}
}

const { countdownTime } = useCountdownSeconds(
  () => agfs.willDodgeAtLastSecond,
  () => agfs.willDodgeAt
)

const dodgeAtLastSecondLabelText = computed(() => {
  if (agfs.willDodgeAtLastSecond) {
    if (agfs.willDodgeAt < 0) {
      return `最后一秒秒退 (等待时机)`
    }

    return `最后一秒秒退 (${countdownTime.value.toFixed(1)} s)`
  }

  return '最后一秒秒退'
})

const message = useMessage()

let isShownWarning = false
watchEffect(() => {
  if (agfs.settings.dodgeAtLastSecondThreshold <= 1.5 && !isShownWarning) {
    isShownWarning = true
    message.warning(
      `过低的阈值 (${agfs.settings.dodgeAtLastSecondThreshold.toFixed(1)} s) 可能会导致秒退失败`
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
