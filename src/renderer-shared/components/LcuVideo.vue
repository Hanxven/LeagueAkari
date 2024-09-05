<template>
  <video v-bind="$attrs" :loop :autoplay v-if="url" :src="url" class="lcu-video" />
  <div v-else class="lcu-video-placeholder"></div>
</template>

<script lang="ts" setup>
import { addLeadingSlash } from '@shared/utils/uri'
import { ref, watchEffect } from 'vue'

import { useLcuConnectionStore } from '../modules/lcu-connection/store'

const props = defineProps<{
  src?: string
  loop?: boolean
  autoplay?: boolean
}>()

const url = ref<string | null>(null)
const lc = useLcuConnectionStore()

watchEffect(() => {
  if (lc.state === 'connected') {
    url.value = `akari://lcu${addLeadingSlash(props.src)}`
  } else {
    url.value = null
  }
})
</script>

<style lang="less" scoped>
.lcu-video {
  display: block;
}

.lcu-video-placeholder {
  color: rgb(103, 103, 103);
  background-color: rgb(56, 56, 56);
  border-radius: 4px;
}
</style>
