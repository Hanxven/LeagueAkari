<template>
  <div>
    <ShortcutSelectionModal v-model:show="show" @submit="(id) => showIt(id)" />
    <NButton @click="show = true">快捷键对话框</NButton>
    <SearchSummonerModal v-model:show="show2" />
    <NButton @click="show2 = true">召唤师搜索对话框</NButton>
  </div>
</template>

<script setup lang="ts">
import { useKeyboardCombo } from '@renderer-shared/compositions/useKeyboardCombo'
import { useInstance } from '@renderer-shared/shards'
import { NButton } from 'naive-ui'
import { ref } from 'vue'

import ShortcutSelectionModal from '@main-window/components/ShortcutSelectionModal.vue'
import SearchSummonerModal from '@main-window/components/search-summoner-modal/SearchSummonerModal.vue'
import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'

const show = ref(false)
const show2 = ref(false)

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
