<template>
  <NModal
    :class="$style['modal-content']"
    size="small"
    preset="card"
    transform-origin="center"
    v-model:show="show"
    :close-on-esc="false"
    @keydown.enter.prevent
    @keydown.space.prevent
    title="快捷键设定"
  >
    <template #footer>
      <div class="action-buttons">
        <NButton size="small" @click="show = false">取消</NButton>
        <NButton size="small" type="primary" @click="handleSubmit">确定</NButton>
      </div>
    </template>
    <div class="keys-outline">
      <template v-for="(key, index) of keys" :key="key">
        <div class="key">
          {{ key }}
        </div>
        <span class="plus" v-if="index !== keys.length - 1">+</span>
      </template>
      <span class="empty" v-if="!keys.length">按下按键以记录快捷键</span>
    </div>
    <div v-if="keys.length > 4" class="too-complicated">该快捷键组合具有较高复杂度，请确认</div>
  </NModal>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { KeyboardShortcutsRenderer } from '@renderer-shared/shards/keyboard-shortcut'
import { NButton, NModal } from 'naive-ui'
import { ref, watch } from 'vue'

const emits = defineEmits<{
  submit: [shortcutId: string]
}>()

const kbd = useInstance<KeyboardShortcutsRenderer>('keyboard-shortcuts-renderer')

const show = defineModel<boolean>('show', { default: false })

const currentShortcutId = ref<string | null>(null)
const keys = ref<string[]>([])

const handleSubmit = () => {
  if (currentShortcutId.value) {
    emits('submit', currentShortcutId.value)
  }
  show.value = false
}

let handler: () => void

watch(
  () => show.value,
  () => {
    if (show.value) {
      keys.value = []
      currentShortcutId.value = null
      handler = kbd.onShortcut((event) => {
        keys.value = event.keys.map((key) => key.keyId)
        currentShortcutId.value = event.id
      })
    } else {
      handler?.()
    }
  },
  { immediate: true }
)
</script>

<style lang="less" scoped>
.keys-outline {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  min-height: 28px;
  width: 400px;
  padding: 4px 8px;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  gap: 4px;
}

.key {
  color: rgb(204, 204, 204);
  font-size: 12px;
  font-weight: bold;
  padding: 2px 8px;
  background-color: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 2px;
  line-height: 1;
}

.empty {
  line-height: 1;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.too-complicated {
  font-size: 12px;
  color: rgba(243, 207, 31, 0.8);
  margin-top: 4px;
}

.plus {
  line-height: 1;
  color: rgba(255, 255, 255, 0.6);
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}
</style>

<style lang="less" module>
.modal-content {
  width: fit-content;
}
</style>
