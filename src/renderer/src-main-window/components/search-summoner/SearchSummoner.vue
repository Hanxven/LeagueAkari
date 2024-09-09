<template>
  <div class="search-wrapper">
    <div class="search-inner">
      <div class="search-input-area">
        <NAutoComplete
          :get-show="() => inputText.length === 0"
          :options="autoCompleteOptions"
          @focus="() => generateCompleteOptions()"
          ref="input"
          class="search-input"
          placeholder="精确搜索"
          @select="handleApplyAutoCompletion"
          :render-label="renderLabel"
          :status="isTagNeeded ? 'warning' : 'success'"
          v-model:value="inputText"
          @keyup.enter="handleSearch"
          :disabled="isSearching"
        />
        <NSelect
          v-if="sgpServerOptions.length"
          style="width: 200px"
          v-model:value="currentSgpServer"
          :options="sgpServerOptions"
        />
        <NButton type="primary" :disabled="!inputText" :loading="isSearching" @click="handleSearch"
          >搜索</NButton
        >
      </div>
      <div class="summoners-area">
        <SummonerCard
          class="card"
          v-if="byNameResult"
          condition="name"
          :summoner="byNameResult"
          :search-text="searchText"
          :sgp-server-id="searchSgpServerId"
          @to-summoner="handleToSummoner"
        />
        <SummonerCard
          class="card"
          v-if="bySummonerIdResult"
          condition="id"
          :summoner="bySummonerIdResult"
          :search-text="searchText"
          :sgp-server-id="searchSgpServerId"
          @to-summoner="handleToSummoner"
        />
        <SummonerCard
          class="card"
          v-if="byPuuidResult"
          condition="puuid"
          :summoner="byPuuidResult"
          :search-text="searchText"
          :sgp-server-id="searchSgpServerId"
          @to-summoner="handleToSummoner"
        />
      </div>
      <div class="empty" v-if="isNoSearchResult" size="small">没有符合条件的用户</div>
      <div
        class="empty"
        v-if="!isNoSearchResult && !byNameResult && !bySummonerIdResult && !byPuuidResult"
        size="small"
      >
        {{
          isCrossRegion
            ? '输入召唤师名称或 PUUID，开始精确搜索'
            : '输入召唤师名称、ID 或 PUUID，开始精确搜索'
        }}
        <template v-if="summoner.newIdSystemEnabled">
          <span :class="{ 'need-tag': isTagNeeded }" class="need-tag-hint"
            >召唤师名称查询需满足格式 [名称]#[TAG]</span
          >
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  getSummoner,
  getSummonerAlias,
  getSummonerByName,
  getSummonerByPuuid
} from '@renderer-shared/http-api/summoner'
import { externalDataSourceRendererModule as edsm } from '@renderer-shared/modules/external-data-source'
import { useExternalDataSourceStore } from '@renderer-shared/modules/external-data-source/store'
import { useLcuConnectionStore } from '@renderer-shared/modules/lcu-connection/store'
import { useSummonerStore } from '@renderer-shared/modules/lcu-state-sync/summoner'
import { getPlayerAccountAlias, getPlayerAccountNameset } from '@renderer-shared/rc-http-api/rc-api'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import { inferType, resolveSummonerName } from '@shared/utils/identity'
import { regionText, rsoPlatformText } from '@shared/utils/rso-platforms'
import { Close as CloseIcon } from '@vicons/carbon'
import {
  AutoCompleteOption,
  NAutoComplete,
  NButton,
  NFlex,
  NIcon,
  NSelect,
  SelectOption
} from 'naive-ui'
import { VNodeChild, computed, h, nextTick, onMounted, ref, useTemplateRef, watchEffect } from 'vue'

import { matchHistoryTabsRendererModule as mhm } from '@main-window/modules/match-history-tabs'

import SummonerCard from './SummonerCard.vue'

const summoner = useSummonerStore()

const inputText = ref('')
const searchText = ref('')
const searchSgpServerId = ref('')

