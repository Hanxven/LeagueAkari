<template>
  <NModal
    transform-origin="center"
    v-model:show="show"
    title="召唤师搜索"
    size="small"
    :class="$style['search-summoner-modal']"
  >
    <NCard size="small" :bordered="false" :theme-overrides="{ colorModal: '#232329f4' }">
      <div class="input-line">
        <NSelect
          v-if="sgps.availability.region === 'TENCENT'"
          class="select"
          placeholder="区服"
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
          取消
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
          搜索玩家
        </NButton>
      </div>
      <NCollapseTransition
        class="section hint-text"
        :show="searchType === 'fuzzy' && !searchProgress.isProcessing"
      >
        当前为模糊搜索：搜索所有满足名称的召唤师
      </NCollapseTransition>
      <NCollapseTransition
        class="section hint-text"
        :show="searchType === 'exact' && !searchProgress.isProcessing"
      >
        当前为精确搜索：搜索指定名称和标签的召唤师
      </NCollapseTransition>
      <NCollapseTransition
        class="section hint-text"
        :show="searchType === 'puuid' && !searchProgress.isProcessing"
      >
        当前为精确搜索：搜索指定 PUUID
      </NCollapseTransition>
      <NCollapseTransition
        class="section hint-text"
        :show="hasInvisibleChar && !searchProgress.isProcessing"
      >
        当前搜索文本包含不可见字符，将被过滤
      </NCollapseTransition>
      <NCollapseTransition
        class="section warning-text"
        :show="inputText.length !== 0 && searchType === 'invalid' && !searchProgress.isProcessing"
      >
        当前输入不符合格式要求：应为 "游戏名称#标签" 或 "游戏名称"
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
          正在验证玩家 ({{ searchProgress.finish }} / {{ searchProgress.total }})
        </NProgress>
      </NCollapseTransition>
      <NCollapseTransition
        class="section"
        :show="recentSearches.length > 0 && inputText.length === 0"
      >
        <div class="section-title">历史搜索</div>
        <div class="recent-searches">
          <div class="record" v-for="s of recentSearches" :key="s.puuid">
            <div class="sgp-server">
              {{ sgps.availability.sgpServers.servers[s.sgpServerId]?.name || s.sgpServerId }}
            </div>
            <div class="game-name-line">{{ s.gameName }}</div>
            <div class="tag-line">#{{ s.tagLine }}</div>
            <NIcon class="close-icon"><CloseIcon /></NIcon>
          </div>
        </div>
      </NCollapseTransition>
      <NCollapseTransition class="section" :show="searchResult.length > 0">
        <div class="section-title">搜索结果</div>
        <NScrollbar :class="$style['search-result-scroll']">
          <div class="search-result-items">
            <div
              class="search-result-item"
              @click="emits('toSummoner', result.puuid, result.sgpServerId, true)"
              @mousedown="handleMouseDown"
              @mouseup.prevent="(event) => handleMouseUp(event, result.puuid, result.sgpServerId)"
              v-for="result of searchResult"
              :key="result.puuid"
            >
              <LcuImage :src="profileIconUri(result.profileIconId)" class="profile-icon" />
              <div class="right-side">
                <div class="game-name-line">
                  <div class="game-name">{{ result.gameName }}</div>
                  <span class="small-tag level">LV. {{ result.summonerLevel }}</span>
                  <span class="small-tag private" v-if="result.privacy === 'PRIVATE'"
                    >生涯隐藏</span
                  >
                  <span
                    class="small-tag current-route"
                    v-if="isCurrentTab(result.puuid, result.sgpServerId)"
                    >当前</span
                  >
                </div>
                <div class="tag-line">#{{ result.tagLine }}</div>
              </div>
            </div>
          </div>
        </NScrollbar>
      </NCollapseTransition>
      <NCollapseTransition class="section" :show="isEmpty">
        <div class="section-title">搜索结果</div>
        <div class="empty-result" v-if="searchProgress.type === 'fuzzy'">
          验证了 {{ searchProgress.finish }} 条可能的玩家记录，无搜索结果符合
          <span style="font-weight: bold">{{ searchText }}</span>
        </div>
        <div class="empty-result" v-else>
          无搜索结果符合
          <span style="font-weight: bold">{{ searchText }}</span>
        </div>
      </NCollapseTransition>
    </NCard>
  </NModal>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { RiotClientRenderer } from '@renderer-shared/shards/riot-client'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { Close as CloseIcon, Search as SearchIcon } from '@vicons/carbon'
