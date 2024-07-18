<template>
  <span class="beautiful-akari" :class="{ 'akari-bold': bold }">{{ text ?? 'League Akari' }}</span>
</template>

<script setup lang="ts">
defineProps<{
  bold?: boolean
  text?: string
}>()
</script>

<style lang="less" scoped>
.beautiful-akari {
  background-clip: text;
  background-image: linear-gradient(90deg, #91dcff, #91dcff 10%, #ff59cb 55%, #ffc1eb 100%);
  color: transparent;
}

.akari-bold {
  font-weight: bold;
}
</style>
