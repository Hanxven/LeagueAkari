<template>
  <div class="shortcut-selector-wrapper">
    <NModal
      :class="$style['modal-content']"
      size="small"
      preset="card"
      transform-origin="center"
      v-model:show="show"
      :close-on-esc="false"
      @keydown.enter.prevent
      @keydown.space.prevent
      :title="t('ShortcutSelector.title')"
    >
      <template #footer>
        <div class="action-buttons">
          <NButton size="small" @click="show = false">{{ t('ShortcutSelector.cancel') }}</NButton>
          <NButton size="small" type="warning" @click="currentShortcutId = null">{{
            t('ShortcutSelector.clear')
          }}</NButton>
          <NButton
            size="small"
            type="primary"
            @click="handleSubmit"
            :disabled="isOccupiedBy !== null"
            >{{ t('ShortcutSelector.ok') }}</NButton
          >
        </div>
      </template>
      <div class="keys-outline">
        <template v-for="(key, index) of editingKeys" :key="key">
          <div class="key">
            {{ key }}
          </div>
          <span class="plus" v-if="index !== editingKeys.length - 1">+</span>
        </template>
        <span class="empty" v-if="!editingKeys.length">{{ t('ShortcutSelector.hint') }}</span>
      </div>
      <div v-if="isOccupiedBy && targetId !== isOccupiedBy.targetId" class="warn-text">
        <template
          v-if="isOccupiedBy.targetId === KeyboardShortcutsRenderer.DISABLED_KEYS_TARGET_ID"
        >
          {{ t('ShortcutSelector.reservedShortcut') }}
        </template>
        <template v-else>
          {{ t('ShortcutSelector.beingOccupied') }}
        </template>
      </div>
      <div v-if="editingKeys.length > 4" class="warn-text">
        {{ t('ShortcutSelector.tooComplicated') }}
      </div>
    </NModal>
    <NPopover :disabled="as.isAdministrator">
      <template #trigger>
        <NButton size="tiny" :disabled="!as.isAdministrator" type="primary" @click="show = true">
          {{ t('ShortcutSelector.select') }}
        </NButton>
      </template>
      {{ t('ShortcutSelector.notRunAsAdministrator') }}
    </NPopover>
    <div class="keys-preview">
      <template v-for="(key, index) of keys" :key="key">
        <div class="key">
          {{ key }}
        </div>
        <span class="plus" v-if="index !== keys.length - 1">+</span>
      </template>
      <span class="empty" v-if="!keys.length">{{ t('ShortcutSelector.unset') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { KeyboardShortcutsRenderer } from '@renderer-shared/shards/keyboard-shortcut'
import { useTranslation } from 'i18next-vue'
import { NButton, NModal, NPopover } from 'naive-ui'
import { computed, onDeactivated, onUnmounted, ref, shallowRef, watch } from 'vue'

defineProps<{
  targetId?: string
}>()

const { t } = useTranslation()

const as = useAppCommonStore()

const kbd = useInstance(KeyboardShortcutsRenderer)

const show = defineModel<boolean>('show', { default: false })
const shortcutId = defineModel<string | null>('shortcutId', { default: null })

const currentShortcutId = ref<string | null>(null)

const handleSubmit = async () => {
  shortcutId.value = currentShortcutId.value
  show.value = false
}

const editingKeys = computed(() => {
  return currentShortcutId.value?.split('+') ?? []
})

const keys = computed(() => {
  return shortcutId.value?.split('+') ?? []
})

let handler: () => void

const preventFn = (event: KeyboardEvent) => {
  const { key, altKey, ctrlKey, metaKey, shiftKey } = event

  const blockedCombinations: {
    key: string
    altKey?: boolean
    ctrlKey?: boolean
    metaKey?: boolean
    shiftKey?: boolean
  }[] = [
    { key: 'F4', altKey: true },
    { key: 'R', ctrlKey: true, shiftKey: true },
    { key: 'I', ctrlKey: true, shiftKey: true }
  ]

  const isBlocked = blockedCombinations.some((combo) => {
    return (
      key === combo.key &&
      !!combo.altKey === !!altKey &&
      !!combo.ctrlKey === !!ctrlKey &&
      !!combo.metaKey === !!metaKey &&
      !!combo.shiftKey === !!shiftKey
    )
  })

  if (isBlocked) {
    event.preventDefault()
    event.stopPropagation()
  }
}

const isOccupiedBy = shallowRef<{
  type: 'last-active' | 'normal'
  targetId: string
} | null>(null)

watch(
  () => currentShortcutId.value,
  async (shortcut) => {
    if (shortcut) {
      isOccupiedBy.value = await kbd.getRegistration(shortcut)
    } else {
      isOccupiedBy.value = null
    }
  },
  { immediate: true }
)

watch(
  () => show.value,
  async () => {
    if (show.value) {
      if (currentShortcutId.value) {
        isOccupiedBy.value = await kbd.getRegistration(currentShortcutId.value)
      }

      currentShortcutId.value = shortcutId.value
      handler = kbd.onShortcut((event) => {
        currentShortcutId.value = event.id
      })
      window.addEventListener('keydown', preventFn)
    } else {
      handler?.()
      window.removeEventListener('keydown', preventFn)
      isOccupiedBy.value = null
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  handler?.()
  window.removeEventListener('keydown', preventFn)
})

onDeactivated(() => {
  show.value = false
})
</script>

<style lang="less" scoped>
.shortcut-selector-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

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

.keys-preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
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

.warn-text {
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
