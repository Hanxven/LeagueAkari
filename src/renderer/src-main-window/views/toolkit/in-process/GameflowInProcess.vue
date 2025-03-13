<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">
        {{ t('GameflowInProgress.title') }}
      </span>
    </template>
    <ControlItem
      v-if="as.settings.isInKyokoMode"
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
    </ControlItem>
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
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, useNotification } from 'naive-ui'
import { computed } from 'vue'

const { t } = useTranslation()

const as = useAppCommonStore()
const lcs = useLeagueClientStore()
const lc = useInstance(LeagueClientRenderer)

const notification = useNotification()

const handleDodge = async () => {
  try {
    await lc.api.login.dodge()
  } catch (error) {
    notification.warning({
      title: () => t('GameflowInProgress.dodge.failedNotification.title'),
      content: () =>
        t('GameflowInProgress.dodge.failedNotification.description', {
          reason: (error as Error).message
        })
    })
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
    notification.warning({
      title: () => t('GameflowInProgress.playAgain.failedNotification.title'),
      content: () =>
        t('GameflowInProgress.playAgain.failedNotification.description', {
          reason: (error as Error).message
        })
    })
  }
}
</script>

<style lang="less" scoped></style>
