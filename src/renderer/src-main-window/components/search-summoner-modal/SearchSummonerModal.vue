<template>
  <NModal
    transform-origin="center"
    v-model:show="show"
    :title="t('SearchSummonerModal.title')"
    size="small"
    :class="$style['search-summoner-modal']"
  >
    <NCard size="small" :bordered="false" :theme-overrides="{ colorModal: '#232329f4' }">
      <div class="input-line">
        <NSelect
          v-if="sgps.availability.region === 'TENCENT'"
          class="select"
          :consistent-menu-width="false"
          :placeholder="t('SearchSummonerModal.sgpServer')"
          v-model:value="sgpServerId"
          :disabled="searchProgress.isProcessing"
          :options="tencentServers"
        />
        <NInput
          class="input"
          :status="inputText.length === 0 || searchType !== 'invalid' ? 'success' : 'warning'"
          v-model:value="inputText"
          :placeholder="placeholderText"
          :disabled="searchProgress.isProcessing"
          @keyup.enter="handelSearch"
          clearable
          ref="input"
        />
        <NButton
          type="warning"
          v-if="searchType === 'fuzzy' && searchProgress.isProcessing"
          @click="handleCancel"
        >
          <template #icon>
            <CloseIcon />
          </template>
          {{ t('SearchSummonerModal.cancel') }}
        </NButton>
        <NButton
          type="primary"
          :disabled="inputText.length === 0 || searchType === 'invalid'"
          :loading="searchProgress.isProcessing"
          @click="handelSearch"
        >
          <template #icon>
            <SearchIcon />
          </template>
          {{ t('SearchSummonerModal.search') }}
        </NButton>
      </div>
      <NCollapseTransition
        class="section hint-text"
        :show="searchType === 'fuzzy' && !searchProgress.isProcessing"
      >
        {{ t('SearchSummonerModal.fuzzySearch') }}
      </NCollapseTransition>
      <NCollapseTransition
        class="section hint-text"
        :show="searchType === 'exact' && !searchProgress.isProcessing"
      >
        {{ t('SearchSummonerModal.exactSearch') }}
      </NCollapseTransition>
      <NCollapseTransition
        class="section hint-text"
        :show="searchType === 'puuid' && !searchProgress.isProcessing"
      >
        {{ t('SearchSummonerModal.puuidSearch') }}
      </NCollapseTransition>
      <NCollapseTransition
        class="section hint-text"
        :show="hasInvisibleChar && !searchProgress.isProcessing"
      >
        {{ t('SearchSummonerModal.hasInvisibleChar') }}
      </NCollapseTransition>
      <NCollapseTransition
        class="section warning-text"
        :show="inputText.length !== 0 && searchType === 'invalid' && !searchProgress.isProcessing"
      >
        {{ t('SearchSummonerModal.invalidInput') }}
      </NCollapseTransition>
      <NCollapseTransition
        class="section hint-text"
        :show="searchProgress.isProcessing && searchType === 'fuzzy'"
      >
        <NProgress
          type="line"
          :percentage="Math.floor((searchProgress.finish / searchProgress.total) * 100)"
          status="success"
          processing
        >
          {{
            t('SearchSummonerModal.validating', {
              current: searchProgress.finish,
              total: searchProgress.total
            })
          }}
        </NProgress>
      </NCollapseTransition>
      <NCollapseTransition
        class="section"
        :show="filteredSearchHistory.length > 0 && inputText.length === 0"
      >
        <div class="section-title">{{ t('SearchSummonerModal.history') }}</div>
        <div class="recent-searches">
          <div
            class="record"
            v-for="s of filteredSearchHistory"
            :key="s.puuid"
            @click="emits('toSummoner', s.puuid, s.sgpServerId, true)"
            @mouseup.prevent="handleSearchHistoryMouseUp($event, s)"
          >
            <div class="sgp-server" v-if="isSearchHistoryNeedToShowSgpServer">
              {{
                sgps.sgpServerConfig.serverNames[as.settings.locale][s.sgpServerId] || s.sgpServerId
              }}
            </div>
            <div class="game-name-line">{{ s.summoner.gameName }}</div>
            <div class="tag-line">#{{ s.summoner.tagLine }}</div>
            <NIcon class="close-icon" @click.stop="handleDeleteSearchHistory(s.puuid)"
              ><CloseIcon
            /></NIcon>
          </div>
        </div>
      </NCollapseTransition>
      <NCollapseTransition class="section" :show="searchResult.length > 0">
        <div class="section-title">{{ t('SearchSummonerModal.result') }}</div>
        <NScrollbar :class="$style['search-result-scroll']">
          <TransitionGroup tag="div" class="search-result-items" name="fade">
            <div
              class="search-result-item"
              @click="handleSearchResultToSummoner(result, true)"
              @mousedown="handleMouseDown"
              @mouseup.prevent="
                (event) =>
                  handleSearchResultMouseUp(event, result.puuid, result.sgpServerId, result)
              "
              v-for="result of searchResult"
              :key="result.puuid"
            >
              <LcuImage :src="profileIconUri(result.profileIconId)" class="profile-icon" />
              <div class="right-side">
                <div class="game-name-line">
                  <div class="game-name">{{ result.gameName }}</div>
                  <span class="small-tag level">LV. {{ result.summonerLevel }}</span>
                  <span class="small-tag private" v-if="result.privacy === 'PRIVATE'">{{
                    t('SearchSummonerModal.privacy')
                  }}</span>
                  <span
                    class="small-tag current-route"
                    v-if="isCurrentTab(result.puuid, result.sgpServerId)"
                    >{{ t('SearchSummonerModal.currentRoute') }}</span
                  >
                </div>
                <div class="tag-line">#{{ result.tagLine }}</div>
              </div>
            </div>
          </TransitionGroup>
        </NScrollbar>
      </NCollapseTransition>
      <NCollapseTransition class="section" :show="isEmpty">
        <div class="section-title">{{ t('SearchSummonerModal.result') }}</div>
        <div class="empty-result" v-if="searchProgress.type === 'fuzzy'">
          {{ t('SearchSummonerModal.validated', { countV: searchProgress.finish }) }}
          <span style="font-weight: bold">{{ searchText }}</span>
        </div>
        <div class="empty-result" v-else>
          {{ t('SearchSummonerModal.noResult') }}
          <span style="font-weight: bold">{{ searchText }}</span>
        </div>
      </NCollapseTransition>
    </NCard>
  </NModal>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { RiotClientRenderer } from '@renderer-shared/shards/riot-client'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { Close as CloseIcon, Search as SearchIcon } from '@vicons/carbon'
