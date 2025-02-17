<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :closable="false"
    :close-on-esc="false"
    :mask-closable="false"
    :class="$style['declaration-modal']"
  >
    <template #header>
      <span class="card-header-title">{{ t('DeclarationModal.title') }}</span>
    </template>
    <template #footer>
      <NFlex justify="flex-end" align="center">
        <NButton @click="() => emits('confirm', showAgainChecked)" size="small" type="primary">{{
          t('DeclarationModal.ok')
        }}</NButton>
        <NCheckbox v-model:checked="showAgainChecked" size="small" style="font-size: 12px">{{
          t('DeclarationModal.showAgain')
        }}</NCheckbox>
      </NFlex>
    </template>
    <div>
      <div class="para"><LeagueAkariSpan /> {{ t('DeclarationModal.line1') }}</div>
      <div class="para">{{ t('DeclarationModal.line2') }}</div>
      <div class="para">{{ t('DeclarationModal.line3') }}</div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useTranslation } from 'i18next-vue'
import { NButton, NCheckbox, NFlex, NModal } from 'naive-ui'
import { ref } from 'vue'

const { t } = useTranslation()

const emits = defineEmits<{
  (e: 'confirm', notShowAgain: boolean): void
}>()

const showAgainChecked = ref(false)

const show = defineModel<boolean>('show', { default: false })
</script>

<style lang="less" scoped>
.para {
  font-size: 13px;
}

.para:not(:last-child) {
  margin-bottom: 8px;
}
</style>

<style lang="less" module>
.declaration-modal {
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
