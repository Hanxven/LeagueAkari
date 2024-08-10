<template>
  <div class="champion-icon-container" :class="{ round: round }">
    <LcuImage
      class="champion-icon-stretched"
      :src="championId ? `/lol-game-data/assets/v1/champion-icons/${championId}.png` : undefined"
    />
    <div v-if="ring && round" class="ring"></div>
  </div>
</template>

<script lang="ts" setup>
import LcuImage from '../LcuImage.vue'

defineProps<{
  championId?: number
  round?: boolean
  ring?: boolean
  ringColor?: string
}>()
</script>

<style lang="less" scoped>
.champion-icon-container {
  position: relative;
  overflow: hidden;

  // default size
  width: 64px;
  height: 64px;

  &.round {
    border-radius: 50%;
  }

  .champion-icon-stretched {
    width: 112%;
    height: 112%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .ring {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 2px solid v-bind("ringColor || '#2a947d'");
    border-radius: 50%;
    box-sizing: border-box;
  }
}
</style>
