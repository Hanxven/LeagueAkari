<template>
  <Transition
    name="tran"
    @enter="handleEnter"
    @leave="handleLeave"
    @after-enter="clearMaxWidth"
    @after-leave="clearMaxWidth"
  >
    <div v-if="show" class="horizontal-tran-wrapper">
      <slot></slot>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { show = true } = defineProps<{
  show?: boolean
}>()

const handleEnter = (el: Element) => {
  if (el instanceof HTMLElement || el instanceof SVGElement) {
    el.style.maxWidth = '0px'

    requestAnimationFrame(() => {
      el.style.maxWidth = el.scrollWidth + 'px'
    })
  }
}

const handleLeave = (el: Element) => {
  if (el instanceof HTMLElement || el instanceof SVGElement) {
    el.style.maxWidth = el.scrollWidth + 'px'

    // force reflow alternatively
    requestAnimationFrame(() => {
      el.style.maxWidth = '0px'
    })
  }
}

const clearMaxWidth = (el: Element) => {
  if (el instanceof HTMLElement || el instanceof SVGElement) {
    el.style.maxWidth = ''
  }
}
</script>

<style scoped lang="less">
.horizontal-tran-wrapper {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: clip;
}

.tran-enter-active,
.tran-leave-active {
  transition:
    opacity 0.3s ease,
    max-width 0.3s ease,
    transform 0.3s ease;
}

.tran-enter-from,
.tran-leave-to {
  opacity: 0;
  transform: scale(0.7);
}

.tran-enter-to,
.tran-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