import { isAxiosError } from 'axios'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NCard,
  NCollapseTransition,
  NIcon,
  NInput,
  NModal,
  NProgress,
  NScrollbar,
  NSelect,
  useMessage
} from 'naive-ui'
import { computed, markRaw, nextTick, reactive, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'

import { MatchHistoryTabsRenderer, SearchHistoryItem } from '@main-window/shards/match-history-tabs'

const { t } = useTranslation()

const show = defineModel<boolean>('show', { default: false })
const lc = useInstance(LeagueClientRenderer)
const rc = useInstance(RiotClientRenderer)
const sgp = useInstance(SgpRenderer)

const mh = useInstance(MatchHistoryTabsRenderer)

const as = useAppCommonStore()
const sgps = useSgpStore()

const message = useMessage()

const emits = defineEmits<{
  toSummoner: [puuid: string, sgpServerId: string, setCurrent?: boolean]
}>()

const placeholderTexts = computed(() => {
  return [
    t('SearchSummonerModal.placeholders.0'),
    t('SearchSummonerModal.placeholders.1'),
    t('SearchSummonerModal.placeholders.2')
  ]
})

const placeholderText =
  placeholderTexts.value[Math.floor(Math.random() * placeholderTexts.value.length)]

/**
 * 识别 {gameName}#{tagLIne} 或 {fuzzyGameName} 的输入
 * @param nameStr
 */
const checkNameInput = (nameStr: string) => {
  return /^(?!\s+$)[^#]+(?:#[^#]+)?$/.test(nameStr)
}

const invisibleCharRegex =
  /[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF\u2060-\u2069\u202A-\u202E\uFFF9-\uFFFB]/g

const replaceInvisibleChar = (str: string) => {
  return str.replace(invisibleCharRegex, '')
}

const includesInvisibleChar = (str: string) => {
  return invisibleCharRegex.test(str)
}

const isPuuid = (str: string) => {
  const trimmed = str.trim()
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    trimmed
  )
}

const inputText = ref('')
const searchText = ref('')

const searchResult = ref<SearchResult[]>([])
const isEmpty = ref(false)

const searchHistory = shallowRef<SearchHistoryItem[]>([])

// 保证一些不该出现的玩家不会在这里出现
const filteredSearchHistory = computed(() => {
  if (sgps.availability.region === 'TENCENT') {
    return searchHistory.value.filter((item) => {
      return sgps.sgpServerConfig.tencentServerMatchHistoryInteroperability.includes(
        item.sgpServerId
      )
    })
  }

  return searchHistory.value.filter((item) => {
    return item.sgpServerId === sgps.availability.sgpServerId
  })
})

const isSearchHistoryNeedToShowSgpServer = computed(() => {
  const count: Record<string, number> = {}
  for (const h of filteredSearchHistory.value) {
    if (count[h.sgpServerId]) {
      count[h.sgpServerId]++
    } else {
      count[h.sgpServerId] = 1
    }
  }

  return Object.keys(count).length > 1 || !count[sgps.availability.sgpServerId]
})

const searchProgress = reactive({
  isProcessing: false,
  type: 'fuzzy' as 'fuzzy' | 'exact' | 'puuid',
  total: 0,
  finish: 0
})

const searchType = computed(() => {
  if (isPuuid(inputText.value)) {
    return 'puuid'
  }

  if (checkNameInput(inputText.value)) {
    return inputText.value.includes('#') ? 'exact' : 'fuzzy'
  }

  return 'invalid'
})

const hasInvisibleChar = computed(() => {
  return includesInvisibleChar(inputText.value)
})

const sgpServerId = ref('')

// 腾讯服务器特例
const tencentServers = computed(() => {
  if (sgps.availability.region !== 'TENCENT') {
    return []
  }

  // 出于硬编码, 这里仅仅使用 match-history 的互操作性预定义表
  return sgps.sgpServerConfig.tencentServerMatchHistoryInteroperability.map((serverId) => {
    return {
      label: sgps.sgpServerConfig.serverNames[as.settings.locale]?.[serverId] || serverId,
      value: serverId
    }
  })
})

const inputEl = useTemplateRef('input')

watch(
  () => show.value,
  (show) => {
    if (show) {
      inputText.value = ''
      searchText.value = ''
      searchResult.value = []
      searchProgress.total = 0
      searchProgress.finish = 0
      isEmpty.value = false
      searchProgress.isProcessing = false
      sgpServerId.value = sgps.availability.sgpServerId
      mh.getSearchHistory().then((history) => {
        searchHistory.value = history
      })
      nextTick(() => inputEl.value?.focus())
    } else {
      searchProgress.isProcessing = false
    }
  },
  { immediate: true }
)

// 如果区服发生变化, 特例腾讯服的设置将重置
watch(
  () => sgps.availability.region,
  (region) => {
    if (region !== 'TENCENT') {
      sgpServerId.value = sgps.availability.sgpServerId
    }
  },
  { immediate: true }
)

watch(
  () => searchProgress.isProcessing,
  (p) => {
    if (!p) {
      nextTick(() => inputEl.value?.focus())
    }
  }
)

const route = useRoute()

const isCurrentTab = (puuid: string, sgpServerId: string) => {
  return (
    route.name === 'match-history' &&
    route.params.puuid === puuid &&
    route.params.sgpServerId === sgpServerId
  )
}

interface SearchResult {
  puuid: string
  gameName: string
  tagLine: string
  profileIconId: number
  sgpServerId: string
  privacy: string
  summonerLevel: number
}

const handleError = (error: unknown, on404?: () => void) => {
  if (isAxiosError(error)) {
    if (error.response?.status === 404) {
      on404?.()
      return
    } else {
      message.warning(`尝试查询时发生错误: ${error.message}`)
    }
  } else if (error instanceof Error) {
    message.warning(`尝试查询时发生错误: ${error.message}`)
  }
}

const handleCancel = () => {
  searchProgress.isProcessing = false
}

// 三种搜索条件: puuid, fuzzy, exact
// 每种搜索都会考虑是否是跨区查询, 以应用不同的逻辑
const handelSearch = async () => {
  if (searchType.value === 'invalid') {
    return
  }

  if (searchProgress.isProcessing) {
    return
  }

  searchProgress.total = 0
  searchProgress.finish = 0
  isEmpty.value = false
  searchResult.value = []

  if (searchType.value === 'puuid') {
    searchProgress.type = 'puuid'
    searchText.value = inputText.value.trim()

    if (sgpServerId.value === sgps.availability.sgpServerId) {
      try {
        searchProgress.isProcessing = true

        const { data: summoner } = await lc.api.summoner.getSummonerByPuuid(searchText.value)

        searchResult.value.push(
          markRaw({
            puuid: summoner.puuid,
            gameName: summoner.gameName,
            tagLine: summoner.tagLine,
            profileIconId: summoner.profileIconId,
            sgpServerId: sgpServerId.value,
            privacy: summoner.privacy,
            summonerLevel: summoner.summonerLevel
          })
        )
      } catch (error) {
        handleError(error, () => {
          isEmpty.value = true
        })
      } finally {
        searchProgress.isProcessing = false
      }
    } else {
      try {
        searchProgress.isProcessing = true

        const summoner = await sgp.getSummonerLcuFormat(searchText.value, sgpServerId.value)

        if (!summoner) {
          isEmpty.value = true
          return
        }

        // 尝试补全名称, 失败了也不影响
        try {
          const { data: nameset } = await rc.api.playerAccount.getPlayerAccountNameset([
            searchText.value
          ])

          if (nameset.namesets.length !== 0) {
            const gnt = nameset.namesets[0].gnt
            summoner.gameName = gnt.gameName
            summoner.tagLine = gnt.tagLine
          }
        } catch {}

        searchResult.value.push(
          markRaw({
            puuid: searchText.value,
            gameName: summoner.gameName,
            tagLine: summoner.tagLine,
            profileIconId: summoner.profileIconId,
            sgpServerId: sgpServerId.value,
            privacy: summoner.privacy,
            summonerLevel: summoner.summonerLevel
          })
        )
      } catch (error) {
        handleError(error)
      } finally {
        searchProgress.isProcessing = false
      }
    }

    return
  }

  searchText.value = replaceInvisibleChar(inputText.value)

  if (searchType.value === 'fuzzy') {
    searchProgress.type = 'fuzzy'
    try {
      searchProgress.isProcessing = true

      const { data: aliases } = await rc.api.playerAccount.getPlayerAccountAlias(
        searchText.value.trim()
      )

      if (aliases.length === 0) {
        isEmpty.value = true
        return
      }

      // 对于每个玩家, 都需要判定其是否存在
      searchProgress.total = aliases.length
      let added = 0

      if (sgpServerId.value === sgps.availability.sgpServerId) {
        for (const alias of aliases) {
          if (!searchProgress.isProcessing) {
            break
          }

          try {
            const { data: summoner } = await lc.api.summoner.getSummonerByPuuid(alias.puuid)

            searchResult.value.push(
              markRaw({
                puuid: summoner.puuid,
                gameName: summoner.gameName,
                tagLine: summoner.tagLine,
                profileIconId: summoner.profileIconId,
                sgpServerId: sgpServerId.value,
                privacy: summoner.privacy,
                summonerLevel: summoner.summonerLevel
              })
            )
            added++
          } catch (error) {
            handleError(error)
          } finally {
            searchProgress.finish++
          }
        }

        if (added === 0) {
          isEmpty.value = true
        }
      } else {
        for (const alias of aliases) {
          if (!searchProgress.isProcessing) {
            break
          }

          try {
            const summoner = await sgp.getSummonerLcuFormat(alias.puuid, sgpServerId.value)

            if (!summoner) {
              continue
            }

            searchResult.value.push(
              markRaw({
                puuid: alias.puuid,
                gameName: alias.alias.game_name,
                tagLine: alias.alias.tag_line,
                profileIconId: summoner.profileIconId,
                sgpServerId: sgpServerId.value,
                privacy: summoner.privacy,
                summonerLevel: summoner.summonerLevel
              })
            )
            added++
          } catch (error) {
            handleError(error)
          } finally {
            searchProgress.finish++
          }
        }

        if (added === 0) {
          isEmpty.value = true
        }
      }
    } catch (error) {
      handleError(error)
    } finally {
      searchProgress.isProcessing = false
    }
  } else {
    searchProgress.type = 'exact'
    try {
      searchProgress.isProcessing = true
      const [gameName, tagLine] = searchText.value.split('#')
      const { data: aliases } = await rc.api.playerAccount.getPlayerAccountAlias(
        gameName.trim(),
        tagLine.trim()
      )

      if (aliases.length === 0) {
        isEmpty.value = true
        return
      }

      const alias = aliases[0]

      // 同区查询只需用 LCU API, 以保证最大的可用性
      if (sgpServerId.value === sgps.availability.sgpServerId) {
        const { data: summoner } = await lc.api.summoner.getSummonerByPuuid(alias.puuid)
        searchResult.value.push(
          markRaw({
            puuid: summoner.puuid,
            gameName: summoner.gameName,
            tagLine: summoner.tagLine,
            profileIconId: summoner.profileIconId,
            sgpServerId: sgpServerId.value,
            privacy: summoner.privacy,
            summonerLevel: summoner.summonerLevel
          })
        )
      } else {
        const summoner = await sgp.getSummonerLcuFormat(alias.puuid, sgpServerId.value)

        if (!summoner) {
          isEmpty.value = true
          return
        }

        searchResult.value.push(
          markRaw({
            puuid: alias.puuid,
            gameName: alias.alias.game_name,
            tagLine: alias.alias.tag_line,
            profileIconId: summoner.profileIconId,
            sgpServerId: sgpServerId.value,
            privacy: summoner.privacy,
            summonerLevel: summoner.summonerLevel
          })
        )
      }
    } catch (error) {
      handleError(error, () => {
        isEmpty.value = true
      })
    } finally {
      searchProgress.isProcessing = false
    }
  }
}

const handleMouseDown = (event: MouseEvent) => {
  if (event.button === 1) {
    event.preventDefault()
  }
}

const handleSaveSearchHistory = async (result: SearchResult) => {
  await mh.saveSearchHistory({
    puuid: result.puuid,
    sgpServerId: result.sgpServerId,
    summoner: { gameName: result.gameName, tagLine: result.tagLine }
  })
  searchHistory.value = await mh.getSearchHistory()
}

const handleDeleteSearchHistory = async (puuid: string) => {
  await mh.deleteSearchHistory(puuid)
  searchHistory.value = await mh.getSearchHistory()
}

const handleSearchHistoryMouseUp = (
  event: MouseEvent,

  item: SearchHistoryItem
) => {
  if (event.button === 1) {
    emits('toSummoner', item.puuid, item.sgpServerId, false)
  }
}

const handleSearchResultToSummoner = (result: SearchResult, setCurrent: boolean) => {
  emits('toSummoner', result.puuid, result.sgpServerId, setCurrent)
  handleSaveSearchHistory(result)
}

const handleSearchResultMouseUp = (
  event: MouseEvent,
  puuid: string,
  sgpServerId: string,
  result: SearchResult
) => {
  if (event.button === 1) {
    emits('toSummoner', puuid, sgpServerId, false)
    handleSaveSearchHistory(result)
  }
}
</script>

<style lang="less" scoped>
.input-line {
  width: 100%;
  display: flex;
  gap: 4px;

  .select {
    width: 102px;
    flex-shrink: 0;
  }

  .input {
    font-family: unset;
  }
}

.recent-searches {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  row-gap: 4px;
  column-gap: 4px;

  .record {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    display: flex;
    align-items: center;
    padding: 2px 8px;
    gap: 4px;
    transition: background-color 0.2s;
    cursor: pointer;

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }

    .sgp-server {
      font-size: 10px;
      font-weight: bold;
      color: rgba(174, 245, 219, 0.8);
      border-radius: 2px;
    }

    .game-name-line {
      font-size: 12px;
      font-weight: bold;
      color: rgba(255, 255, 255, 1);
    }

    .tag-line {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.6);
    }

    .close-icon {
      transition: background-color 0.2s;
      cursor: pointer;
      border-radius: 2px;

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
  }
}

