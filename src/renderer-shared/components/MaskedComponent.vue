<template>
  <div class="masked-component">
    <slot />
    <Transition name="bi-fade">
      <div v-if="show" class="mask">
        <slot name="mask" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const show = defineModel('showMask', {
  default: false
})
</script>

<style lang="less" scoped>
.masked-component {
  position: relative;
  overflow: hidden;
  height: 100%;
}

.mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(10px);
  z-index: 2000;
}
</style>
