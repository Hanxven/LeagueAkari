<template>
  <NCard size="small">
    <template #header
      ><span class="card-header-title"
        >观战{{ gameflow.phase === 'Lobby' ? ' (需要先退出当前房间)' : '' }}</span
      ></template
    >
    <ControlItem
      class="control-item-margin"
      label="目标召唤师"
      label-description="通过 PUUID 或召唤师名称观战，前提是玩家正在可观战的对局中"
    >
      <div style="display: flex; align-items: center; gap: 8px">
        <NDropdown
          trigger="click"
          placement="top-start"
          :disabled="gameflow.phase !== 'None'"
          :options="watchableFriendOptions"
          @select="(puuid) => handleSpectatePuuid(puuid)"
          @update:show="handleLoadFriends"
        >
          <NInput
            placeholder="召唤师名称 / PUUID"
            style="width: 200px"
            size="tiny"
            :disabled="gameflow.phase !== 'None'"
            @keyup.enter="handleSpectate"
            v-model:value="spectator.summonerIdentity"
          ></NInput>
        </NDropdown>
        <NButton
          :loading="spectator.isProcessing"
          :disabled="spectator.summonerIdentity.length === 0 || gameflow.phase !== 'None'"
          @click="handleSpectate"
          size="tiny"
          >调起观战</NButton
        >
      </div>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import { NButton, NCard, NDropdown, NInput } from 'naive-ui'
import { computed, reactive, ref } from 'vue'

import ControlItem from '@renderer/components/ControlItem.vue'
import { notify } from '@renderer/events/notifications'
import { useGameflowStore } from '@renderer/features/stores/lcu/gameflow'
import { useSummonerStore } from '@renderer/features/stores/lcu/summoner'
import { getFriends } from '@renderer/http-api/chat'
import { LcuHttpError } from '@renderer/http-api/common'
import { launchSpectator } from '@renderer/http-api/spectator'
import { getSummonerAlias, getSummonerByName } from '@renderer/http-api/summoner'
import { Friend } from '@shared/types/lcu/chat'
import { resolveSummonerName } from '@renderer/utils/identity'

const id = 'view:toolkit:spectate'

const gameflow = useGameflowStore()
const summoner = useSummonerStore()

const spectator = reactive({
  summonerIdentity: '',
  isProcessing: false
})

const handleSpectate = async () => {
  if (spectator.isProcessing || gameflow.phase !== 'None') {
    return
  }

  spectator.isProcessing = true

  let targetPuuid: string

  if (spectator.summonerIdentity.includes('-')) {
    targetPuuid = spectator.summonerIdentity
  } else {
    try {
      if (summoner.newIdSystemEnabled) {
        const s = await getSummonerAlias(...resolveSummonerName(spectator.summonerIdentity))
        if (s) {
          targetPuuid = s.puuid
        } else {
          throw new Error('玩家不存在')
        }
      } else {
        const {
          data: { puuid }
        } = await getSummonerByName(spectator.summonerIdentity)
        targetPuuid = puuid
      }
    } catch (err) {
      notify.emit({
        id,
        type: 'warning',
        content: `目标玩家 ${spectator.summonerIdentity} 不存在`
      })

      spectator.isProcessing = false
      return
    }
  }

  try {
    await launchSpectator(targetPuuid)
    notify.emit({
      id,
      type: 'success',
      content: '已拉起观战'
    })
  } catch (err) {
    if ((err as LcuHttpError).response?.status === 404) {
      notify.emit({
        id,
        type: 'warning',
        content: '尝试观战失败，玩家不存在',
        extra: { error: err }
      })
    } else {
      notify.emit({
        id,
        type: 'warning',
        content: '尝试观战失败，该玩家可能不在对局中或目标模式不可观战',
        extra: { error: err }
      })
    }
  }

  spectator.isProcessing = false
}

// 一个 PUUID 的版本
const handleSpectatePuuid = async (puuid: string) => {
  if (spectator.isProcessing || gameflow.phase !== 'None') {
    return
  }

  spectator.isProcessing = true

  try {
    await launchSpectator(puuid)
    notify.emit({
      id,
      type: 'success',
      content: '已拉起观战'
    })
  } catch (err) {
    notify.emit({
      id,
      type: 'warning',
      content: '尝试观战失败，该玩家可能不在对局中或目标模式不可观战',
      extra: { error: err }
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
      label: v.name
    }))
})

const handleLoadFriends = async () => {
  try {
    friends.value = (await getFriends()).data
  } catch (err) {
    console.error('好友列表加载失败', err)
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
@shared/types/lcu/chat