<template>
  <NPopover :delay="300">
    <template #trigger>
      <span :class="{ best: baselineDamage && totalDamage === baselineDamage }">
        {{ totalDamage.toLocaleString() }} ({{
          ((totalDamage / baselineDamage || 1) * 100).toFixed(2)
        }}
        %)</span
      >
    </template>
    <div class="details">
      <div style="display: flex; align-items: center">
        <svg :width="width" :height="height">
          <rect x="0" y="0" :width="width" :height="height" class="bg" />
          <rect
            v-for="dmg of ordered"
            :x="dmg.x"
            y="0"
            :height="height"
            :width="dmg.width"
            :class="{
              'magic-damage': dmg.type === 'magic',
              'physical-damage': dmg.type === 'physical',
              'true-damage': dmg.type === 'true'
            }"
          />
        </svg>
        <div style="margin-left: 8px">
          {{ ((totalDamage / baselineDamage) * 100).toFixed(2) }} %
        </div>
      </div>
      <div class="divider"></div>
      <div class="">物理: {{ physicalDamage.toLocaleString() }}</div>
      <div class="">魔法: {{ magicDamage.toLocaleString() }}</div>
      <div class="">真实: {{ trueDamage.toLocaleString() }}</div>
    </div>
  </NPopover>
</template>

<script setup lang="ts">
import { NPopover } from 'naive-ui'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    physicalDamage?: number
    magicDamage?: number
    trueDamage?: number
    totalDamage?: number
    baselineDamage?: number
    width?: number
    height?: number
  }>(),
  {
    baselineDamage: 1,
    magicDamage: 1,
    physicalDamage: 1,
    totalDamage: 1,
    trueDamage: 1,
    width: 80,
    height: 12
  }
)

const ordered = computed(() => {
  const list = [
    { type: 'physical', x: 0, width: (props.physicalDamage / props.baselineDamage) * props.width },
    { type: 'magic', x: 0, width: (props.magicDamage / props.baselineDamage) * props.width },
    { type: 'true', x: 0, width: (props.trueDamage / props.baselineDamage) * props.width }
  ].sort((d1, d2) => d2.width - d1.width)

  for (let i = 1; i < list.length; i++) {
    list[i].x = list[i - 1].x + list[i - 1].width
  }

  return list
})
</script>

<style lang="less" scoped>
.physical-damage {
  fill: rgb(225, 136, 68);
}

.magic-damage {
  fill: rgb(118, 116, 187);
}

.true-damage {
  fill: rgb(202, 202, 202);
}

.bg {
  fill: rgb(94, 94, 94);
}

.best {
  font-weight: 700;
  color: rgb(167, 167, 255);
}

.details {
  font-size: 12px;
}

.divider {
  height: 1px;
  background-color: rgb(107, 107, 107);
  margin: 4px 0;
}
</style>
