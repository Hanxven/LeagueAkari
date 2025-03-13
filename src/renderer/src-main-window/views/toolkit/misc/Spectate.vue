<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title"
        >{{ t('Spectate.title')
        }}<span v-if="lcs.gameflow.phase === 'Lobby'" style="color: yellow; font-size: 14px">
          {{ t('Spectate.needToLeaveLobby') }}
          <NButton size="tiny" secondary @click="() => lc.api.lobby.deleteLobby()">{{
            t('Spectate.leaveButton')
          }}</NButton></span
        >
      </span></template
    >
    <ControlItem
      class="control-item-margin"
      :label="t('Spectate.spectate.label')"
      :label-description="t('Spectate.spectate.description')"
      :label-width="260"
    >
      <div style="display: flex; align-items: center; gap: 8px">
        <NDropdown
          trigger="click"
          placement="top-start"
          :disabled="lcs.gameflow.phase !== 'None'"
          :options="watchableFriendOptions"
          @select="(puuid) => handleSpectatePuuid(puuid)"
          @update:show="handleLoadFriends"
        >
          <NInput
            :placeholder="t('Spectate.spectate.placeholder')"
            style="width: 200px"
            size="small"
            :disabled="lcs.gameflow.phase !== 'None'"
            @keyup.enter="handleSpectate"
            v-model:value="spectator.summonerIdentity"
          ></NInput>
        </NDropdown>
        <NButton
          :loading="spectator.isProcessing"
          :disabled="spectator.summonerIdentity.length === 0 || lcs.gameflow.phase !== 'None'"
          @click="handleSpectate"
          size="small"
          >{{ t('Spectate.spectate.button') }}</NButton
        >
      </div>
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      :label="t('Spectate.token.label')"
      :label-description="t('Spectate.token.description')"
      :label-width="260"
    >
      <div style="display: flex; align-items: center; gap: 8px">
        <NInput
          :placeholder="t('Spectate.token.placeholder')"
          style="width: 200px; font-family: monospace"
          size="small"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 3 }"
          v-model:value="spectator.token"
        ></NInput>
        <NButton
          :disabled="!checkSpectateToken(spectator.token)"
          @click="handleSpectateByToken"
          size="small"
          >{{ t('Spectate.token.button') }}</NButton
        >
      </div>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { GameClientRenderer } from '@renderer-shared/shards/game-client'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { Friend } from '@shared/types/league-client/chat'
import { summonerName } from '@shared/utils/name'
import { useIntervalFn } from '@vueuse/core'
import { AxiosError } from 'axios'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NDropdown, NInput, useNotification } from 'naive-ui'
import { computed, onActivated, onDeactivated, reactive, ref } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const lc = useInstance(LeagueClientRenderer)
const gc = useInstance(GameClientRenderer)
const app = useInstance(AppCommonRenderer)

const notification = useNotification()

const spectator = reactive({
  summonerIdentity: '',
  isProcessing: false,
  token: ''
})

const handleSpectate = async () => {
  if (spectator.isProcessing || lcs.gameflow.phase !== 'None') {
    return
  }

  spectator.isProcessing = true

  let targetPuuid: string

  if (spectator.summonerIdentity.includes('-')) {
    targetPuuid = spectator.summonerIdentity
  } else {
    try {
      if (lcs.summoner.me?.tagLine) {
        const s = await lc.api.summoner.getSummonerAlias(
          ...(spectator.summonerIdentity.split('#') as [string, string])
        )
        if (s) {
          targetPuuid = s.puuid
        } else {
          throw new Error(t('Spectate.errorNoPlayer'))
        }
      } else {
        const {
          data: { puuid }
        } = await lc.api.summoner.getSummonerByName(spectator.summonerIdentity)
        targetPuuid = puuid
      }
    } catch (error) {
      notification.warning({
        title: () => t('Spectate.spectate.notFoundNotification.title'),
        content: () =>
          t('Spectate.spectate.notFoundNotification.description', {
            name: spectator.summonerIdentity
          })
      })

      spectator.isProcessing = false
      return
    }
  }

  try {
    await lc.api.spectator.launchSpectator(targetPuuid)

    notification.success({
      title: () => t('Spectate.spectate.successNotification.title'),
      content: () => t('Spectate.spectate.successNotification.description')
    })
  } catch (error) {
    if ((error as AxiosError).response?.status === 404) {
      notification.warning({
        title: () => t('Spectate.spectate.failedNotification.title'),
        content: () =>
          t('Spectate.spectate.failedNotification.description', {
            reason: spectator.summonerIdentity
          })
      })
    } else {
      notification.warning({
        title: () => t('Spectate.spectate.failedNotification.title'),
        content: () =>
          t('Spectate.spectate.failedNotification.description', {
            reason: (error as Error).message
          })
      })
    }
  }

  spectator.isProcessing = false
}

