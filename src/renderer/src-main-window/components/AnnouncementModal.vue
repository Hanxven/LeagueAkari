<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :class="styles['ann-modal']"
  >
    <template #header
      ><span class="card-header-title"
        >公告<span style="font-size: 12px" v-if="au.currentAnnouncement">
          ({{ dayjs(au.currentAnnouncement.updateAt).locale('zh-cn').fromNow() }} 更新)</span
        ></span
      ></template
    >
    <div>
      <NScrollbar
        style="max-height: 50vh"
        :class="styles['markdown-text-scroll-wrapper']"
        trigger="none"
      >
        <div class="markdown-text" v-html="markdownHtmlText"></div>
      </NScrollbar>
      <div style="display: flex; justify-content: flex-end">
        <NButton
          type="primary"
          v-if="!au.currentAnnouncement || au.currentAnnouncement.isRead"
          @click="show = false"
          size="tiny"
          >关闭</NButton
        >
        <NButton type="primary" v-else @click="handleRead" size="tiny">已读</NButton>
      </div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { autoUpdateRendererModule as aum } from '@shared/renderer/modules/auto-update'
import { useAutoUpdateStore } from '@shared/renderer/modules/auto-update/store'
import { markdownIt } from '@shared/renderer/utils/markdown'
import dayjs from 'dayjs'
import { NButton, NModal, NScrollbar } from 'naive-ui'
import { computed, useCssModule } from 'vue'

const au = useAutoUpdateStore()

const styles = useCssModule()

const markdownHtmlText = computed(() => {
  return markdownIt.render(au.currentAnnouncement?.content || '当前没有任何公告')
})

const show = defineModel<boolean>('show', { default: false })

const handleRead = () => {
  if (au.currentAnnouncement) {
    aum.setReadAnnouncement(au.currentAnnouncement.sha)
  }
  show.value = false
}
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
  padding: 4px;

  h1,
  h2,
  h3,
  h4,
  h5 {
    font-weight: bold;

    &::before {
      margin-right: 4px;
    }
  }

  h1 {
    font-size: 20px;
    margin-top: 4px;
    margin-bottom: 12px;
  }

  h2 {
    font-size: 18px;
    margin-top: 8px;
    margin-bottom: 8px;
  }

  h3 {
    font-size: 16px;
    margin-top: 4px;
    margin-bottom: 4px;
  }

  // ul {
  //   margin-left: 24px;
  // }

  li::before {
    display: inline;
    content: '•';
  }

  li p {
    display: inline;
  }

  code {
    font-family: inherit;
    background-color: rgba(32, 32, 32, 1);
    border-radius: 2px;
    padding: 2px 4px;
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

  img {
    max-width: 100%;
  }
}
</style>

<style lang="less" module>
.ann-modal {
  width: 90%;
  max-width: 768px;
}

.markdown-text-scroll-wrapper {
  margin-top: 12px;
  margin-bottom: 12px;
}
</style>
@shared/renderer/modules/app/store
