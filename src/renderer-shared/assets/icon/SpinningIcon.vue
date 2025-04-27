<template>
  <svg viewBox="0 0 100 100" aria-label="Loading" role="img">
    <circle
      class="spin-ring"
      cx="50"
      cy="50"
      r="45"
      fill="none"
      stroke="currentColor"
      stroke-width="8"
      stroke-linecap="round"
      stroke-dasharray="212 70"
    />
    <text
      x="50"
      y="50"
      dy="0.08em"
      text-anchor="middle"
      dominant-baseline="middle"
      font-size="60"
      fill="currentColor"
    >
      {{ Math.min(count, 9) }}
    </text>
  </svg>
</template>

<script setup lang="ts">
const { count = 1 } = defineProps<{ count?: number }>()
</script>

<style scoped>
.spin-ring {
  animation: spin 2s linear infinite;
  transform-box: fill-box;
  transform-origin: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
