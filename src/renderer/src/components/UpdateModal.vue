<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :class="styles['settings-modal']"
  >
    <template #header><span class="card-header-title">发现更新</span></template>
    <div v-if="app.updates.newUpdates">
      <div class="para">
        新版本可用：{{ app.updates.newUpdates.version }} (当前版本：{{
          app.updates.newUpdates.currentVersion
        }})
      </div>
      <div>
        <a class="small-link" target="_blank" :href="app.updates.newUpdates.pageUrl"
          >Github 发布页面</a
        >
        <a
          v-if="app.updates.newUpdates.downloadUrl"
          class="small-link"
          style="margin-left: 8px"
          target="_blank"
          :href="app.updates.newUpdates.downloadUrl"
          >Github 下载</a
        >
      </div>
      <NScrollbar style="max-height: 30vh" :class="styles['markdown-text-scroll-wrapper']">
        <div class="markdown-text" v-html="markdownHtmlText"></div>
      </NScrollbar>
      <div class="para" style="font-style: italic">
        可以在：[设置 -> 应用 -> 基础 -> 自动检查更新] 关闭自动检查
      </div>
      <div class="para" style="font-style: italic">
        可以在：[设置 -> 关于 -> 检查更新] 中手动检查更新
      </div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { NModal, NScrollbar } from 'naive-ui'
import { computed, useCssModule } from 'vue'

import { useAppStore } from '@renderer/features/app/store'
import { markdownIt } from '@renderer/utils/markdown'

const app = useAppStore()

const styles = useCssModule()

const markdownHtmlText = computed(() => {
  return markdownIt.render(app.updates.newUpdates?.description || '无内容')
})

const show = defineModel<boolean>('show', { default: false })
</script>

<style lang="less" scoped>
.card-header-title {
  font-weight: bold;
  font-size: 18px;
}

.para,
.small-link {
  font-size: 13px;
}

:deep(.markdown-text) {
  font-size: 13px;
  user-select: text;
  padding: 12px;

  h1,
  h2,
  h3,
  h4,
  h5 {
    font-weight: 700;

    &::before {
      content: '⭐';
      margin-right: 4px;
    }
  }

  h1 {
    font-size: 20px;
  }

  h2 {
    font-size: 18px;
  }

  h3 {
    font-size: 16px;
  }

  ul {
    margin-left: 24px;
  }

  li::before {
    display: inline;
    content: '🔧';
  }

  li p {
    display: inline;
  }

  code {
    font-family: inherit;
    background-color: rgba(0, 0, 0, 0.4);
    border-radius: 2px;
  }

  table {
    /* 设置表格边框 */
    border-collapse: collapse;
    border-spacing: 0;
    margin: 4px 0;
    border-radius: 8px;
  }

  th,
  td {
    border: 1px solid #3b3b3b;
    padding: 4px 8px;
  }

  blockquote {
    border-radius: 2px;
    padding: 4px 8px;
    background-color: rgba(0, 0, 0, 0.4);
  }

  blockquote + blockquote {
    margin-top: 4px;
  }
}
</style>

<style lang="less" module>
.settings-modal {
  width: 90%;
  max-width: 768px;
}

.markdown-text-scroll-wrapper {
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  margin-top: 12px;
  margin-bottom: 12px;
}
</style>
