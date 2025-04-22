<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div style="margin-bottom: 12px">此页面被用于测试功能，仅在开发环境或 .rabi 版本中可见。</div>
      <div style="margin-bottom: 12px">
        This page is reserved for testing scenarios, can only be seen in dev or .rabi mode.
      </div>
      <div style="width: 100%; height: 1px; background: #fff4"></div>
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
      <div class="markdown-text markdown-body" v-html="markdownHtmlText"></div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { PREMADE_TEAM_COLORS } from '@renderer-shared/components/ongoing-game-panel/ongoing-game-utils'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { markdownIt } from '@renderer-shared/utils/markdown'
import { NScrollbar, useMessage } from 'naive-ui'
import { computed } from 'vue'
import { reactive } from 'vue'

const lc = useInstance(LeagueClientRenderer)

const message = useMessage()

const textT = `# League Akari Markdown Test

## League Akari

### League Akari

#### League Akari

##### League Akari

###### League Akari

**League Akari** *League Akari*

<div style="color: orange; font-weight: bold;">League Akari</div>

\`League Akari\`

***League Akari***

~~League Akari~~

\`\`\`
fn league_akari(rabi: &str) {
    println!("Hello, {}!", rabi);
}
\`\`\`

1. ✅ League
2. ✅ Akari
    - ✅ League
        - League
        - Akari
    - ✅ Akari
        - League
        - Akari

> League Akari`

const markdownHtmlText = computed(() => {
  return markdownIt.render(textT)
})

const teams = reactive(PREMADE_TEAM_COLORS)
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
</style>
