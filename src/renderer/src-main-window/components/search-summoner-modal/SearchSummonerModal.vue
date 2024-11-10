<template>
  <NModal
    transform-origin="center"
    v-model:show="show"
    title="召唤师搜索"
    preset="card"
    size="small"
    :class="$style['search-summoner-modal']"
  >
    <div class="input-line">
      <NInput :placeholder="placeholderText" />
    </div>
    <div class="recent-searches">
      <div class="record"></div>
      <div class="record"></div>
      <div class="record"></div>
      <div class="record"></div>
      <div class="record"></div>
      <div class="record"></div>
      <div class="record"></div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { RiotClientRenderer } from '@renderer-shared/shards/riot-client'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { NInput, NModal } from 'naive-ui'

const show = defineModel<boolean>('show', { default: false })
const lc = useInstance<LeagueClientRenderer>('league-client-renderer')
const rc = useInstance<RiotClientRenderer>('riot-client-renderer')
const sgp = useInstance<SgpRenderer>('sgp-renderer')

const sgps = useSgpStore()

const placeholderTexts = [
  '查询召唤师，格式如：赤座灯里#akari',
  '查询召唤师，格式如：岁纳京子#kyoko',
  '查询召唤师，格式如：船见结衣#yui',
  '查询召唤师，格式如：杉浦绫乃#ayano',
  '查询召唤师，格式如：大室樱子#sakur',
  '查询召唤师，格式如：古谷向日葵#himaw'
]

const placeholderText = placeholderTexts[Math.floor(Math.random() * placeholderTexts.length)]

/**
 * 识别 {gameName}#{tagLIne} 或 {fuzzyGameName} 的输入
 * @param nameStr
 */
const checkNameInput = (nameStr: string) => {
  return /^[^#]+(?:#[^#]+)?$/.test(nameStr)
}

const invisibleCharRegex = /[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF\u2060-\u2064]/g

const replaceInvisibleChar = (str: string) => {
  return str.replace(invisibleCharRegex, '')
}

const includesInvisibleChar = (str: string) => {
  return invisibleCharRegex.test(str)
}

// 腾讯服务情况下，需要提供大区，通过 interoperability 来获取可用的大区列表
// 名称输入，推测查询类型，puuid还是名称，以 # 符号作为判断标志
// 若不提供 tag，则进行模糊查询
// 名称规则检测，是否合法
// 输入格式检测，用于判断是否混入了一些不可见字符，或额外的空格字符
// 模糊查询的情况下，如果存在过多需要验证的结果，需要进行二次确认
// 查询过程可以时刻中断，提供一个取消查询按钮，以及默认在关闭对话框后取消查询
// 提供两种打开方式：1. 点击立即跳转到目标页面，并关闭对话框 2. 中键点击，打开而不关闭对话框

// TODO Tab页面的头像，在页面加载时替换为加载图标，加载完成后替换为头像。在对局进行阶段，替换为所选英雄头像
</script>

<style lang="less" scoped>
.input-line {
  width: 100%;
}

.recent-searches {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  margin-top: 16px;
  row-gap: 4px;
  column-gap: 4px;

  .record {
    width: 80px;
    height: 22px;
    background-color: rgb(99, 99, 175);
    border-radius: 2px;
  }
}
</style>

<style lang="less" module>
.search-summoner-modal {
  max-width: 600px;
}
</style>
