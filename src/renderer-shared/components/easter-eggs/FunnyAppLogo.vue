<template>
  <div class="funny-app-logo" @click="show = true">
    <!-- 彩蛋页面, 仅用于 .rabi.1 版本 -->
    <FunnyPricing
      v-model:show="show"
      @purchased="handlePurchased"
      @not-enough="handleNotEnough"
      :current="as.tempAkariSubscriptionInfo.current"
    />
    <span class="in-front-of-you">League Akari</span>
    <span class="behind-you"
      >({{ rabiSuffix }} · {{ subscriptionText[as.tempAkariSubscriptionInfo.current] }})</span
    >
  </div>
</template>

<script setup lang="ts">
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useMessage } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'

import FunnyPricing from './FunnyPricing.vue'

const subscriptionText = {
  basic: '基础版',
  pro: '⭐ Pro 版',
  max: '⭐ Max 版'
}

const show = ref(false)
const as = useAppCommonStore()

const rabiSuffix = computed(() => {
  const [, suffix] = as.version.split('-')
  return suffix
})

const message = useMessage()

onMounted(() => {
  if (!as.tempAkariSubscriptionInfo.shown) {
    show.value = true
    as.tempAkariSubscriptionInfo = {
      ...as.tempAkariSubscriptionInfo,
      shown: true
    }
  }
})

const handlePurchased = (item: any) => {
  as.tempAkariSubscriptionInfo = {
    ...as.tempAkariSubscriptionInfo,
    current: item.id
  }
  if (item.id === 'basic') {
    message.success(`平平淡淡才是真，你现在是落后的 ${item.title} 用户`)
  } else {
    message.success(`恭喜您购买了 ${item.title}，您现在是尊贵的 ${item.title} 用户！`)
  }
}

const handleNotEnough = (item: any) => {
  message.warning(`您的余额不足，需要 ${item.price / 1000} 阿卡林币`)
}
</script>

<style lang="less" scoped>
.funny-app-logo {
  height: 100%;
  display: flex;
  align-items: center;
  font-size: 14px;
  margin-left: 8px;
  box-sizing: border-box;
  -webkit-app-region: drag;
}

.in-front-of-you {
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  font-weight: bold;
}

.behind-you {
  font-size: 12px;
  font-weight: normal;
  color: #fffa;
  margin-left: 4px;
  -webkit-app-region: no-drag;
  transition: color 0.3s;

  &:hover {
    cursor: pointer;
    color: #ffff;
  }
}
</style>
