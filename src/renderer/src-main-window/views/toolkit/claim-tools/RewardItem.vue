<template>
  <NPopover placement="right-end" :delay="500">
    <template #trigger>
      <div class="reward-item">
        <LcuImage class="icon" :src="iconUrl" />
        <div class="caption">{{ name }}</div>
      </div>
    </template>
    <div>
      <LcuImage
        :style="{
          width: '128px',
          marginBottom: '4px'
        }"
        :src="iconUrl"
      />
      <div
        :style="{
          textAlign: 'center'
        }"
      >
        {{ name }}
      </div>
    </div>
  </NPopover>
</template>

<script lang="ts" setup>
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { NPopover } from 'naive-ui'

const { name = '' } = defineProps<{
  iconUrl?: string
  name?: string
}>()
</script>

<style lang="less" scoped>
.reward-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 64px;

  .icon {
    width: 32px;
    aspect-ratio: 1;
    object-fit: cover;
    align-self: center;
  }

  .caption {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    text-align: center;
    font-size: 10px;
  }
}
</style>
