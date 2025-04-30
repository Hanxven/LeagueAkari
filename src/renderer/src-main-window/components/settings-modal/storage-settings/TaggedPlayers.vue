<template>
  <NCard size="small" style="height: 100%">
    <NModal
      v-model:show="showEditModal"
      preset="card"
      :title="t('TaggedPlayers.editModal.title')"
      style="max-width: 60vw"
    >
      <NInput
        v-model:value="currentEditingTag"
        :placeholder="t('TaggedPlayers.editModal.inputPlaceholder')"
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 4 }"
        ref="input"
      ></NInput>
      <div style="margin-top: 12px; display: flex; justify-content: flex-end; gap: 4px">
        <NButton size="small" @click="showEditModal = false">{{
          t('TaggedPlayers.cancelButton')
        }}</NButton>
        <NButton
          size="small"
          type="primary"
          @click="
            () => {
              if (currentEditing) {
                updateTag(currentEditing.puuid, currentEditing.selfPuuid, currentEditingTag || null)
                showEditModal = false
              }
            }
          "
          >{{ t('TaggedPlayers.saveButton') }}</NButton
        >
      </div>
    </NModal>
    <div class="flex-content">
      <div class="operations">
        <NButton size="small" type="primary" secondary @click="handleExportTaggedPlayers">
          {{ t('TaggedPlayers.exportButton') }}
        </NButton>
        <NButton size="small" secondary @click="handleImportTaggedPlayers">
          {{ t('TaggedPlayers.importButton') }}
        </NButton>
        <NButton
          type="primary"
          size="small"
          @click="() => loadPage(pagination.page || 1, pagination.pageSize || 20)"
        >
          {{ t('TaggedPlayers.refreshButton') }}
        </NButton>
        <NCheckbox v-model:checked="onlyCurrentAccount" :disabled="!lcs.summoner.me">
          {{ t('TaggedPlayers.onlyCurrentAccountCheckbox') }}
        </NCheckbox>
      </div>
      <MaskedComponent :show-mask="showMask">
        <template #mask>
          <div class="streamer-mode-mask">
            <span>{{ t('TaggedPlayers.streamerModeWarning') }}</span>
            <NButton type="warning" size="small" @click="showMask = false">{{
              t('TaggedPlayers.showButton')
            }}</NButton>
          </div>
        </template>
        <NDataTable
          size="small"
          remote
          :data="tableData"
          :single-line="false"
          :columns="columns"
          :loading="isLoading"
          :pagination="pagination"
          style="height: 100%"
          flex-height
        />
      </MaskedComponent>
    </div>
  </NCard>
</template>

<script lang="ts" setup>
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import MaskedComponent from '@renderer-shared/components/MaskedComponent.vue'
import { useInteroperableSgpServers } from '@renderer-shared/compositions/useInteroperableSgpServers'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { RiotClientRenderer } from '@renderer-shared/shards/riot-client'
import { SavedPlayerRenderer } from '@renderer-shared/shards/saved-player'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { getSgpServerId, isTencentServer } from '@shared/data-sources/sgp/utils'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import { useTranslation } from 'i18next-vue'
import {
  DataTableColumns,
  NButton,
  NCard,
  NCheckbox,
  NDataTable,
  NInput,
  NModal,
  NPopconfirm,
  NScrollbar,
  NTag,
  NTooltip,
  PaginationProps,
  useMessage
} from 'naive-ui'
import {
  computed,
  h,
  nextTick,
  reactive,
  ref,
  shallowReactive,
  shallowRef,
  useCssModule,
  useTemplateRef,
  watch
} from 'vue'

import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'

interface RecordType {
  selfPuuid: string
  puuid: string
  region: string
  rsoPlatformId: string
  tag: string
}

interface MappedRecordType extends RecordType {
  key: string
  sgpServerId: string
}

const { t } = useTranslation()
const sp = useInstance(SavedPlayerRenderer)
const lc = useInstance(LeagueClientRenderer)
const mh = useInstance(MatchHistoryTabsRenderer)
const sgp = useInstance(SgpRenderer)
const rc = useInstance(RiotClientRenderer)

const as = useAppCommonStore()
const lcs = useLeagueClientStore()

const { navigateToTabByPuuidAndSgpServerId } = mh.useNavigateToTab()

const sgps = useSgpStore()

const message = useMessage()

const styles = useCssModule()
const tableData = shallowRef<MappedRecordType[]>([])

const { getInteroperability } = useInteroperableSgpServers()

const onlyCurrentAccount = ref(true)

const summonerShallowMap: Record<string, SummonerInfo> = shallowReactive({})

