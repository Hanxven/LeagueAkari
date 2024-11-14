<template>
  <NCard size="small">
    <template #header
      ><span class="card-header-title"
        >观战<span v-if="lcs.gameflow.phase === 'Lobby'" style="color: yellow; font-size: 14px">
          (需要先退出当前房间)
          <NButton size="tiny" secondary @click="() => lc.api.lobby.deleteLobby()"
            >退出房间</NButton
          ></span
        ></span
      ></template
    >
    <ControlItem
      class="control-item-margin"
      label="召唤师观战"
      label-description="通过 PUUID 或召唤师名称观战当前大区玩家，前提是玩家正在可观战的对局中"
      :label-width="200"
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
            placeholder="召唤师名称 / PUUID"
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
          >调起观战</NButton
        >
      </div>
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="口令观战"
      label-description="通过符合格式的特殊口令，调起游戏端观战进程"
      :label-width="200"
    >
      <div style="display: flex; align-items: center; gap: 8px">
        <NInput
          placeholder="符合格式的观战口令"
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
          >调起观战</NButton
        >
      </div>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { laNotification } from '@renderer-shared/notification'
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { GameClientRenderer } from '@renderer-shared/shards/game-client'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { Friend } from '@shared/types/league-client/chat'
import { resolveSummonerName } from '@shared/utils/identity'
import { summonerName } from '@shared/utils/name'
import { useIntervalFn } from '@vueuse/core'
import { AxiosError } from 'axios'
import { NButton, NCard, NDropdown, NInput } from 'naive-ui'
import { computed, onActivated, onDeactivated, reactive, ref } from 'vue'

const lcs = useLeagueClientStore()
const lc = useInstance<LeagueClientRenderer>('league-client-renderer')
const gc = useInstance<GameClientRenderer>('game-client-renderer')
const app = useInstance<AppCommonRenderer>('app-common-renderer')

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
          ...resolveSummonerName(spectator.summonerIdentity)
        )
        if (s) {
          targetPuuid = s.puuid
        } else {
          throw new Error('玩家不存在')
        }
      } else {
        const {
          data: { puuid }
        } = await lc.api.summoner.getSummonerByName(spectator.summonerIdentity)
        targetPuuid = puuid
      }
    } catch (error) {
      laNotification.warn('观战', `目标玩家 ${spectator.summonerIdentity} 不存在`, error)

      spectator.isProcessing = false
      return
    }
  }

  try {
    await lc.api.spectator.launchSpectator(targetPuuid)

    laNotification.success('观战', '已拉起观战')
  } catch (error) {
    if ((error as AxiosError).response?.status === 404) {
      laNotification.warn('观战', '尝试观战失败，玩家不存在', error)
    } else {
      laNotification.warn('观战', '尝试观战失败，该玩家可能不在对局中或目标模式不可观战', error)
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

    laNotification.success('观战', '已拉起观战')
  } catch (error) {
    laNotification.warn('观战', '尝试观战失败，该玩家可能不在对局中或目标模式不可观战', error)
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
    console.error('好友列表加载失败', error)
  }
}

interface SpectateToken {
  akariVersion: string
  locale?: string
  sgpServerId: string
  puuid: string
}

const checkSpectateToken = (str: string) => {
  try {
    const obj = JSON.parse(str) as SpectateToken

    return (
      typeof obj.akariVersion === 'string' &&
      typeof obj.sgpServerId === 'string' &&
      typeof obj.puuid === 'string' &&
      (typeof obj.locale === 'undefined' || typeof obj.locale === 'string')
    )
  } catch (error) {
    return false
  }
}

const handleSpectateByToken = async () => {
  const obj = JSON.parse(spectator.token) as SpectateToken

  try {
    await gc.launchSpectator({
      locale: obj.locale,
      sgpServerId: obj.sgpServerId,
      puuid: obj.puuid
    })

    if (lcs.connectionState === 'connected') {
      laNotification.success('观战', '已拉起观战')
    } else {
      laNotification.success('观战', '已拉起观战，使用上一次记录的客户端位置')
    }
  } catch (error) {
    laNotification.warn('观战', (error as any).message, error)
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
