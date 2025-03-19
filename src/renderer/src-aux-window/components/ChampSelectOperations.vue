<template>
  <NCard v-if="isCustomGame !== null" size="small">
    <NFlex align="center" v-if="aps.settings.isInKyokoMode && !isCustomGame" class="control-item">
      <span class="label" style="flex: 1">{{ t('ChampSelectOperations.dodge.label') }}</span>
      <NPopconfirm
        @positive-click="handleDodge"
        :positive-button-props="{ type: 'error', size: 'tiny' }"
        :negative-button-props="{ size: 'tiny' }"
        :negative-text="t('ChampSelectOperations.dodge.negativeText')"
        :positive-text="t('ChampSelectOperations.dodge.positiveText')"
      >
        <template #trigger>
          <NButton size="tiny" type="warning" secondary @click.right="handleDodge">
            {{ t('ChampSelectOperations.dodge.button') }}
          </NButton>
        </template>
        <span style="font-size: 12px">{{ t('ChampSelectOperations.dodge.popconfirm') }}</span>
      </NPopconfirm>
    </NFlex>
    <NFlex align="center" class="control-item" v-if="aps.settings.isInKyokoMode && !isCustomGame">
      <span class="label" style="flex: 1">{{ dodgeAtLastSecondLabelText }}</span>
      <NSwitch
        size="small"
        :value="agfs.willDodgeAtLastSecond"
        @update:value="(val) => agf.setWillDodgeAtLastSecond(val)"
      />
    </NFlex>
    <NFlex align="center" class="control-item" v-if="aps.settings.isInKyokoMode && !isCustomGame">
      <span class="label" style="flex: 1">{{
        t('ChampSelectOperations.dodgeAtLastSecond.label')
      }}</span>
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
      <span class="label" style="flex: 1">{{ t('ChampSelectOperations.autos.autoPick') }}</span>
      <NSwitch
        size="small"
        :value="as2.settings.normalModeEnabled"
        @update:value="(val) => as.setNormalModeEnabled(val)"
      />
    </NFlex>
    <NFlex align="center" v-if="!isBenchMode" class="control-item">
      <span class="label" style="flex: 1">{{ t('ChampSelectOperations.autos.autoBan') }}</span>
      <NSwitch
        size="small"
        :value="as2.settings.banEnabled"
        @update:value="(val) => as.setBanEnabled(val)"
      />
    </NFlex>
    <NFlex align="center" v-if="isBenchMode" class="control-item">
      <span class="label" style="flex: 1">{{ t('ChampSelectOperations.autos.autoGrab') }}</span>
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
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { AutoGameflowRenderer } from '@renderer-shared/shards/auto-gameflow'
import { useAutoGameflowStore } from '@renderer-shared/shards/auto-gameflow/store'
import { AutoSelectRenderer } from '@renderer-shared/shards/auto-select'
import { useAutoSelectStore } from '@renderer-shared/shards/auto-select/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { isBenchEnabledSession } from '@shared/types/league-client/champ-select'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NFlex, NInputNumber, NPopconfirm, NSwitch, useMessage } from 'naive-ui'
import { computed, watchEffect } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const as2 = useAutoSelectStore()
const agfs = useAutoGameflowStore()
const aps = useAppCommonStore()

const agf = useInstance(AutoGameflowRenderer)
const as = useInstance(AutoSelectRenderer)
const lc = useInstance(LeagueClientRenderer)

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
      return t('ChampSelectOperations.dodgeAtLastSecond.waitingForTiming')
    }

    return t('ChampSelectOperations.dodgeAtLastSecond.waiting', {
      seconds: countdownTime.value.toFixed(1)
    })
  }

  return t('ChampSelectOperations.dodgeAtLastSecond.text')
})

const message = useMessage()

let isShownWarning = false
watchEffect(() => {
  if (agfs.settings.dodgeAtLastSecondThreshold <= 1.5 && !isShownWarning) {
    isShownWarning = true
    message.warning(
      t('ChampSelectOperations.dodgeAtLastSecond.thresholdWarning', {
        seconds: agfs.settings.dodgeAtLastSecondThreshold
      })
    )
  }
})

/**
 * @deprecated
 * used to ban -3 (bravery)
 */
const _handleBan_3 = async () => {
  if (!lcs.champSelect.session) {
    return
  }

  try {
    const actions = lcs.champSelect.session.actions.flat()

    const thatAction = actions.find((action) => {
      return (
        action.actorCellId === lcs.champSelect.session?.localPlayerCellId &&
        action.type === 'ban' &&
        action.completed === false
      )
    })

    if (!thatAction) {
      message.error('No ban action found')
      return
    }

    await lc.api.champSelect.pickOrBan(-3, true, 'ban', thatAction.id)
  } catch (error: any) {
    console.error(error)
    message.error(error.message)
  }
}
</script>

<style scoped lang="less">
.label {
  font-size: 12px;
  color: rgb(178, 178, 178);
}

.control-item {
  height: 24px;

  &:not(:last-child) {
    margin-bottom: 2px;
  }
}
</style>
