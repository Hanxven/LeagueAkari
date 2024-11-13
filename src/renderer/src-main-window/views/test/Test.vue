<template>
  <div>
    <ShortcutSelectionModal v-model:show="show" @submit="(id) => showIt(id)" />
    <SearchSummonerModal v-model:show="show2" />
    <FunnyPricing v-model:show="show3" />
    <NButton @click="show = true">快捷键对话框</NButton>
    <NButton @click="show2 = true">召唤师搜索对话框</NButton>
    <NButton @click="show3 = true">价位表页面</NButton>
  </div>
</template>

<script setup lang="ts">
import { useKeyboardCombo } from '@renderer-shared/compositions/useKeyboardCombo'
import { useInstance } from '@renderer-shared/shards'
import { NButton } from 'naive-ui'
import { ref } from 'vue'

import FunnyPricing from '@main-window/components/easter-eggs/FunnyPricing.vue'
import ShortcutSelectionModal from '@main-window/components/ShortcutSelectionModal.vue'
import SearchSummonerModal from '@main-window/components/search-summoner-modal/SearchSummonerModal.vue'
import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'

const show = ref(false)
const show2 = ref(false)
const show3 = ref(false)

const showIt = (id: string) => {
  show.value = false
}

const mh = useInstance<MatchHistoryTabsRenderer>('match-history-tabs-renderer')
const { navigateToTabByPuuidAndSgpServerId } = mh.useNavigateToTab()

useKeyboardCombo('gogo', {
  onFinish: () => {
    navigateToTabByPuuidAndSgpServerId('763dbd6d-1d2b-55a6-b4ed-f2020fe7e4cc', 'TENCENT_HN10')
  }
})
</script>
