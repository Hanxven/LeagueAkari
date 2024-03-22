<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :closable="false"
    :close-on-esc="false"
    :mask-closable="false"
    :class="styles['declaration-modal']"
  >
    <template #header><span class="card-header-title">应用声明</span></template>
    <template #footer>
      <NFlex justify="flex-end" align="center">
        <NButton @click="() => emits('confirm', !notShowAgainChecked)" size="tiny" type="primary"
          >我已知晓</NButton
        >
        <NCheckbox v-model:checked="notShowAgainChecked" size="small" style="font-size: 12px"
          >不再提醒</NCheckbox
        >
      </NFlex>
    </template>
    <div>
      <div class="para">
        League Akari
        是免费开源的软件，旨在提供额外的辅助功能。若您是从付费渠道获取该软件，请谨慎对待。
      </div>
      <div class="para">
        同时强调，对于使用本软件可能带来的任何后果，包括但不限于游戏账户的封禁、数据损坏或其他任何形式的游戏体验负面影响，本软件的开发者将不承担任何责任。用户在决定使用本软件时，应充分考虑并自行承担由此产生的所有风险和后果。
      </div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { NButton, NCheckbox, NFlex, NModal } from 'naive-ui'
import { ref, useCssModule } from 'vue'

const emits = defineEmits<{
  (e: 'confirm', notShowAgain: boolean): void
}>()

const styles = useCssModule()
const notShowAgainChecked = ref(false)

const show = defineModel<boolean>('show', { default: false })
</script>

<style lang="less" scoped>
.card-header-title {
  font-weight: bold;
  font-size: 18px;
}

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
