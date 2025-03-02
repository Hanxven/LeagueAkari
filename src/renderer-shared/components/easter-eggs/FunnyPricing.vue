<template>
  <NModal v-model:show="show">
    <div class="pricing-wrapper">
      <div class="beautiful-akari">选择你的订阅</div>
      <div class="credit">
        <span>当前余额：</span>
        <span class="credit-amount"
          >{{ formatCredit / 1000 }} <span class="akari">阿卡林币</span></span
        >
        <NButton
          type="primary"
          class="button"
          :style="{
            left: `${offsetLeft}px`
          }"
          size="tiny"
          ref="btn"
          :focusable="false"
          @keydown.enter.prevent
          @keyup.enter.prevent
          @click="handleTopUp"
          >充值</NButton
        >
      </div>
      <div class="pricing-items">
        <div class="pricing-item" v-for="c of choices">
          <div class="title">{{ c.title }}</div>
          <div class="price">
            <template v-if="c.price !== 0">
              <span class="big">{{ c.price / 1000 }}</span>
              <span class="monthly">阿卡林币 / 月</span>
            </template>
            <template v-else>
              <span class="big">免费</span>
            </template>
          </div>
          <div class="description">{{ c.description }}</div>
          <div class="divider"></div>
          <div class="privileges">
            <div
              class="privilege"
              :class="{ [`level-${p.level}`]: true }"
              v-for="p of c.privileges"
            >
              <NIcon class="icon"><CheckmarkIcon /></NIcon>
              <span class="text">{{ p.text }}</span>
            </div>
          </div>
          <div class="subscribe" :class="{ current: current === c.id }" @click="handleBuy(c)">
            {{ current === c.id ? '当前的方案' : '订阅' }}
          </div>
        </div>
      </div>
    </div>
  </NModal>
</template>

<script lang="ts" setup>
import { Checkmark as CheckmarkIcon } from '@vicons/carbon'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NModal } from 'naive-ui'
import { computed, ref, useTemplateRef, watch } from 'vue'

const show = defineModel('show', { default: false })
const balance = ref(0) // 单位是厘

// 很遗憾, 没有 i18n
//
const { t } = useTranslation()

const emits = defineEmits<{
  purchased: [item: ItemType]
  notEnough: [item: ItemType]
}>()

const { current = 'basic' } = defineProps<{
  current?: string
}>()

// 必须一口气点完, 否则回到解放前
watch(
  () => show.value,
  (value) => {
    if (value) {
      balance.value = 0
    }
  }
)

const offsetLeft = ref(0)
watch(
  () => balance.value,
  (balance) => {
    if (balance >= 29950) {
      offsetLeft.value = Math.random() * 300
    }
  }
)

interface ItemType {
  id: string
  title: string
  price: number
  description: string
  privileges: { level: number; text: string }[]
}

// 三种套餐都是一样的, 仔细一看没有区别
const commonPart = [
  { level: 1, text: '战绩查询以及跨区查询' },
  { level: 1, text: '玩家 ID 查询' },
  { level: 1, text: '对局战绩分析' },
  { level: 1, text: '观战玩家' },
  {
    level: 1,
    text: '自动英雄选择或禁用，自动游戏流程（接受对局，自动匹配，自动点赞，自动回到房间）等'
  },
  { level: 1, text: '小工具集合，包括修改生涯背景，伪装段位信息等' }
]

const choices = ref([
  {
    id: 'basic',
    title: '基础版',
    price: 0,
    description: '最实惠的选择！',
    privileges: [...commonPart]
  },
  {
    id: 'pro',
    title: '⭐ Pro 版',
    price: 30000,
    description: '进阶用户最爱！',
    privileges: [...commonPart, { level: 2, text: '多花 30 阿卡林币' }]
  },
  {
    id: 'max',
    title: '⭐ Max 版',
    price: 198000,
    description: '满足一切需求！',
    privileges: [
      ...commonPart,
      { level: 2, text: '多花 30 阿卡林币' },
      { level: 3, text: '再多花 168 阿卡林币' }
    ]
  }
])

const handleBuy = (item: any) => {
  if (item.id === current) {
    return
  }

  if (item.price > balance.value) {
    emits('notEnough', item)
  } else {
    balance.value -= item.price
    emits('purchased', item)
  }
}

const btnEl = useTemplateRef('btn')

