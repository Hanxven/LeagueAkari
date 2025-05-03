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
        sus.currentRelease?.isNew ? t('UpdateModal.newVersion') : t('UpdateModal.versionFeatures')
      }}</span>
    </template>
    <div v-if="sus.currentRelease">
      <div v-if="sus.currentRelease?.isNew" class="para">
        {{
          t('UpdateModal.newVersionAvailable', {
            version: sus.currentRelease.releaseVersion,
            currentVersion: sus.currentRelease.currentVersion
          })
        }}
      </div>
      <div v-else class="para">
        {{ t('UpdateModal.currentVersion', { version: sus.currentRelease.currentVersion }) }}
      </div>
      <div>
        <a
          class="small-link"
          target="_blank"
          style="margin-right: 8px"
          v-if="sus.currentRelease.releaseNotesUrl"
          :href="sus.currentRelease.releaseNotesUrl"
        >
          {{ sus.currentRelease.source === 'github' ? 'GitHub' : 'Gitee' }}
          {{ t('UpdateModal.releasePage') }}</a
        >
        <a
          v-if="sus.currentRelease.downloadUrl"
          class="small-link"
          target="_blank"
          :href="sus.currentRelease.downloadUrl"
          >{{ sus.currentRelease.source === 'github' ? 'GitHub' : 'Gitee' }}
          {{ t('UpdateModal.download') }}</a
        >
      </div>
      <NScrollbar
        style="max-height: 60vh"
        :class="$style['markdown-text-scroll-wrapper']"
        trigger="none"
      >
        <div class="markdown-container markdown-body" v-html="markdownHtmlText"></div>
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

const { t } = useTranslation()

const sus = useSelfUpdateStore()

const markdownHtmlText = computed(() => {
  return markdownIt.render(sus.currentRelease?.releaseNotes || '无内容')
})

const show = defineModel<boolean>('show', { default: false })
</script>

<style lang="less" scoped>
.para,
.small-link {
  font-size: 13px;
}

.markdown-container {
  user-select: text;
  border-radius: 4px;
  padding: 4px;
}
</style>

<style lang="less" module>
.settings-modal {
  width: 90%;
  max-width: 1024px;
}

.markdown-text-scroll-wrapper {
  margin-top: 12px;
  margin-bottom: 12px;
}
</style>
