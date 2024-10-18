<template>
  <img @dragstart.prevent v-if="url" :src="url" class="lcu-image" @error="handleError" />
  <div v-else class="lcu-image-placeholder"></div>
</template>

<script lang="ts" setup>
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { addLeadingSlash } from '@shared/utils/uri'
import { ref, watchEffect } from 'vue'

const props = defineProps<{
  src?: string
}>()

const url = ref<string | null>(null)
const lcs = useLeagueClientStore()

watchEffect(() => {
  if (lcs.connectionState === 'connected' && typeof props.src !== 'undefined') {
    url.value = `akari://lcu${addLeadingSlash(props.src)}`
  } else {
    url.value = null
  }
})

const handleError = () => {
  url.value = null
}
</script>

<style lang="less" scoped>
.lcu-image {
  display: block;
}

.lcu-image-placeholder {
  color: rgb(103, 103, 103);
  background-color: rgb(56, 56, 56);
  border-radius: 4px;
}
</style>
