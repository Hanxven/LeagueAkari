<template>
  <NPopover
    v-if="itemId && gameData.items[itemId]"
    :delay="300"
    :scrollable="true"
    style="max-height: 50vh"
  >
    <template #trigger>
      <LcuImage
        :src="gameData.items[itemId].iconPath"
        v-bind="$attrs"
        :style="{ width: `${size}px`, height: `${size}px` }"
        class="item"
        :class="{ trinket: isTrinket, item: !isTrinket }"
      />
    </template>
    <div class="info">
      <LcuImage class="image" :src="gameData.items[itemId].iconPath" />
      <div class="right-side">
        <div class="name">{{ gameData.items[itemId].name }}</div>
        <div class="price">
          {{ gameData.items[itemId].priceTotal }} G
          {{
            gameData.items[itemId].price !== gameData.items[itemId].priceTotal
              ? `(合成 ${gameData.items[itemId].price}  G)`
              : ''
          }}
        </div>
      </div>
    </div>
    <div class="from" v-if="gameData.items[itemId].from.length !== 0">
      <LcuImage
        class="image"
        :title="gameData.items[item].name"
        :src="gameData.items[item].iconPath"
        v-for="item of gameData.items[itemId].from"
        :key="item"
      />
    </div>
    <div class="to" v-if="gameData.items[itemId].to.length !== 0">
      <LcuImage
        class="image"
        :title="gameData.items[item].name"
        :src="gameData.items[item].iconPath"
        v-for="item of gameData.items[itemId].to"
        :key="item"
      />
    </div>
    <div
      :style="{ maxWidth: `${maxWidth}px` }"
      style="font-size: 12px"
      lol-view
      v-html="gameData.items[itemId].description"
    ></div>
  </NPopover>
  <div
    v-else
    :style="{ width: `${size}px`, height: `${size}px` }"
    :class="{ trinket: isTrinket, item: !isTrinket }"
    v-bind="$attrs"
    class="empty"
  ></div>
</template>

<script setup lang="ts">
import { useGameDataStore } from '@shared/renderer/modules/lcu-state-sync/game-data'
import { NPopover } from 'naive-ui'

import LcuImage from '../LcuImage.vue'

withDefaults(
  defineProps<{
    itemId?: number

    // trinkets 有一些不一样的样式
    isTrinket?: boolean
    maxWidth?: number
    size?: number
  }>(),
  {
    isTrinket: false,
    size: 20,
    maxWidth: 400
  }
)

const gameData = useGameDataStore()
</script>

<style lang="less" scoped>
.info {
  margin-bottom: 8px;
  display: flex;
  align-items: center;

  .image {
    width: 28px;
    height: 28px;
    border-radius: 2px;
  }

  .right-side {
    margin-left: 8px;

    .name {
      font-size: 12px;
      line-height: 12px;
      font-weight: bold;
      margin-bottom: 2px;
    }

    .price {
      font-size: 12px;
      line-height: 12px;
    }
  }
}

.from {
  margin-bottom: 4px;

  &::before {
    content: '组成 =';
  }
}

.to {
  margin-bottom: 8px;

  &::before {
    content: '可合成 ⇒';
  }
}

.from,
.to {
  display: flex;
  gap: 2px;
  align-items: center;
  max-width: 460px;
  flex-wrap: wrap;

  .image {
    width: 20px;
    height: 20px;
    border-radius: 2px;
  }

  &::before {
    font-size: 12px;
    font-style: italic;
    color: rgb(168, 168, 168);
    margin-right: 4px;
  }
}

.item.trinket,
.trinket.empty {
  border-radius: 50%;
}

.item,
.item.empty {
  border-radius: 2px;
}

.empty {
  background-color: rgb(34, 34, 34);
}
</style>