const inputEl = useTemplateRef('input')

const isNoSearchResult = ref(false)

const bySummonerIdResult = ref<SummonerInfo>()
const byNameResult = ref<SummonerInfo>()
const byPuuidResult = ref<SummonerInfo>()

const eds = useExternalDataSourceStore()

const currentSgpServer = ref('')

watchEffect(() => {
  currentSgpServer.value =
    eds.sgpAvailability.currentRegion === 'TENCENT'
      ? eds.sgpAvailability.currentRsoPlatform
      : eds.sgpAvailability.currentRegion
})

const sgpServerOptions = computed(() => {
  if (!eds.sgpAvailability.currentSgpServerSupported) {
    return []
  }

  const platform =
    eds.sgpAvailability.currentRegion === 'TENCENT'
      ? eds.sgpAvailability.currentRsoPlatform
      : eds.sgpAvailability.currentRegion

  const thatGroup = eds.sgpAvailability.supportedSgpServers.groups.find((g) =>
    g.find((s) => s === platform)
  )

  if (!thatGroup || thatGroup.length <= 1) {
    return []
  }

  return thatGroup
    .map((s) => ({
      label: eds.sgpAvailability.currentRsoPlatform ? rsoPlatformText[s] || s : regionText[s] || s,
      value: s
    }))
    .toSorted((a, b) => a.label.localeCompare(b.label))
})

// 跨区查询需要额外步骤
const isCrossRegion = computed(() => {
  if (eds.sgpAvailability.currentRegion === 'TENCENT') {
    return eds.sgpAvailability.currentRsoPlatform !== currentSgpServer.value
  }

  return eds.sgpAvailability.currentRegion !== currentSgpServer.value
})

function isNumeric(str: string): boolean {
  return /^\d+$/.test(str)
}

const isTagNeeded = computed(() => {
  if (!summoner.newIdSystemEnabled) {
    return false
  }

  if (inputText.value.length === 0) {
    return false
  }

  if (inputText.value.includes('-')) {
    return false
  }

  if (!isCrossRegion.value && !isNumeric(inputText.value)) {
    const [name, tag] = resolveSummonerName(inputText.value)
    if (!name || !tag) {
      return true
    }
  }

  return false
})

const isSearching = ref(false)
const handleSearch = async () => {
  if (isSearching.value || !inputText.value) {
    return
  }
  isSearching.value = true
  searchText.value = inputText.value
  searchSgpServerId.value = currentSgpServer.value

  const inferredTypes = inferType(inputText.value)
  const tasks: Promise<void>[] = []

  for (const type of inferredTypes) {
    if (type.type === 'name') {
      tasks.push(
        (async () => {
          if (type.isWithTagLine) {
            const [name, tag] = resolveSummonerName(type.value)

            try {
              if (isCrossRegion.value) {
                const a = await getPlayerAccountAlias(name, tag)
                const p = await edsm.sgp.getSummonerLcuFormat(a.puuid, currentSgpServer.value)
                p.gameName = a.alias.game_name
                p.tagLine = a.alias.tag_line
                byNameResult.value = p
              } else {
                const summoner2 = await getSummonerAlias(name, tag)
                if (summoner2) {
                  byNameResult.value = summoner2
                }
              }
            } catch (error) {
              console.warn(`查找名称+TagLine ${type.value}`, error)
            }
          } else {
            if (summoner.newIdSystemEnabled) {
              return
            }

            try {
              const summoner2 = await getSummonerByName(type.value)
              byNameResult.value = summoner2.data
            } catch (error) {
              console.warn(`查找名称 ${type.value}`, error)
            }
          }
        })()
      )
    }

    if (type.type === 'puuid') {
      tasks.push(
        (async () => {
          try {
            if (isCrossRegion.value) {
              const summoner = await edsm.sgp.getSummonerLcuFormat(
                type.value,
                currentSgpServer.value
              )
              const s = await getPlayerAccountNameset(type.value)
              summoner.gameName = s.gnt.gameName
              summoner.tagLine = s.gnt.tagLine
              byPuuidResult.value = summoner
            } else {
              const summoner = await getSummonerByPuuid(type.value)
              byPuuidResult.value = summoner.data
            }
          } catch (error) {
            console.warn(`查找 PUUID ${type.value}`, error)
          }
        })()
      )
    }

    if (type.type === 'summonerId') {
      tasks.push(
        (async () => {
          try {
            const summoner = await getSummoner(type.value)
            bySummonerIdResult.value = summoner.data
          } catch (error) {
            console.warn(`查找召唤师 ID ${type.value}`, error)
          }
        })()
      )
    }
  }

  byNameResult.value = undefined
  bySummonerIdResult.value = undefined
  byPuuidResult.value = undefined

  await Promise.allSettled(tasks)

  if (byNameResult.value || bySummonerIdResult.value || byPuuidResult.value) {
    isNoSearchResult.value = false
  } else {
    isNoSearchResult.value = true
  }

  isSearching.value = false
}