const renderPlayer = (puuid: string, sgpServerId: string) => {
  const cached = summonerShallowMap[puuid]

  if (cached) {
    return h(
      'div',
      {
        class: styles['summoner-name'],
        onClick: () => {
          navigateToTabByPuuidAndSgpServerId(puuid, sgpServerId)
        }
      },
      [
        h(LcuImage, {
          class: styles['image'],
          src: profileIconUri(cached.profileIconId)
        }),
        h(
          'span',
          {
            class: styles['name']
          },
          `${cached.gameName}#${cached.tagLine}`
        )
      ]
    )
  }

  return h(
    NTooltip,
    {
      keepAliveOnHover: false
    },
    {
      trigger: () =>
        h(
          'span',
          {
            class: styles['empty']
          },
          t('TaggedPlayers.na', {
            truncatedPuuid: puuid.slice(0, 8)
          })
        ),
      default: () => {
        return h('div', [
          h(
            'div',
            {
              style: 'margin-bottom: 4px'
            },
            t('TaggedPlayers.naPopoverContent')
          ),
          h(
            'div',
            t('TaggedPlayers.player', {
              puuid
            })
          )
        ])
      }
    }
  )
}

const renderSgpServerTag = (sgpServerId: string) => {
  return h(
    NTag,
    {
      size: 'tiny',
      bordered: false,
      type: isTencentServer(sgpServerId) ? 'success' : 'info'
    },
    () => t(`sgpServers.${sgpServerId}`, sgpServerId)
  )
}

const renderLinedText = (text: string) => {
  return h(
    NScrollbar,
    {
      style: 'max-height: 100px'
    },
    () =>
      h(
        'div',
        {
          class: styles['as-is-text']
        },
        text
      )
  )
}

const renderBoldTitle = (text: string) => {
  return h(
    'span',
    {
      class: styles['bold-title']
    },
    text
  )
}

const isLoading = ref(false)

const columns = computed<DataTableColumns<MappedRecordType>>(() => [
  {
    title: () => renderBoldTitle('#'),
    key: 'ordinal',
    render: (_row, index: number) => {
      return h(
        'span',
        {
          class: styles['row-base']
        },
        ((pagination.page || 1) - 1) * (pagination.pageSize || 20) + index + 1
      )
    },
    width: 68
  },
  {
    title: () => renderBoldTitle(t('TaggedPlayers.columns.tagger')),
    key: 'selfPuuid',
    render: (row) => {
      return renderPlayer(row.selfPuuid, row.sgpServerId)
    }
  },
  {
    title: () => renderBoldTitle(t('TaggedPlayers.columns.tagged')),
    key: 'puuid',
    render: (row: any) => {
      return renderPlayer(row.puuid, row.sgpServerId)
    }
  },
  {
    title: () => renderBoldTitle(t('TaggedPlayers.columns.sgpServer')),
    key: 'sgpServerId',
    render: (row: any) => renderSgpServerTag(row.sgpServerId),
    width: 100
  },
  {
    title: () => renderBoldTitle(t('TaggedPlayers.columns.tag')),
    key: 'tag',
    render: (row: any) => {
      return renderLinedText(row.tag)
    }
  },

  {
    title: '',
    key: 'operations',
    render: (row) => {
      return h(
        'div',
        {
          style: {
            display: 'flex',
            gap: '4px',
            alignItems: 'center'
          }
        },
        [
          h(
            NButton,
            {
              size: 'tiny',
              type: 'info',
              onClick: () => {
                currentEditing.value = row
                currentEditingTag.value = row.tag
                showEditModal.value = true
                nextTick(() => inputEl.value?.focus())
              }
            },
            () => t('TaggedPlayers.editButton')
          ),
          h(
            NPopconfirm,
            {
              positiveText: t('TaggedPlayers.deleteButton'),
              negativeText: t('TaggedPlayers.cancelButton'),
              positiveButtonProps: {
                type: 'error',
                size: 'tiny'
              },
              negativeButtonProps: {
                size: 'tiny'
              },
              onPositiveClick: () => {
                updateTag(row.puuid, row.selfPuuid, null)
              }
            },
            {
              trigger: () =>
                h(NButton, { size: 'tiny', type: 'error' }, () => t('TaggedPlayers.deleteButton')),
              default: () => t('TaggedPlayers.deletePopconfirmContent')
            }
          )
        ]
      )
    }
  }
])

const updateTag = async (puuid: string, selfPuuid: string, tag: string | null) => {
  try {
    await sp.updatePlayerTag({
      puuid,
      selfPuuid,
      tag
    })
    message.success(() => t('TaggedPlayers.updated'))
    loadPage(pagination.page || 1, pagination.pageSize || 20)
  } catch (error: any) {
    message.error(() =>
      t('TaggedPlayers.updateFailed', {
        reason: error.message
      })
    )
  }
}

const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  disabled: computed(() => isLoading.value),
  onChange: (page: number) => {
    loadPage(page, pagination.pageSize || 20)
  },
  onUpdatePageSize: (pageSize: number) => {
    loadPage(pagination.page || 1, pageSize)
  }
})

