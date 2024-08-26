<template>
  <div class="search-wrapper">
    <div class="search-inner">
      <div class="search-input-area">
        <NAutoComplete
          :get-show="() => inputText.length === 0"
          :options="autoCompleteOptions"
          @focus="() => generateCompleteOptions()"
          ref="inputEl"
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
        <template v-if="byNameResult && byNameResult.length">
          <SummonerCard
            v-for="(summoner, index) in byNameResult"
            :key="index"
            class="card"
            condition="name"
            :summoner="summoner"
            :search-text="searchText"
            :sgp-server-id="searchSgpServerId"
            @to-summoner="handleToSummoner"
          />
        </template>
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
          isCrossServer
            ? '输入召唤师名称或 PUUID，开始搜索'
            : '输入召唤师名称、ID 或 PUUID，开始搜索'
        }}
        <template v-if="summoner.newIdSystemEnabled">
          <span :class="{ 'need-tag': isTagNeeded }" class="need-tag-hint">
            召唤师名称查询满足格式 [名称]#[TAG] 可精确搜索
          </span>
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
} from '@shared/renderer/http-api/summoner'
import { externalDataSourceRendererModule as edsm } from '@shared/renderer/modules/external-data-source'
import { useExternalDataSourceStore } from '@shared/renderer/modules/external-data-source/store'
import { useLcuConnectionStore } from '@shared/renderer/modules/lcu-connection/store'
import { useSummonerStore } from '@shared/renderer/modules/lcu-state-sync/summoner'
import { getPlayerAccountAlias, getPlayerAccountNameset } from '@shared/renderer/rc-http-api/rc-api'
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
import { VNodeChild, computed, h, nextTick, onMounted, ref, watchEffect } from 'vue'

import { matchHistoryTabsRendererModule as mhm } from '@main-window/modules/match-history-tabs'

import SummonerCard from './SummonerCard.vue'

const summoner = useSummonerStore()

const inputText = ref('')
const searchText = ref('')
const searchSgpServerId = ref('')

const inputEl = ref()

const isNoSearchResult = ref(false)

const bySummonerIdResult = ref<SummonerInfo>()
const byNameResult = ref<SummonerInfo[]>()
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
const isCrossServer = computed(() => {
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

  if (!isCrossServer.value && !isNumeric(inputText.value)) {
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

  const fetchCrossServerSummoner = async (name, tag, puuid = null) => {
    try {
      const alias = puuid
        ? await edsm.sgp.getSummonerLcuFormat(puuid, currentSgpServer.value)
        : (await getPlayerAccountAlias(name, tag))[0]
      const summoner = await edsm.sgp.getSummonerLcuFormat(alias.puuid, currentSgpServer.value)
      summoner.gameName = alias.game_name
      summoner.tagLine = alias.tag_line
      return summoner
    } catch (error) {
      if (!puuid) console.warn(`跨服查找失败`, error)
      return null
    }
  }

  for (const type of inferredTypes) {
    if (type.type === 'name') {
      tasks.push(
        (async () => {
          try {
            if (type.isWithTagLine) {
              const [name, tag] = resolveSummonerName(type.value)
              const summoner = isCrossServer.value
                ? await fetchCrossServerSummoner(name, tag)
                : await getSummonerAlias(name, tag)
              if (summoner) byNameResult.value.push(summoner)
            } else if (summoner.newIdSystemEnabled) {
                const accounts = await getPlayerAccountAlias(type.value)
                for (const account of accounts) {
                  const summoner = await fetchCrossServerSummoner(account.alias.game_name, account.alias.tag_line, account.puuid)
                  if (summoner) byNameResult.value.push(summoner)
                }
              }
            else {
                const summoner2 = await getSummonerByName(type.value)
                byNameResult.value.push(summoner2.data)
            }
          } catch (error) {
            console.warn(`查找名称 ${type.value}`, error)
          }
        })()
      )
    }

    if (type.type === 'puuid') {
      tasks.push(
        (async () => {
          try {
            if (isCrossServer.value) {
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

  byNameResult.value = []
  bySummonerIdResult.value = undefined
  byPuuidResult.value = undefined

  await Promise.allSettled(tasks)

  if (byNameResult.value.length || bySummonerIdResult.value || byPuuidResult.value) {
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