const lc = useLcuConnectionStore()

const updateSearchHistory = async () => {
  if (!lc.auth || !summoner.me) {
    return
  }

  autoCompleteOptions.value = mhm
    .getLocalStorageSearchHistory(lc.auth.region, lc.auth.rsoPlatformId, summoner.me.puuid)
    .map((m) => ({
      label: m.playerName,
      value: m.puuid
    }))
}

const autoCompleteOptions = ref<AutoCompleteOption[]>([])
const generateCompleteOptions = async () => {
  window.setTimeout(() => updateSearchHistory(), 200)
}

const renderLabel = (option: SelectOption): VNodeChild => {
  return h(NFlex, { justify: 'space-between', style: { width: '100%' } }, () => [
    h(
      NButton,
      {
        quaternary: true,
        size: 'tiny',
        circle: true,
        onClick: (e) => {
          e.stopPropagation()
          if (!lc.auth || !summoner.me) {
            return
          }

          mhm.deleteLocalStorageSearchHistory(
            lc.auth.region,
            lc.auth.rsoPlatformId,
            summoner.me.puuid,
            option.value as string
          )
          updateSearchHistory()
        }
      },
      { icon: () => h(NIcon, () => h(CloseIcon)) }
    ),
    h(
      'div',
      {
        style: {
          overflow: 'hidden',
          'text-overflow': 'ellipsis',
          'white-space': 'nowrap'
        }
      },
      option.label as string
    )
  ])
}

const handleApplyAutoCompletion = (_: string) => {
  nextTick(() => handleSearch())
}

onMounted(() => {
  inputEl.value?.focus()
})

const { navigateToTab } = mhm.useNavigateToTab()

const handleToSummoner = (puuid: string, sgpServerId?: string) => {
  navigateToTab(puuid, sgpServerId)
}
</script>

<style lang="less" scoped>
.search-wrapper {
  height: 100%;
  overflow-y: scroll;
  padding: 0 24px;
  width: 500px;
}

.search-inner {
  margin: 0 auto;
  padding: 24px 0;
  max-width: 940px;
}

.search-input-area {
  display: flex;
  gap: 8px;
  padding: 4px;
  border: 1px solid rgb(60, 60, 60);
  border-radius: 4px;
  box-sizing: border-box;

  :deep(.n-base-select-option__content) {
    width: 100%;
  }
}

.summoners-area {
  display: flex;
  flex-direction: column;
  margin-top: 24px;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 160px;
  border-radius: 4px;
  border: 1px solid rgb(46, 46, 46);
  font-size: 13px;
  color: rgb(142, 142, 142);
  text-align: center;
}

.card:not(:last-child) {
  margin-bottom: 8px;
}

.divider {
  padding: 0 24px;

  .text {
    font-size: 13px;
  }
}

.need-tag {
  color: rgb(215, 200, 85);
}

.need-tag-hint {
  transition: all 0.3s ease;
}
</style>