const updateCachedSummoners = async (
  players: {
    puuid: string
    sgpServerId: string
  }[]
) => {
  for (const player of players) {
    if (summonerShallowMap[player.puuid] || !getInteroperability(player.sgpServerId).common) {
      continue
    }

    if (sgps.availability.sgpServerId === player.sgpServerId) {
      lc.api.summoner.getSummonerByPuuid(player.puuid).then((summoner) => {
        summonerShallowMap[player.puuid] = summoner.data
      })
    } else {
      sgp.getSummonerLcuFormat(player.puuid, player.sgpServerId).then((summoner) => {
        if (summoner) {
          rc.api.playerAccount.getPlayerAccountNameset([player.puuid]).then((nameset) => {
            summoner.gameName = nameset.data.namesets[0]?.gnt.gameName || summoner.displayName
            summoner.tagLine = nameset.data.namesets[0]?.gnt.tagLine || '?????'
            summonerShallowMap[player.puuid] = summoner
          })
        }
      })
    }
  }
}

const loadPage = async (page: number, pageSize: number) => {
  isLoading.value = true
  try {
    const { data, total } = await sp.getAllPlayerTags({
      page,
      pageSize,
      selfPuuid: onlyCurrentAccount.value ? lcs.summoner.me?.puuid : undefined
    })

    tableData.value = (data as RecordType[]).map((item: any) => {
      return {
        ...item,
        key: `${item.selfPuuid}😊${item.puuid}`,
        sgpServerId: getSgpServerId(item.region, item.rsoPlatformId)
      }
    })

    const summonersToLoad = (data as RecordType[]).map((item) => {
      return [
        {
          puuid: item.puuid,
          sgpServerId: getSgpServerId(item.region, item.rsoPlatformId)
        },
        {
          puuid: item.selfPuuid,
          sgpServerId: getSgpServerId(item.region, item.rsoPlatformId)
        }
      ]
    })

    updateCachedSummoners(summonersToLoad.flat())

    pagination.page = page
    pagination.pageSize = pageSize
    pagination.itemCount = total
  } catch (error: any) {
    message.warning(error.message)
  } finally {
    isLoading.value = false
  }
}

watch(
  () => sgps.availability.sgpServerId,
  (_) => {
    loadPage(pagination.page || 1, pagination.pageSize || 20)
  },
  {
    immediate: true
  }
)

watch(
  () => onlyCurrentAccount.value,
  (_value) => {
    loadPage(1, pagination.pageSize || 20)
  }
)

const inputEl = useTemplateRef('input')
const currentEditing = shallowRef<MappedRecordType | null>(null)
const showEditModal = ref(false)
const currentEditingTag = ref('')

const showMask = ref(false)

watch(
  () => as.settings.streamerMode,
  (value) => {
    showMask.value = value
  },
  {
    immediate: true
  }
)

const handleExportTaggedPlayers = async () => {
  try {
    const exportPath = await sp.exportTaggedPlayersToJsonFile()

    if (exportPath) {
      message.success(() => t('TaggedPlayers.exported', { path: exportPath }))
    }
  } catch (error: any) {
    message.error(() => t('TaggedPlayers.errorExport', { reason: error.message }))
  }
}

const handleImportTaggedPlayers = async () => {
  try {
    const importPath = await sp.importTaggedPlayersFromJsonFile()

    if (importPath) {
      message.success(() => t('TaggedPlayers.imported', { path: importPath }))
      await loadPage(pagination.page || 1, pagination.pageSize || 20)
    }
  } catch (error: any) {
    if (error.code) {
      switch (error.code) {
        case 'InvalidTaggedPlayersFile':
        case 'InvalidTaggedPlayersData':
          message.error(() => t('TaggedPlayers.errorCode.InvalidTaggedPlayersFile'))
          break
        case 'InvalidDatabaseVersion':
          message.error(() => t('TaggedPlayers.errorCode.InvalidDatabaseVersion'))
          break
        default:
          message.error(() => t('TaggedPlayers.errorCode.importDefault', { reason: error.message }))
          break
      }
    } else {
      message.error(() => t('TaggedPlayers.errorCode.importDefault', { reason: error.message }))
    }
  }
}
</script>

<style lang="less" scoped>
.operations {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.flex-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.streamer-mode-mask {
  width: 100%;
  height: 100%;
  display: flex;
  gap: 16px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>

<style lang="less" module>
.row-base {
  font-size: 12px;
}

.empty {
  color: #ffffffa0;
  font-size: 12px;
}

.summoner-name {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  width: fit-content;

  .image {
    width: 16px;
    height: 16px;
    border-radius: 2px;
  }

  .name {
    font-size: 12px;
  }
}

.as-is-text {
  font-size: 12px;
  white-space: pre-wrap;
}

.bold-title {
  font-size: 12px;
  font-weight: bold;
}
</style>
