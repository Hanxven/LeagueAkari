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
  color: transparent;
}

[data-theme='dark'] {
  .beautiful-akari {
    background-image: linear-gradient(90deg, #91dcff, #91dcff 10%, #ff59cb 55%, #ffc1eb 100%);
  }
}

[data-theme='light'] {
  .beautiful-akari {
    background-image: linear-gradient(
      90deg,
      rgb(22, 155, 212),
      rgb(0, 174, 255) 10%,
      rgb(255, 26, 182) 55%,
      rgb(255, 71, 197) 100%
    );
  }
}

.akari-bold {
  font-weight: bold;
}
</style>
