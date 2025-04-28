<template>
  <svg viewBox="0 0 100 100" aria-label="Loading" role="img">
    <circle
      class="base-ring"
      cx="50"
      cy="50"
      r="45"
      fill="none"
      stroke="currentColor"
      stroke-width="8"
      stroke-linecap="round"
    />
    <circle
      class="spin-ring"
      cx="50"
      cy="50"
      r="45"
      fill="none"
      stroke="currentColor"
      stroke-width="8"
      stroke-linecap="round"
      :stroke-dasharray="dashArray"
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
import { computed } from 'vue'

const DEFAULT_MIN = 0.1
const RADIUS = 45
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const { count = 1, progress = 0.3 } = defineProps<{ count?: number; progress?: number }>()

/**
 * Compute the dash–gap pattern so the arc length reflects progress.
 * - progress = 1   → full circle (dash = circumference, gap = 0)
 * - progress = 0   → hidden, but we clamp to DEFAULT_MIN for visibility
 */
const dashArray = computed(() => {
  const p = Math.min(Math.max(progress, 0), 1) // clamp 0‑1
  const visible = Math.max(p, DEFAULT_MIN) // ensure min stroke
  const dash = visible * CIRCUMFERENCE
  const gap = CIRCUMFERENCE - dash
  return `${dash} ${gap}`
})
</script>

<style scoped>
.base-ring {
  opacity: 0.15;
}

.spin-ring {
  animation: spin 3s linear infinite;
  transform-box: fill-box;
  transform-origin: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
