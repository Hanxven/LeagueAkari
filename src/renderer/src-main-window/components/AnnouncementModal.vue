<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :class="$style['ann-modal']"
  >
    <template #header>
      <span class="card-header-title"
        >{{ t('AnnouncementModal.title')
        }}<span style="font-size: 12px" v-if="sus.currentAnnouncement">
          ({{
            dayjs(sus.currentAnnouncement.updateAt)
              .locale(as.settings.locale.toLowerCase())
              .fromNow()
          }})</span
        ></span
      >
    </template>
    <div>
      <NScrollbar
        style="max-height: 60vh"
        :class="$style['markdown-text-scroll-wrapper']"
        trigger="none"
      >
        <div class="markdown-container markdown-body" v-html="markdownHtmlText"></div>
      </NScrollbar>
      <div style="display: flex; justify-content: flex-end">
        <NButton
          type="primary"
          v-if="!sus.currentAnnouncement || sus.currentAnnouncement.isRead"
          @click="show = false"
          size="small"
          >{{ t('AnnouncementModal.close') }}</NButton
        >
        <NButton type="primary" v-else @click="handleRead" size="small">{{
          t('AnnouncementModal.read')
        }}</NButton>
      </div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { SelfUpdateRenderer } from '@renderer-shared/shards/self-update'
import { useSelfUpdateStore } from '@renderer-shared/shards/self-update/store'
import { markdownIt } from '@renderer-shared/utils/markdown'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NButton, NModal, NScrollbar } from 'naive-ui'
import { computed } from 'vue'

const { t } = useTranslation()

const as = useAppCommonStore()

const sus = useSelfUpdateStore()
const aum = useInstance(SelfUpdateRenderer)

const markdownHtmlText = computed(() => {
  return markdownIt.render(sus.currentAnnouncement?.content || '当前没有任何公告')
})

const show = defineModel<boolean>('show', { default: false })

const handleRead = () => {
  if (sus.currentAnnouncement) {
    aum.setAnnouncementRead(sus.currentAnnouncement.md5)
  }
  show.value = false
}
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
.ann-modal {
  width: 90%;
  max-width: 1024px;
}

.markdown-text-scroll-wrapper {
  margin-top: 12px;
  margin-bottom: 12px;
}
</style>
