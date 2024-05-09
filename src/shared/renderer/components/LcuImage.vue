<template>
  <img @dragstart.prevent v-bind="$attrs" v-if="url" :src="url" class="lcu-image" />
  <div ref="placeholderEl" v-else class="lcu-image-placeholder"></div>
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

// 直接在 beforeCreate 的时候就加载
const { url, load } = useGameDataBlobUrl(() => props.src, true, props.cache)

defineExpose({
  load
})
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
