<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :class="$style['settings-modal']"
  >
    <template #header>
      <span class="card-header-title">{{
        showingNewUpdate ? t('UpdateModal.newVersion') : t('UpdateModal.versionFeatures')
      }}</span>
    </template>
    <div v-if="sus.newUpdates">
      <div v-if="showingNewUpdate" class="para">
        {{
          t('UpdateModal.newVersionAvailable', {
            version: sus.newUpdates.releaseVersion,
            currentVersion: sus.newUpdates.currentVersion
          })
        }}
      </div>
      <div v-else class="para">
        {{ t('UpdateModal.currentVersion', { version: sus.newUpdates.currentVersion }) }}
      </div>
      <div>
        <a class="small-link" target="_blank" :href="sus.newUpdates.releaseNotesUrl"
          >{{ sus.newUpdates.source === 'github' ? 'GitHub' : 'Gitee' }}
          {{ t('UpdateModal.releasePage') }}</a
        >
        <a
          v-if="sus.newUpdates.downloadUrl"
          class="small-link"
          style="margin-left: 8px"
          target="_blank"
          :href="sus.newUpdates.downloadUrl"
          >{{ sus.newUpdates.source === 'github' ? 'GitHub' : 'Gitee' }}
          {{ t('UpdateModal.download') }}</a
        >
      </div>
      <NScrollbar
        style="max-height: 50vh"
        :class="$style['markdown-text-scroll-wrapper']"
        trigger="none"
      >
        <div class="markdown-text" v-html="markdownHtmlText"></div>
      </NScrollbar>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { useSelfUpdateStore } from '@renderer-shared/shards/self-update/store'
import { markdownIt } from '@renderer-shared/utils/markdown'
import { useTranslation } from 'i18next-vue'
import { NModal, NScrollbar } from 'naive-ui'
import { computed } from 'vue'

defineProps<{
  showingNewUpdate?: boolean
}>()

const { t } = useTranslation()

const sus = useSelfUpdateStore()

const markdownHtmlText = computed(() => {
  return markdownIt.render(sus.newUpdates?.releaseNotes || '无内容')
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
  padding: 4px;

  h1,
  h2,
  h3,
  h4,
  h5 {
    font-weight: bold;

    &::before {
      content: '⭐';
      margin-right: 4px;
    }
  }

  h1 {
    font-size: 20px;
    margin-top: 8px;
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
.settings-modal {
  width: 90%;
  max-width: 768px;
}

.markdown-text-scroll-wrapper {
  margin-top: 12px;
  margin-bottom: 12px;
}
</style>
