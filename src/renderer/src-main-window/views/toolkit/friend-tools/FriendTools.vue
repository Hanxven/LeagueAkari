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
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
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
  NPopconfirm,
  NScrollbar,
  useMessage
} from 'naive-ui'
import { computed, h, ref, shallowRef, watch, watchEffect } from 'vue'

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
      lastGameDate: number
    }
  >
>({})

const columns = computed<DataTableColumns<any>>(() => [
  {
    type: 'selection'
  },
  {
    title: () => t('FriendTools.columns.groupName'),
    key: 'name'
  },
  {
    title: () => t('FriendTools.columns.lastGameDate'),
    key: 'lastGameDate',
    render: (row) => {
      if (row.children) {
        return undefined
      }

      if (row.puuid in extraInfoMap.value) {
        const extraInfo = extraInfoMap.value[row.puuid]
        if (extraInfo.lastGameDate) {
          return h('span', [
            dayjs(extraInfo.lastGameDate)
              .locale(as.settings.locale.toLowerCase())
              .format('YYYY-MM-DD HH:mm:ss'),
            ' ',
            h(
              'span',
              {
                style: {
                  color: '#fff8'
                }
              },
              [
                '(',
                dayjs(extraInfo.lastGameDate).locale(as.settings.locale.toLowerCase()).fromNow(),
                ')'
              ]
            )
          ])
        } else {
          return h(
            'span',
            {
              style: {
                color: '#fff6'
              }
            },
            t('FriendTools.neverPlayed')
          )
        }
      }

      return h(
        'span',
        {
          style: {
            color: '#fff6'
          }
        },
        t('FriendTools.neverPlayed')
      )
    }
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
            name: `${friend.gameName}#${friend.gameTag}`
          }
        })
        .toSorted((a, b) => {
          if (a.puuid in extraInfoMap.value && b.puuid in extraInfoMap.value) {
            return (
              (extraInfoMap.value[b.puuid].lastGameDate || 0) -
              (extraInfoMap.value[a.puuid].lastGameDate || 0)
            )
          } else if (a.puuid in extraInfoMap.value) {
            return -1
          } else if (b.puuid in extraInfoMap.value) {
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

const updateExtraInfo = async (puuid: string) => {
  if (sgps.availability.serversSupported.common && sgps.isTokenReady) {
    const data = await sgp.getSummoner(puuid)
    if (data) {
      extraInfoMap.value[puuid] = {
        lastGameDate: data.lastGameDate
      }
    }
  } else {
    const { data } = await lc.api.matchHistory.getMatchHistory(puuid, 0, 0)
    if (data.games.games.length) {
      extraInfoMap.value[puuid] = {
        lastGameDate: data.games.games[0].gameCreation
      }
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
          await updateExtraInfo(friend.puuid)
        } catch {}
      }
    }

    _updateExtraInfo()

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

watch(
  () => lcs.isConnected,
  (isConnected) => {
    if (isConnected) {
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
