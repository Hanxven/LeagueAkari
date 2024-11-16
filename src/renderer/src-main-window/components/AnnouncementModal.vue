<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :class="$style['ann-modal']"
  >
    <template #header
      ><span class="card-header-title"
        >{{ t('AnnouncementModal.title')
        }}<span style="font-size: 12px" v-if="sus.currentAnnouncement">
          ({{ dayjs(sus.currentAnnouncement.updateAt).locale(locale).fromNow() }})</span
        ></span
      ></template
    >
    <div>
      <NScrollbar
        style="max-height: 50vh"
        :class="$style['markdown-text-scroll-wrapper']"
        trigger="none"
      >
        <div class="markdown-text" v-html="markdownHtmlText"></div>
      </NScrollbar>
      <div style="display: flex; justify-content: flex-end">
        <NButton
          type="primary"
          v-if="!sus.currentAnnouncement || sus.currentAnnouncement.isRead"
          @click="show = false"
          size="small"
          >{{ t('AnnouncementModal.close') }}</NButton
        >
        <NButton type="primary" v-else @click="handleRead" size="small">已读</NButton>
      </div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { SelfUpdateRenderer } from '@renderer-shared/shards/self-update'
import { useSelfUpdateStore } from '@renderer-shared/shards/self-update/store'
import { markdownIt } from '@renderer-shared/utils/markdown'
import dayjs from 'dayjs'
import { NButton, NModal, NScrollbar } from 'naive-ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const sus = useSelfUpdateStore()
const aum = useInstance<SelfUpdateRenderer>('self-update-renderer')

const markdownHtmlText = computed(() => {
  return markdownIt.render(sus.currentAnnouncement?.content || '当前没有任何公告')
})

const show = defineModel<boolean>('show', { default: false })

const handleRead = () => {
  if (sus.currentAnnouncement) {
    aum.setAnnouncementRead(sus.currentAnnouncement.sha)
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
