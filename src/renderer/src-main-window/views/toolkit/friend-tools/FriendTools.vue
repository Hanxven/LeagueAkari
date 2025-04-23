<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <NCard size="small">
          <template #header>
            <span class="card-header-title">{{ t('FriendTools.title') }}</span>
          </template>
          <div class="button-group">
            <NPopconfirm
              @positive-click="deleteSelectedFriends"
              :disabled="isLoading || !selectedFriendCount || !lcs.isConnected"
              :positive-text="t('FriendTools.deleteButton')"
              :positive-button-props="{
                size: 'tiny',
                type: 'error'
              }"
              :negative-button-props="{
                size: 'tiny'
              }"
            >
              <template #trigger>
                <NButton
                  :disabled="isLoading || !selectedFriendCount || !lcs.isConnected"
                  size="small"
                  type="error"
                  secondary
                >
                  <template v-if="selectedItems.length">{{
                    t('FriendTools.deleteButtonC', { countV: selectedFriendCount })
                  }}</template>
                  <template v-else>
                    {{ t('FriendTools.deleteButton') }}
                  </template>
                </NButton>
              </template>
              {{ t('FriendTools.deletePopconfirm') }}
            </NPopconfirm>
            <NButton
              size="small"
              type="warning"
              secondary
              v-show="isDeleting"
              @click="isDeleting = false"
            >
              {{ t('FriendTools.cancelButton') }}
            </NButton>
            <NButton
              :disabled="isLoading || !lcs.isConnected"
              size="small"
              secondary
              @click="updateFriends(true)"
            >
              {{ t('FriendTools.refreshButton') }}
            </NButton>
          </div>
          <NDataTable
            :theme-overrides="{
              thColor: '#0005',
              tdColor: '#0004'
            }"
            :loading="isLoading"
            :columns="columns"
            :data="tableData"
            :virtual-scroll="shouldUseVirtualScroll"
            :row-key="(row) => row.id"
            v-model:checked-row-keys="selectedItems"
            v-model:expanded-row-keys="expandedRowKeys"
            size="small"
            :max-height="600"
          ></NDataTable>
        </NCard>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useActivated } from '@renderer-shared/compositions/useActivated'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { Friend, FriendGroup } from '@shared/types/league-client/chat'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import {
  DataTableColumns,
  NButton,
  NCard,
  NDataTable,
  NEllipsis,
  NPopconfirm,
  NScrollbar,
  useMessage
} from 'naive-ui'
import { computed, h, ref, shallowRef, watch } from 'vue'

const { t } = useTranslation()

const as = useAppCommonStore()
const sgps = useSgpStore()
const lcs = useLeagueClientStore()

const lc = useInstance(LeagueClientRenderer)
const sgp = useInstance(SgpRenderer)

const message = useMessage()

const selectedItems = ref<string[]>([])
const expandedRowKeys = ref<number[]>([])

const isLoading = ref(false)
const isDeleting = ref(false)

// puuid -> info
const extraInfoMap = ref<
  Record<
    string,
    {
      lastGameDate?: number
      friendsSince?: number
    }
  >
>({})

const renderFormattedDate = (date: number) => {
  return h('span', { style: { fontSize: '12px' } }, [
    dayjs(date).locale(as.settings.locale.toLowerCase()).format('YYYY-MM-DD HH:mm:ss'),
    ' ',
    h('span', { style: { color: '#fff8' } }, [
      '(',
      dayjs(date).locale(as.settings.locale.toLowerCase()).fromNow(),
      ')'
    ])
  ])
}

const renderDateField = (
  row: any,
  field: 'lastGameDate' | 'friendsSince',
  fallbackText: string
) => {
  if (row.children) return undefined

  const extraInfo = extraInfoMap.value[row.puuid]
  if (extraInfo && extraInfo[field]) {
    return renderFormattedDate(extraInfo[field])
  }

  return h('span', { style: { color: '#fff6', fontSize: '12px' } }, fallbackText)
}

const renderGroupName = (row: any) => {
  if (row.children) {
    return h('span', { style: { fontWeight: 'bold' } }, row.name)
  }

  return h(
    'div',
    {
      style: {
        display: 'inline-flex',
        gap: '4px',
        fontSize: '14px',
        alignItems: 'center'
      }
    },
    [
      h(LcuImage, {
        style: { width: '18px', height: '18px' },
        src: profileIconUri(row.icon)
      }),
      h(NEllipsis, { style: { maxWidth: '160px' } }, () => row.name)
    ]
  )
}

const columns = computed<DataTableColumns<any>>(() => [
  {
    type: 'selection'
  },
  {
    title: () => t('FriendTools.columns.groupName'),
    key: 'name',
    render: (row) => renderGroupName(row)
  },
  {
    title: () => t('FriendTools.columns.lastGameDate'),
    key: 'lastGameDate',
    render: (row) => renderDateField(row, 'lastGameDate', t('FriendTools.neverPlayed'))
  },
  {
    title: () => t('FriendTools.columns.friendSince'),
    key: 'friendSince',
    render: (row) => renderDateField(row, 'friendsSince', t('FriendTools.unknown'))
  }
])

