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
      label="目标召唤师"
      label-description="通过 PUUID 或召唤师名称观战，前提是玩家正在可观战的对局中"
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
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { laNotification } from '@renderer-shared/notification'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { Friend } from '@shared/types/league-client/chat'
import { resolveSummonerName } from '@shared/utils/identity'
import { summonerName } from '@shared/utils/name'
import { AxiosError } from 'axios'
import { NButton, NCard, NDropdown, NInput } from 'naive-ui'
import { computed, reactive, ref } from 'vue'

const lcs = useLeagueClientStore()
const lc = useInstance<LeagueClientRenderer>('league-client-renderer')

const spectator = reactive({
  summonerIdentity: '',
  isProcessing: false
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