.warning-text {
  font-size: 12px;
  color: #f2c97d;
}

.hint-text {
  color: #63e2b7;
  font-size: 12px;
}

.search-result-scroll {
  .content {
    background-color: red;
    height: 600px;
    width: 100%;
  }
}

.section {
  margin-top: 8px;

  .section-title {
    font-size: 13px;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 4px;
  }
}

.empty-result {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.search-result-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;

  .search-result-item {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    height: 42px;
    border-radius: 2px;
    background-color: rgba(0, 0, 0, 0.6);
    cursor: pointer;
    transition:
      background-color 0.2s,
      opacity 0.2s; // opacity here to match TransitionGroup#fade

    &:hover {
      background-color: rgba(0, 0, 0, 0.4);
    }

    .profile-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }

    .right-side {
      display: flex;
      flex-direction: column;
      margin-left: 8px;
      width: 0;
      flex: 1;

      .game-name-line {
        display: flex;
        align-items: center;
        gap: 4px;

        .game-name {
          font-size: 12px;
          font-weight: bold;
          color: rgba(255, 255, 255, 1);
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }

        .small-tag {
          border-radius: 2px;
          padding: 0 4px;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.8);
          flex-shrink: 0;
        }

        .current-route {
          background-color: rgba(0, 237, 59, 0.4);
        }

        .level {
          background-color: rgba(0, 166, 237, 0.4);
        }

        .private {
          background-color: rgba(255, 0, 0, 0.3);
        }
      }

      .tag-line {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }
}
</style>

<style lang="less" module>
.search-summoner-modal {
  max-width: 600px;
}

.search-result-scroll {
  max-height: 30vh;

  .content {
    background-color: red;
    height: 600px;
    width: 100%;
  }
}
</style>
