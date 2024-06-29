<template>
  <NPopover :delay="300" :show-arrow="false">
    <template #trigger>
      <div style="display: flex; flex-direction: column; align-items: center; font-size: 11px">
        <div>{{ totalDamage.toLocaleString() }}</div>
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
      </div>
    </template>
    <div class="details">
      <div style="display: flex; align-items: center">
        <svg :width="INNER_WIDTH" :height="height">
          <rect x="0" y="0" :width="INNER_WIDTH" :height="height" class="bg" />
          <rect
            v-for="dmg of orderedInner"
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
          {{ ((totalDamage / (baselineDamage || 1)) * 100).toFixed(2) }} %
        </div>
      </div>
      <div class="divider"></div>
      <div
        style="
          display: grid;
          grid-template-rows: 1fr 1fr;
          grid-template-columns: 1fr 1fr;
          row-gap: 2px;
          column-gap: 6px;
        "
      >
        <div>
          <div style="font-size: 11px; font-weight: 700">伤害总计</div>
          <div>{{ totalDamage.toLocaleString() }}</div>
        </div>
        <div>
          <div style="font-size: 11px; font-weight: 700">
            物理伤害 ({{ ((physicalDamage / (totalDamage || 1)) * 100).toFixed() }} %)
          </div>
          <div>{{ physicalDamage.toLocaleString() }}</div>
        </div>
        <div>
          <div style="font-size: 11px; font-weight: 700">
            魔法伤害 ({{ ((magicDamage / (totalDamage || 1)) * 100).toFixed() }} %)
          </div>
          <div>{{ magicDamage.toLocaleString() }}</div>
        </div>
        <div>
          <div style="font-size: 11px; font-weight: 700">
            真实伤害 ({{ ((trueDamage / (totalDamage || 1)) * 100).toFixed() }} %)
          </div>
          <div>{{ trueDamage.toLocaleString() }}</div>
        </div>
      </div>
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
    width: 52,
    height: 6
  }
)

const INNER_WIDTH = 140

const calcMetricBar = (baseWidth: number) => {
  const list = [
    {
      type: 'physical',
      x: 0,
      width: (props.physicalDamage / (props.baselineDamage || 1)) * baseWidth
    },
    { type: 'magic', x: 0, width: (props.magicDamage / (props.baselineDamage || 1)) * baseWidth },
    { type: 'true', x: 0, width: (props.trueDamage / (props.baselineDamage || 1)) * baseWidth }
  ].sort((d1, d2) => d2.width - d1.width)

  for (let i = 1; i < list.length; i++) {
    list[i].x = list[i - 1].x + list[i - 1].width
  }

  return list
}

const ordered = computed(() => {
  return calcMetricBar(props.width)
})

const orderedInner = computed(() => {
  return calcMetricBar(INNER_WIDTH)
})
</script>

<style lang="less" scoped>
.physical-damage {
  fill: rgb(223, 77, 67);
}

.magic-damage {
  fill: rgb(114, 190, 226);
}

.true-damage {
  fill: rgb(188, 188, 188);
}

.bg {
  fill: rgb(83, 83, 83);
}

.best {
  font-weight: 700;
  color: rgb(167, 167, 255);
}

.details {
  font-size: 11px;
  width: 204px;
}

.divider {
  height: 1px;
  background-color: rgb(107, 107, 107);
  margin: 4px 0;
}
</style>
