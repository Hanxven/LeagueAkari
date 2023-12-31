<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    @update:show="(val) => emits('update:show', val)"
    :show="show"
    :class="styles['settings-modal']"
  >
    <template #header><span class="card-header-title">发现更新</span></template>
    <div v-if="appState.newUpdate">
      <div class="para">
        新版本可用：{{ appState.newUpdate.version }} (当前版本：{{
          appState.newUpdate.currentVersion
        }})
      </div>
      <div>
        <a class="small-link" target="_blank" :href="appState.newUpdate.pageUrl">查看发布页面</a>
        <a
          v-if="appState.newUpdate.downloadUrl"
          class="small-link"
          style="margin-left: 8px"
          target="_blank"
          :href="appState.newUpdate.downloadUrl"
          >下载</a
        >
      </div>
      <NScrollbar style="max-height: 30vh">
        <div class="markdown-text" v-html="markdownText"></div>
      </NScrollbar>
      <div class="para" style="font-style: italic">可以在设置中关闭自动更新检查</div>
      <div class="para" style="font-style: italic">仍可以在：[设置 -> 关于 -> 检查更新] 中手动检查更新</div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import markdown from 'markdown-it'
import { NModal, NScrollbar } from 'naive-ui'
import { computed, useCssModule } from 'vue'

import { useAppState } from '@renderer/features/stores/app'

defineProps<{
  show: boolean
}>()

const appState = useAppState()

const styles = useCssModule()

const md = markdown()

const markdownText = computed(() => {
  return md.render(appState.newUpdate?.description || '')
})

// 事件转交
const emits = defineEmits<{
  (e: 'update:show', val: boolean): void
}>()
</script>

<style lang="less" scoped>
.card-header-title {
  font-weight: bold;
}

.para,
.small-link {
  font-size: 13px;
}

:deep(.markdown-text) {
  margin-top: 12px;
  margin-bottom: 12px;
  font-size: 13px;

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
}
</style>

<style lang="less" module>
.settings-modal {
  width: 90%;
  max-width: 768px;
}
</style>