// 一个 PUUID 的版本
const handleSpectatePuuid = async (puuid: string) => {
  if (spectator.isProcessing || lcs.gameflow.phase !== 'None') {
    return
  }

  spectator.isProcessing = true

  try {
    await lc.api.spectator.launchSpectator(puuid)

    notification.success({
      title: () => t('Spectate.spectate.successNotification.title'),
      content: () => t('Spectate.spectate.successNotification.description')
    })
  } catch (error) {
    notification.warning({
      title: () => t('Spectate.spectate.failedNotification.title'),
      content: () =>
        t('Spectate.spectate.failedNotification.description', {
          reason: (error as Error).message
        })
    })
  } finally {
    spectator.isProcessing = false
  }
}

const friends = ref<Friend[]>([])
const watchableFriendOptions = computed(() => {
  return friends.value
    .filter((f) => f.lol.gameStatus === 'inGame')
    .map((v) => ({
      key: v.puuid,
      label: summonerName(v.gameName, v.gameTag)
    }))
})

const handleLoadFriends = async () => {
  try {
    friends.value = (await lc.api.chat.getFriends()).data
  } catch (error) {
    console.error(t('Spectate.failedToLoadFriends'), error)
  }
}

interface SpectateToken {
  akariVersion: string
  locale?: string
  sgpServerId: string
  observerEncryptionKey: string
  observerServerPort: number
  observerServerIp: string
  gameId: number
  gameMode: string
}

const checkSpectateToken = (str: string) => {
  try {
    const obj = JSON.parse(str) as SpectateToken

    return (
      typeof obj.akariVersion === 'string' &&
      typeof obj.sgpServerId === 'string' &&
      typeof obj.observerEncryptionKey === 'string' &&
      typeof obj.observerServerPort === 'number' &&
      typeof obj.observerServerIp === 'string' &&
      typeof obj.gameId === 'number' &&
      typeof obj.gameMode === 'string' &&
      (typeof obj.locale === 'undefined' || typeof obj.locale === 'string')
    )
  } catch (error) {
    return false
  }
}

const handleSpectateByToken = async () => {
  const obj = JSON.parse(spectator.token) as SpectateToken

  try {
    await gc.launchSpectator(obj)

    notification.success({
      title: () => t('Spectate.token.successNotification.title'),
      content: () => t('Spectate.token.successNotification.description')
    })
  } catch (error) {
    notification.warning({
      title: () => t('Spectate.token.failedNotification.title'),
      content: () =>
        t('Spectate.token.failedNotification.description', {
          reason: (error as Error).message
        })
    })
  }
}

// 剪贴板内容缝缝补补
const { resume: resumeClipboardCheck, pause: pauseClipboardCheck } = useIntervalFn(
  async () => {
    const text = await app.readClipboardText()

    if (spectator.token.length === 0 && checkSpectateToken(text)) {
      spectator.token = text
    }
  },
  2000,
  {
    immediateCallback: true
  }
)

onActivated(() => {
  resumeClipboardCheck()
})

onDeactivated(() => {
  pauseClipboardCheck()
})
</script>

<style lang="less" scoped></style>
