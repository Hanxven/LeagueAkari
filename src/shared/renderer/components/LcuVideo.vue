<template>
  <video v-bind="$attrs" loop autoplay v-if="url" :src="url" class="lcu-video" />
  <div v-else ref="placeholderEl" class="lcu-video-placeholder"></div>
</template>

<script lang="ts" setup>
import { useGameDataBlobUrl } from '../compositions/useGameDataBlobUrl'

const props = withDefaults(
  defineProps<{
    src?: string
    cache?: boolean
  }>(),
  {
    cache: true
  }
)

const { url, load } = useGameDataBlobUrl(() => props.src, false, props.cache)

load()

defineExpose({
  load
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
