<template>
  <NCard size="small">
    <template #header
      ><span class="card-header-title">
        {{ t('GameflowInProgress.title') }}
      </span></template
    >
    <!-- <ControlItem
      class="control-item-margin"
      :label="t('GameflowInProgress.dodge.label')"
      :label-description="t('GameflowInProgress.dodge.description')"
      :label-width="260"
    >
      <NButton
        type="warning"
        :disabled="lcs.gameflow.phase !== 'ChampSelect'"
        @click="handleDodge"
        size="small"
        >{{ t('GameflowInProgress.dodge.button') }}</NButton
      >
    </ControlItem> -->
    <ControlItem
      class="control-item-margin"
      :label="t('GameflowInProgress.playAgain.label')"
      :label-description="t('GameflowInProgress.playAgain.description')"
      :label-width="260"
    >
      <NButton type="primary" :disabled="!isInEndgamePhase" @click="handlePlayAgain" size="small">{{
        t('GameflowInProgress.playAgain.button')
      }}</NButton>
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      :label="t('GameflowInProgress.leaveLobby.label')"
      :label-description="t('GameflowInProgress.leaveLobby.description')"
      :label-width="260"
    >
      <NButton
        :disabled="lcs.gameflow.phase !== 'Lobby'"
        @click="() => lc.api.lobby.deleteLobby()"
        size="small"
        >{{ t('GameflowInProgress.leaveLobby.button') }}</NButton
      >
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { laNotification } from '@renderer-shared/notification'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { NButton, NCard } from 'naive-ui'
import { computed } from 'vue'
import { useTranslation } from 'i18next-vue'


const { t } = useTranslation()

const lcs = useLeagueClientStore()
const lc = useInstance<LeagueClientRenderer>('league-client-renderer')

const handleDodge = async () => {
  try {
    await lc.api.login.dodge()
  } catch (error) {
    laNotification.warn(
      t('GameflowInProgress.dodge.failedNotification.title'),
      t('GameflowInProgress.dodge.failedNotification.description', {
        reason: (error as Error).message
      }),
      error
    )
  }
}

const isInEndgamePhase = computed(() => {
  return (
    lcs.gameflow.phase === 'WaitingForStats' ||
    lcs.gameflow.phase === 'PreEndOfGame' ||
    lcs.gameflow.phase === 'EndOfGame'
  )
})

const handlePlayAgain = async () => {
  try {
    await lc.api.lobby.playAgain()
  } catch (error) {
    laNotification.warn(
      t('GameflowInProgress.playAgain.failedNotification.title'),
      t('GameflowInProgress.playAgain.failedNotification.description', {
        reason: (error as Error).message
      }),
      error
    )
  }
}
</script>

<style lang="less" scoped>
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
