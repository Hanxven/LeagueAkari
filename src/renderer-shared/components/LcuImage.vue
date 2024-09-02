<template>
  <img
    @dragstart.prevent
    v-if="url"
    :src="url"
    class="lcu-image"
    @error="handleError"
  />
  <div ref="placeholderEl" v-else class="lcu-image-placeholder"></div>
</template>

<script lang="ts" setup>
import { addLeadingSlash } from '@shared/utils/uri'
import { ref, watchEffect } from 'vue'

import { useLcuConnectionStore } from '../modules/lcu-connection/store'

const props = defineProps<{
  src?: string
}>()

const url = ref<string | null>(null)
const lc = useLcuConnectionStore()

watchEffect(() => {
  if (lc.state === 'connected' && typeof props.src !== 'undefined') {
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
