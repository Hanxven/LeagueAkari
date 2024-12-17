<template>
  <div>
    <ShortcutSelector v-model:show="show" @submit="(id) => showIt(id)" />
    <SearchSummonerModal v-model:show="show2" />
    <FunnyPricing v-model:show="show3" />
    <NButton @click="show = true">快捷键对话框</NButton>
    <NButton @click="show2 = true">召唤师搜索对话框</NButton>
    <NButton @click="show3 = true">价位表页面</NButton>
    <ChampionConfig />
  </div>
</template>

<script setup lang="ts">
import { NButton, useMessage } from 'naive-ui'
import { ref } from 'vue'

import ShortcutSelector from '@main-window/components/ShortcutSelector.vue'
import ChampionConfig from '@main-window/components/auto-champ-config/ChampionConfig.vue'
import FunnyPricing from '@main-window/components/easter-eggs/FunnyPricing.vue'
import SearchSummonerModal from '@main-window/components/search-summoner-modal/SearchSummonerModal.vue'

const show = ref(false)
const show2 = ref(false)
const show3 = ref(false)
const show4 = ref(false)

const message = useMessage()
const showIt = (id: string) => {
  show.value = false
  message.success(`快捷键 ${id}`)
}
</script>
