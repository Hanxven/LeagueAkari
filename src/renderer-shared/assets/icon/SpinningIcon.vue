<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 100 100"
    aria-label="Loading"
    role="img"
  >
    <g>
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="currentColor"
        stroke-width="8"
        stroke-linecap="round"
        stroke-dasharray="212 70"
      />
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 50 50"
        to="360 50 50"
        dur="2s"
        repeatCount="indefinite"
      />
    </g>
    <g>
      <text
        x="50"
        y="50"
        dy="0.08em"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="60"
        fill="currentColor"
      >
        {{ count > 9 ? 9 : count }}
      </text>
    </g>
  </svg>
</template>

<script setup lang="ts">
const { count = 1 } = defineProps<{
  count?: number
}>()
</script>
