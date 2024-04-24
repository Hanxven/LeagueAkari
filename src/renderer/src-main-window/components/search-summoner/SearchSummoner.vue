<template>
  <div class="search-wrapper">
    <div class="search-inner">
      <div class="search-input-area">
        <NAutoComplete
          :get-show="() => false"
          :options="autoCompleteOptions"
          @focus="generateCompleteOptions"
          ref="inputEl"
          class="search-input"
          :status="isTagNeeded ? 'warning' : 'success'"
          v-model:value="inputText"
          @keyup.enter="handleSearch"
          :disabled="isSearching"
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
        />
        <SummonerCard
          class="card"
          v-if="bySummonerIdResult"
          condition="id"
          :summoner="bySummonerIdResult"
          :search-text="searchText"
        />
        <SummonerCard
          class="card"
          v-if="byPuuidResult"
          condition="puuid"
          :summoner="byPuuidResult"
          :search-text="searchText"
        />
      </div>
      <div class="empty" v-if="isNoSearchResult" size="small">没有符合条件的用户</div>
      <div
        class="empty"
        v-if="!isNoSearchResult && !byNameResult && !bySummonerIdResult && !byPuuidResult"
        size="small"
      >
        输入召唤师名称、ID 或 PUUID，开始精确搜索
        <template v-if="summoner.newIdSystemEnabled">
          <span>该大区启用了新 ID 系统</span>
          <span :class="{ 'need-tag': isTagNeeded }" class="need-tag-hint"
            >召唤师名称查询需满足格式 &lt;名称&gt;#&lt;TAG&gt;</span
          >
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SummonerInfo } from '@shared/types/lcu/summoner'
import { AutoCompleteOption, NAutoComplete, NButton } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'

import { useSummonerStore } from '@main-window/features/lcu-state-sync/summoner'
import {
  getSummoner,
  getSummonerAlias,
  getSummonerByName,
  getSummonerByPuuid
} from '@shared/renderer-http-api/summoner'
import { inferType, resolveSummonerName } from '@shared/utils/identity'

import SummonerCard from './SummonerCard.vue'

const summoner = useSummonerStore()

const inputText = ref('')
const searchText = ref('')

const inputEl = ref()

const isNoSearchResult = ref(false)

const bySummonerIdResult = ref<SummonerInfo>()
const byNameResult = ref<SummonerInfo>()
const byPuuidResult = ref<SummonerInfo>()

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

  if (!isNumeric(inputText.value)) {
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

  const inferredTypes = inferType(inputText.value)
  const tasks: Promise<void>[] = []

  for (const type of inferredTypes) {
    if (type.type === 'name') {
      tasks.push(
        (async () => {
          if (type.isWithTagLine) {
            const [name, tag] = resolveSummonerName(type.value)
            const summoner2 = await getSummonerAlias(name, tag)
            if (summoner2) {
              byNameResult.value = summoner2
            }
          } else {
            const summoner2 = await getSummonerByName(type.value)
            byNameResult.value = summoner2.data
          }
        })()
      )
    }
    if (type.type === 'puuid') {
      tasks.push(
        (async () => {
          const summoner = await getSummonerByPuuid(type.value)
          byPuuidResult.value = summoner.data
        })()
      )
    }
    if (type.type === 'summonerId') {
      tasks.push(
        (async () => {
          const summoner = await getSummoner(type.value)
          bySummonerIdResult.value = summoner.data
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

const autoCompleteOptions = ref<AutoCompleteOption[]>([])
const generateCompleteOptions = async () => {
  try {
    const text = await navigator.clipboard.readText()

    if (!text) {
      autoCompleteOptions.value = []
      return
    }

    autoCompleteOptions.value = [{ label: text, value: text }]
  } catch {}
}

onMounted(() => {
  inputEl.value?.focus()
})
</script>

<style lang="less" scoped>
.search-wrapper {
  height: 100%;
  overflow-y: scroll;
  padding: 0 24px;
}

.search-inner {
  margin: 0 auto;
  padding: 24px 0;
  max-width: 800px;
}

.search-input-area {
  display: flex;
  gap: 8px;
  padding: 4px;
  border: 1px solid rgb(60, 60, 60);
  border-radius: 4px;
  box-sizing: border-box;
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
