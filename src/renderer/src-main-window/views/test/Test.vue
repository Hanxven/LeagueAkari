<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div style="margin-bottom: 12px">此页面被用于测试功能，仅在开发环境或 .rabi 版本中可见。</div>
      <div style="margin-bottom: 12px">
        This page is reserved for testing scenarios, can only be seen in dev or .rabi mode.
      </div>
      <div style="width: 100%; height: 1px; background: #fff4"></div>
      <!-- Horizontal Collapse Transition -->
      <HorizontalExpand :show>
        <div>should show me?</div>
      </HorizontalExpand>
      <NButton @click="show = !show">Toggle</NButton>
      <NIcon style="font-size: 32px">
        <SpinningIcon />
      </NIcon>
      <!-- Premade Teams Color Presets -->
      <div class="colors-container">
        <div
          class="card"
          v-for="(team, key) in teams"
          :key="key"
          :style="{
            backgroundColor: team.foregroundColor,
            color: team.color,
            border: '4px solid ' + team.borderColor
          }"
        >
          <div class="title">Team {{ key }}</div>
          <div class="info">foregroundColor: {{ team.foregroundColor }}</div>
          <div class="info">text color: {{ team.color }}</div>
          <div class="info">borderColor: {{ team.borderColor }}</div>
        </div>
      </div>
      <!-- Markdown Rendering Test -->
      <div class="markdown-text markdown-body" v-html="markdownHtmlText"></div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import SpinningIcon from '@renderer-shared/assets/icon/SpinningIcon.vue'
import HorizontalExpand from '@renderer-shared/components/HorizontalExpand.vue'
import { PREMADE_TEAM_COLORS } from '@renderer-shared/components/ongoing-game-panel/ongoing-game-utils'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { markdownIt } from '@renderer-shared/utils/markdown'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NScrollbar, useMessage } from 'naive-ui'
import { Component as ComponentC, computed, h, reactive, ref } from 'vue'

import { useMarkdownTest } from './markdown-test'

const lc = useInstance(LeagueClientRenderer)
const { t } = useTranslation()

const message = useMessage()
const value = ref('1')

const renderIcon = (icon: ComponentC) => {
  return () => h(NIcon, null, () => h(icon))
}

const textT = useMarkdownTest()

const markdownHtmlText = computed(() => {
  return markdownIt.render(textT.value)
})

const teams = reactive(PREMADE_TEAM_COLORS)

const show = ref(true)
</script>

<style lang="less" scoped>
.single-root {
  height: 100%;
}

.markdown-text {
  user-select: text;

  max-width: 800px;
}

.colors-container {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;

  .card {
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .title {
    font-size: 1.5em;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .info {
    font-size: 0.9em;
    margin-bottom: 4px;
  }
}

.section-icon-container {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
  color: #fffa;
  padding: 0 4px;

  .section-icon {
    font-size: 16px;
  }

  .session-label {
    font-size: 12px;
    font-weight: bold;
  }
}
</style>
