<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div style="margin-bottom: 12px">此页面被用于测试功能，仅在开发环境或 .rabi 版本中可见。</div>
      <NButton tertiary type="primary" @click="stubGetHomeHub"
        >恶魔手契成为三体人 (请先过新手教程)</NButton
      >
      <div class="markdown-text markdown-body" v-html="markdownHtmlText"></div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { markdownIt } from '@renderer-shared/utils/markdown'
import { NButton, NScrollbar, useMessage } from 'naive-ui'
import { computed, h } from 'vue'

import { initialState } from './boba-minigame'

const lc = useInstance(LeagueClientRenderer)

const message = useMessage()

const stubGetHomeHub = async () => {
  const { data } = await lc._http.request({
    method: 'GET',
    url: '/lol-settings/v2/account/LCUPreferences/lol-home-hubs'
  })

  const prevState = data?.data?.['boba-minigame']

  if (prevState) {
    await lc._http.request({
      method: 'PATCH',
      url: '/lol-settings/v2/account/LCUPreferences/lol-home-hubs',
      data: {
        data: {
          'boba-minigame': {
            ...prevState,
            hp: 100,
            currency: 114514,
            runBonusStats: {
              BonusBaseCardDamage: 999999999,
              BonusCritChance: 100,
              BonusMaxHp: 0
            }
          }
        },
        schemaVersion: 1
      }
    })
  } else {
    await lc._http.request({
      method: 'PATCH',
      url: '/lol-settings/v2/account/LCUPreferences/lol-home-hubs',
      data: {
        data: {
          'boba-minigame': {
            ...initialState,
            hp: 100,
            currency: 114514,
            runBonusStats: {
              BonusBaseCardDamage: 999999999,
              BonusCritChance: 0,
              BonusMaxHp: 0
            }
          }
        },
        schemaVersion: 1
      }
    })
  }

  message.success(
    () =>
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }
        },
        [
          h('span', '修改成功。请重启游戏客户端以生效'),
          h(
            NButton,
            { type: 'primary', size: 'tiny', onClick: () => lc.api.riotclient.restartUx() },
            '-> 重启 UX'
          )
        ]
      ),
    { duration: 10000, closable: true }
  )
}

const textT = `
\`markdown-it\` 本身是一个 Markdown 解析器，它的主要作用是把 Markdown 文本转换成 HTML。但它**不负责样式或美化**。如果你想要渲染出“好看的页面”，你需要为生成的 HTML 加上 CSS 样式，或者直接用一些现成的主题/样式包。

下面是一些常见的做法：

---

### ✅ 1. 使用开源的 Markdown CSS 样式库

有很多现成的 CSS 样式可以让你的 Markdown 页面瞬间变得好看。

#### 🔹 GitHub Markdown 样式（推荐）
GitHub 自家的 Markdown 样式，兼容性好、样式清爽。

- CSS 地址：
  \`\`\`
  https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css
  \`\`\`

- 使用方法：
  \`\`\`html
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css">
  <article class="markdown-body">
    <!-- 这里插入 markdown-it 渲染的 HTML -->
  </article>
  \`\`\`

> ⚠️ 注意：你需要给容器加上 \`.markdown-body\` 类名。

---

#### 🔹 其他 Markdown 样式库

- [**markdown-css-themes**](https://github.com/markdowncss)：
  - 一个专门做 Markdown 样式的项目集合
  - 样式风格多样：简洁、报纸风、高对比、论文风等
  - 用法都很简单，就是引入对应 CSS

---

### ✅ 2. 使用现成的 Markdown 渲染器（集成了 markdown-it）

如果你想省事，直接使用一些已经集成了 markdown-it 和样式的方案，比如：

- **VuePress** / **VitePress**：Markdown + Vue/Vite 构建文档站
- **Docsify** / **Docusaurus**：快速文档搭建方案
- **Obsidian / Typora / VS Code Preview**：桌面端编辑器，参考其样式

---

### ✅ 3. 自定义主题市场？（还不太成熟）

目前 \`markdown-it\` 并没有一个像 “主题市场” 一样的官方生态，但你可以：
- 去 GitHub 上找一些项目，比如 \`markdown-css\`、\`markdown-themes\`
- 或者自己写 SCSS / Tailwind 配合自定义渲染样式（比如给代码块加暗色主题）

---

### 💡 小结：最简单推荐方案

\`\`\`html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css" />
<article class="markdown-body">
  <!-- markdown-it 渲染出的内容放在这里 -->
</article>
\`\`\`

✨ 然后你可以根据自己的需求继续美化，比如加上代码高亮（highlight.js）或者适配暗色主题。

---

要不要我给你做个完整的 demo 示例？HTML + JS + 样式一套？
`

const markdownHtmlText = computed(() => {
  return markdownIt.render(textT)
})
</script>

<style lang="less" scoped>
.single-root {
  height: 100%;
}

.markdown-text {
  user-select: text;

  max-width: 800px;
}
</style>
