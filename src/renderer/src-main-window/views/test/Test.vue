<template>
  <div>
    <ShortcutSelectionModal v-model:show="show" @submit="(id) => showIt(id)" />
    <NButton @click="show = true">什么</NButton>
  </div>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui'
import { ref } from 'vue'

import ShortcutSelectionModal from '@main-window/components/ShortcutSelectionModal.vue'

const show = ref(false)

const showIt = (id: string) => {
  show.value = false
}
</script>