// 生产小粒子, 提供视觉效果
const createSmallParticle = (text: string = '1') => {
  const el = btnEl.value?.$el

  if (!el) {
    return
  }

  const rect = el.getBoundingClientRect()

  const x = rect.left + Math.random() * rect.width
  const y = rect.top - rect.height

  const particle = document.createElement('div')
  particle.style.position = 'fixed'
  particle.style.width = '160px'
  particle.style.height = '40px'
  particle.style.display = 'flex'
  particle.style.justifyContent = 'center'
  particle.style.alignItems = 'center'
  particle.style.left = `${x}px`
  particle.style.top = `${y}px`
  particle.style.transform = `translate(-50%, 0)`
  particle.style.fontWeight = 'bold'
  particle.style.color = 'rgba(188, 255, 143, 1)'
  particle.style.zIndex = '10000'
  particle.style.fontSize = '12px'
  particle.style.pointerEvents = 'none'
  particle.style.transition = 'top 0.6s, opacity 0.6s, font-size 0.6s'
  particle.textContent = `+${text}`

  document.body.appendChild(particle)

  requestAnimationFrame(() => {
    particle.style.top = `${y - 40}px`
    particle.style.opacity = '0'
    particle.style.fontSize = '24px'
  })

  particle.addEventListener('transitionend', () => {
    particle.remove()
  })
}

let lastClicked = 0
let clickCount = 0
let is棒triggered = false
let is牛triggered = false

// 拼多多 —— implemented by League Akari
const handleTopUp = () => {
  const now = Date.now()

  if (now - lastClicked < 500) {
    clickCount++
  } else {
    clickCount = 1
    is棒triggered = false
    is牛triggered = false
  }

  lastClicked = now

  if (!is牛triggered && clickCount >= 25) {
    createSmallParticle('非常厉害！')
    is牛triggered = true
  } else if (!is棒triggered && clickCount >= 10) {
    createSmallParticle('很棒很棒！')
    is棒triggered = true
  }

  if (balance.value < 29000) {
    balance.value += 1000
    createSmallParticle()
  } else if (balance.value < 29900) {
    balance.value += 50
    createSmallParticle((0.05).toString())
  } else if (balance.value < 29950) {
    balance.value += 1
    createSmallParticle((0.001).toString())
  } else {
    if (balance.value < 30005) {
      balance.value += 0.5
      createSmallParticle((0.0005).toString())
    } else {
      balance.value += 10000
      createSmallParticle((10).toString())
    }
  }
}

// 小数位先藏起来, 以免一开始就露馅
const formatCredit = computed(() => {
  return parseFloat(balance.value.toFixed(4).toString())
})
</script>

<style lang="less" scoped>
.pricing-wrapper {
  padding: 24px;
  background-color: var(--background-color-primary);
}

.huge-title {
  font-size: 24px;
  font-weight: bold;
  color: rgba(255, 255, 255, 1);
  margin-bottom: 24px;
}

.credit {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);

  .credit-amount {
    font-weight: bold;
    color: rgba(255, 255, 255, 1);
    width: 128px;
  }

  .akari {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }

  .button {
    position: relative;
    transition: left 0.3s;
  }
}

.pricing-items {
  display: flex;
  justify-content: center;
  height: 500px;
  border-radius: 2px;
  gap: 12px;
  margin-top: 16px;

  .pricing-item {
    display: flex;
    flex-direction: column;
    width: 260px;
    height: 100%;
    padding: 16px;
    box-sizing: border-box;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;

    .title {
      font-weight: bold;
      font-size: 24px;
    }

    .price {
      display: flex;
      position: relative;
      font-size: 18px;
      margin-top: 16px;

      .big {
        position: relative;
        line-height: 1;
        font-size: 36px;
        color: rgba(255, 255, 255, 1);
      }

      .monthly {
        position: relative;
        bottom: 4px;
        font-size: 12px;
        margin-left: 4px;
        color: rgba(255, 255, 255, 0.6);
        align-self: flex-end;
      }
    }

    .description {
      font-size: 16px;
      color: rgba(255, 255, 255, 1);
      margin-top: 8px;
    }

    .divider {
      margin-top: 16px;
      height: 1px;
      background-color: rgba(255, 255, 255, 0.2);
    }

    .privileges {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 16px;

      .privilege {
        display: flex;
        gap: 8px;

        .icon {
          position: relative;
          top: 2px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }

        .text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }

        &.level-2 {
          .text {
            color: rgba(255, 255, 255, 1);
            font-weight: bold;
          }
        }

        &.level-3 {
          .text {
            color: rgb(188, 255, 143);
            font-weight: bold;
          }
        }
      }
    }

    .subscribe {
      height: 36px;
      margin-top: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background-color: rgba(255, 255, 255, 0.1);
      transition: background-color 0.3s;

      &:not(.current):hover {
        background-color: rgba(255, 255, 255, 0.2);
      }

      &:not(.current):active {
        background-color: rgba(255, 255, 255, 0.15);
      }

      &:not(.current) {
        cursor: pointer;
      }

      &.current {
        color: rgba(255, 255, 255, 0.2);
      }
    }
  }
}

.beautiful-akari {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 24px;
  background-clip: text;
  background-image: linear-gradient(90deg, #91dcff, #91dcff 10%, #ff59cb 55%, #ffc1eb 100%);
  color: transparent;
  background-size: 200% 200%;
  animation: gradient-flow 10s linear infinite;
}

@keyframes gradient-flow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