const tableData = computed(() => {
  return combinedGroups.value.map((group) => {
    return {
      id: group.id,
      name: t(`FriendTools.groupNames.${group.name}`, group.name),
      children: group.friends
        .map((friend) => {
          return {
            id: friend.id,
            puuid: friend.puuid,
            icon: friend.icon,
            name: `${friend.gameName}#${friend.gameTag}`
          }
        })
        .toSorted((a, b) => {
          const aSince = extraInfoMap.value[a.puuid]?.friendsSince
          const bSince = extraInfoMap.value[b.puuid]?.friendsSince

          if (aSince && bSince) {
            return aSince - bSince
          } else if (aSince) {
            return -1
          } else if (bSince) {
            return 1
          } else {
            return 0
          }
        })
    }
  })
})

const selectedFriendCount = computed(() => {
  return selectedItems.value.filter((item) => typeof item === 'string').length
})

const groups = shallowRef<FriendGroup[]>([])
const friends = shallowRef<Friend[]>([])

const combinedGroups = computed(() => {
  const groupMap = new Map<
    number,
    {
      id: number
      priority: number
      name: string
      friends: Friend[]
    }
  >(
    groups.value.map((group) => [
      group.id,
      { id: group.id, priority: group.priority, name: group.name, friends: [] }
    ])
  )

  for (const friend of friends.value) {
    const group = groupMap.get(friend.groupId)
    if (group) {
      group.friends.push(friend)
    }
  }

  return Array.from(groupMap.values())
    .filter((g) => g.friends.length)
    .toSorted((a, b) => b.priority - a.priority)
})

const shouldUseVirtualScroll = computed(() => {
  let friendsCount = 0
  for (const group of combinedGroups.value) {
    friendsCount += group.friends.length
  }

  return friendsCount > 48
})

const updateLastGameDate = async (puuid: string) => {
  if (sgps.availability.serversSupported.matchHistory && sgps.isTokenReady) {
    const data = await sgp.getMatchHistoryLcuFormat(puuid, 0, 1)
    if (data.games.games.length) {
      if (!extraInfoMap.value[puuid]) {
        extraInfoMap.value[puuid] = {}
      }

      extraInfoMap.value[puuid].lastGameDate = data.games.games[0].gameCreation
    }
  } else {
    const { data } = await lc.api.matchHistory.getMatchHistory(puuid, 0, 0)
    if (data.games.games.length) {
      if (!extraInfoMap.value[puuid]) {
        extraInfoMap.value[puuid] = {}
      }

      extraInfoMap.value[puuid].lastGameDate = data.games.games[0].gameCreation
    }
  }
}

const updateFriendSince = async () => {
  const { data } = await lc.api.store.getGiftableFriends()

  const puuidMap: Record<number, string> = {}
  friends.value.forEach((friend) => {
    puuidMap[friend.summonerId] = friend.puuid
  })

  for (const f of data) {
    const puuid = puuidMap[f.summonerId]
    if (puuid) {
      if (!extraInfoMap.value[puuid]) {
        extraInfoMap.value[puuid] = {}
      }

      extraInfoMap.value[puuid].friendsSince = new Date(f.friendsSince).getTime()
    }
  }
}

const updateFriends = async (manually = false) => {
  if (isLoading.value) {
    return
  }

  try {
    isLoading.value = true

    const { data: groupsD } = await lc.api.chat.getFriendGroups()
    const { data: friendsD } = await lc.api.chat.getFriends()

    selectedItems.value = []
    groups.value = groupsD
    friends.value = friendsD
    expandedRowKeys.value = groupsD.map((group) => group.id)

    const _updateExtraInfo = async () => {
      for (const friend of friendsD) {
        try {
          await updateLastGameDate(friend.puuid)
        } catch {}
      }
    }

    _updateExtraInfo()
    updateFriendSince().catch(() => {})

    if (manually) {
      message.success(() => t('FriendTools.refreshSuccess'))
    }
  } catch (error: any) {
    message.warning(() => t('MissionClaimTool.refreshFailed', { reason: error.message }))
  } finally {
    isLoading.value = false
  }
}

const deleteSelectedFriends = async () => {
  if (isLoading.value) {
    return
  }

  try {
    isLoading.value = true
    isDeleting.value = true

    // 建立在: group 以 number 为 key, friend 以 string 为 key
    const filtered = selectedItems.value.filter((item) => typeof item === 'string')

    for (const friendId of filtered) {
      if (!isDeleting.value) {
        break
      }

      await lc.api.chat.deleteFriend(friendId)
    }

    message.success(() => t('FriendTools.deleteSuccess', { countV: filtered.length }))
  } catch (error: any) {
    message.warning(() => t('MissionClaimTool.refreshFailed', { reason: error.message }))
  } finally {
    isLoading.value = false
    isDeleting.value = false
  }
}

lc.onLcuEventVue<Friend>('/lol-chat/v1/friends/:id', ({ eventType, data }, { id }) => {
  if (eventType === 'Delete') {
    friends.value = friends.value.filter((friend) => friend.id !== id)
    selectedItems.value = []
  } else if (eventType === 'Update') {
    const index = friends.value.findIndex((friend) => friend.id === id)
    if (index !== -1) {
      friends.value[index] = data
    }
  }
})

const isActivated = useActivated()

watch(
  [() => lcs.isConnected, () => isActivated.value],
  ([isConnected, isActivated]) => {
    if (isConnected && isActivated) {
      updateFriends()
    }
  },
  { immediate: true }
)
</script>

<style lang="less" scoped>
@import '../toolkit-styles.less';

.button-group {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}
</style>