import { isAxiosError } from 'axios'
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
import { computed, nextTick, reactive, ref, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'

const show = defineModel<boolean>('show', { default: false })
const lc = useInstance<LeagueClientRenderer>('league-client-renderer')
const rc = useInstance<RiotClientRenderer>('riot-client-renderer')
const sgp = useInstance<SgpRenderer>('sgp-renderer')

const sgps = useSgpStore()

const message = useMessage()

const emits = defineEmits<{
  toSummoner: [puuid: string, sgpServerId: string, setCurrent?: boolean]
}>()

const PLACEHOLDER_TEXTS = [
  '查询召唤师 - 格式如：赤座灯里#akari',
  '查询召唤师 - 格式如：岁纳京子#kyoko',
  '查询召唤师 - 格式如：船见结衣#yui',
  '查询召唤师 - 格式如：杉浦绫乃#ayano',
  '查询召唤师 - 格式如：大室樱子#sakur',
  '查询召唤师 - 格式如：古谷向日葵#himaw'
]

const placeholderText = PLACEHOLDER_TEXTS[Math.floor(Math.random() * PLACEHOLDER_TEXTS.length)]

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
  return sgps.availability.sgpServers.tencentServerMatchHistoryInteroperability.map((serverId) => {
    return {
      label: sgps.availability.sgpServers.servers[serverId].name,
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

const route = useRoute()

const isCurrentTab = (puuid: string, sgpServerId: string) => {
  return (
    route.name === 'match-history' &&
    route.params.puuid === puuid &&
    route.params.sgpServerId === sgpServerId
  )
}

const recentSearches = ref<
  {
    sgpServerId: string
    gameName: string
    tagLine: string
    puuid: string
  }[]
>([
  {
    sgpServerId: 'YuriYuri',
    gameName: '赤座灯里',
    tagLine: 'akari',
    puuid: '763dbd6d-1d2b-55a6-b4ed-f2020fe7e4cc'
  },
  {
    sgpServerId: 'TENCENT_HN10',
    gameName: '岁纳京子',
    tagLine: 'kyoko',
    puuid: '763dbd6d-1d2b-55a6-b4ed-f2020fe7e4cc'
  },
  {
    sgpServerId: 'TENCENT_HN10',
    gameName: '船见结衣',
    tagLine: 'yui',
    puuid: '763dbd6d-1d2b-55a6-b4ed-f2020fe7e4cc'
  },
  {
    sgpServerId: 'TENCENT_HN10',
    gameName: '杉浦绫乃',
    tagLine: 'ayano',
    puuid: '763dbd6d-1d2b-55a6-b4ed-f2020fe7e4cc'
  },
  {
    sgpServerId: 'TENCENT_HN10',
    gameName: '大室樱子',
    tagLine: 'sakur',
    puuid: '763dbd6d-1d2b-55a6-b4ed-f2020fe7e4cc'
  },
  {
    sgpServerId: 'TENCENT_HN1',
    gameName: '古谷向日葵',
    tagLine: 'himaw',
    puuid: '763dbd6d-1d2b-55a6-b4ed-f2020fe7e4cc'
  }
])

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

        searchResult.value.push({
          puuid: summoner.puuid,
          gameName: summoner.gameName,
          tagLine: summoner.tagLine,
          profileIconId: summoner.profileIconId,
          sgpServerId: sgpServerId.value,
          privacy: summoner.privacy,
          summonerLevel: summoner.summonerLevel
        })
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

        searchResult.value.push({
          puuid: searchText.value,
          gameName: summoner.gameName,
          tagLine: summoner.tagLine,
          profileIconId: summoner.profileIconId,
          sgpServerId: sgpServerId.value,
          privacy: summoner.privacy,
          summonerLevel: summoner.summonerLevel
        })
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

            searchResult.value.push({
              puuid: summoner.puuid,
              gameName: summoner.gameName,
              tagLine: summoner.tagLine,
              profileIconId: summoner.profileIconId,
              sgpServerId: sgpServerId.value,
              privacy: summoner.privacy,
              summonerLevel: summoner.summonerLevel
            })
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

            searchResult.value.push({
              puuid: alias.puuid,
              gameName: alias.alias.game_name,
              tagLine: alias.alias.tag_line,
              profileIconId: summoner.profileIconId,
              sgpServerId: sgpServerId.value,
              privacy: summoner.privacy,
              summonerLevel: summoner.summonerLevel
            })
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
        searchResult.value.push({
          puuid: summoner.puuid,
          gameName: summoner.gameName,
          tagLine: summoner.tagLine,
          profileIconId: summoner.profileIconId,
          sgpServerId: sgpServerId.value,
          privacy: summoner.privacy,
          summonerLevel: summoner.summonerLevel
        })
      } else {
        const summoner = await sgp.getSummonerLcuFormat(alias.puuid, sgpServerId.value)

        if (!summoner) {
          isEmpty.value = true
          return
        }

        searchResult.value.push({
          puuid: alias.puuid,
          gameName: alias.alias.game_name,
          tagLine: alias.alias.tag_line,
          profileIconId: summoner.profileIconId,
          sgpServerId: sgpServerId.value,
          privacy: summoner.privacy,
          summonerLevel: summoner.summonerLevel
        })
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

const handleMouseUp = (event: MouseEvent, puuid: string, sgpServerId: string) => {
  if (event.button === 1) {
    emits('toSummoner', puuid, sgpServerId, false)
  }
}
</script>

<style lang="less" scoped>
.input-line {
  width: 100%;
  display: flex;
  gap: 4px;

  .select {
    width: 180px;
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
      color: rgba(255, 255, 255, 0.8);
      text-align: center;
      background-color: rgba(#33745e, 0.8);
      border-radius: 2px;
      padding: 0 4px;
    }

    .game-name-line {
      font-size: 12px;
      color: rgba(255, 255, 255, 1);
      text-align: center;
    }

    .tag-line {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.8);
      text-align: center;
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
    transition: background-color 0.2s;

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
