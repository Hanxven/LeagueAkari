<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ t('TemplateEdit.title') }}</span>
    </template>
    <div class="template-hint" v-html="t('TemplateEdit.hint')" />
    <div class="template-edit">
      <div class="left-list">
        <NDropdown
          trigger="click"
          placement="bottom-start"
          :options="dropdownOptions"
          size="small"
          :theme-overrides="DROPDOWN_OVERRIDES"
          @select="handleDropdownSelect"
        >
          <NButton type="primary" secondary class="button-new" size="small">
            <template #icon>
              <NIcon>
                <AddIcon />
              </NIcon>
            </template>
            {{ t('TemplateEdit.newButton') }}
          </NButton>
        </NDropdown>
        <NInput
          v-if="igs2.settings.templates.length > 0"
          v-model:value="filterText"
          :placeholder="t('TemplateEdit.filterPlaceholder')"
          class="filter-input"
          size="small"
          clearable
        >
          <template #prefix>
            <NIcon>
              <SearchIcon />
            </NIcon>
          </template>
        </NInput>
        <NVirtualList
          v-if="igs2.settings.templates.length > 0"
          class="list"
          :padding-top="4"
          :item-size="30"
          key-field="id"
          :padding-bottom="4"
          :items="filteredItems"
        >
          <template #default="{ item }">
            <div
              @click="updateActiveItem(item.id)"
              class="list-item"
              :class="{ active: item.id === activeItemId }"
            >
              <NEllipsis class="name" :tooltip="{ placement: 'right' }">{{ item.name }}</NEllipsis>
              <NPopover v-if="!item.isValid" placement="right">
                <template #trigger>
                  <NIcon class="invalid-icon">
                    <Warning20FilledIcon />
                  </NIcon>
                </template>
                <div :class="$style['error-message']">
                  <div :class="$style['error-title']">
                    {{ t('TemplateEdit.errorTitle') }}
                  </div>
                  <div :class="$style['error-divider']"></div>
                  <div :class="$style['error-content']">{{ item.error }}</div>
                </div>
              </NPopover>
            </div>
          </template>
        </NVirtualList>
        <div v-else class="empty">
          <div class="empty-text">
            {{ t('TemplateEdit.noTemplate') }}
          </div>
        </div>
      </div>
      <div class="right-content">
        <template v-if="currentItem">
          <div class="header">
            <NTag
              size="small"
              :type="currentItem.type !== 'unknown' ? 'info' : 'error'"
              :bordered="false"
            >
              {{ t(`in-game-send-main.templateTypes.${currentItem.type}`) }}
            </NTag>
            <NInput
              size="small"
              @blur="handleSaveName"
              @keydown.enter="handleSaveName"
              v-if="isEditingName"
              v-model:value="tempName"
              ref="nameInputEl"
            />
            <div v-else class="title" @click="handleShowEditNameInput">
              <NEllipsis class="name">
                {{ currentItem.name }}
              </NEllipsis>
              <NIcon>
                <EditIcon />
              </NIcon>
            </div>
            <div class="actions">
              <NPopover>
                <template #trigger>
                  <NButton size="small" secondary @click="handleRevert" :disabled="!changed">
                    <template #icon>
                      <NIcon>
                        <UndoIcon />
                      </NIcon>
                    </template>
                  </NButton>
                </template>
                <div>{{ t('TemplateEdit.revertButton') }}</div>
              </NPopover>
              <NPopover>
                <template #trigger>
                  <NButton
                    type="primary"
                    size="small"
                    secondary
                    @click="handleSave"
                    :disabled="!changed"
                  >
                    <template #icon>
                      <NIcon>
                        <SaveIcon />
                      </NIcon>
                    </template>
                  </NButton>
                </template>
                <div>{{ t('TemplateEdit.saveButton') }}</div>
              </NPopover>
              <NPopconfirm
                @positive-click="handleDelete"
                :positive-button-props="{
                  size: 'tiny',
                  type: 'error'
                }"
                :negative-button-props="{
                  size: 'tiny'
                }"
              >
                <template #trigger>
                  <NButton size="small" secondary type="error">
                    <template #icon>
                      <NIcon>
                        <DeleteIcon />
                      </NIcon>
                    </template>
                  </NButton>
                </template>
                <div style="max-width: 260px">{{ t('TemplateEdit.deletePopconfirm') }}</div>
              </NPopconfirm>
            </div>
          </div>
          <Codemirror
            class="editor"
            v-model="tempCode"
            :style="{ flex: 1, height: 0, borderRadius: '2px', overflow: 'hidden' }"
            :autofocus="true"
            :indent-with-tab="true"
            :tab-size="2"
            :extensions="[javascript(), oneDark]"
            @change="handleChange"
          />
        </template>
        <template v-else>
          <div class="empty">
            <div class="empty-text">{{ t('TemplateEdit.noTemplateSelected') }}</div>
          </div>
        </template>
      </div>
    </div>
  </NCard>
</template>

<script lang="ts" setup>
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { useInstance } from '@renderer-shared/shards'
import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import { useInGameSendStore } from '@renderer-shared/shards/in-game-send/store'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Undo as UndoIcon
} from '@vicons/carbon'
import { Warning20Filled as Warning20FilledIcon } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NCard,
  NDropdown,
  NEllipsis,
  NIcon,
  NInput,
  NPopconfirm,
  NPopover,
  NTag,
  NVirtualList,
  useMessage
} from 'naive-ui'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { Codemirror } from 'vue-codemirror'

import { DROPDOWN_OVERRIDES } from './style-overrides'

const { t } = useTranslation()

const igs2 = useInGameSendStore()
const igs = useInstance(InGameSendRenderer)

const message = useMessage()
const activeItemId = ref<string | null>(null)

const dropdownOptions = computed(() => [
  {
    label: t('in-game-send-main.templatePresets.empty'),
    key: 'empty'
  },
  {
    type: 'divider'
  },
  {
    label: t('in-game-send-main.templatePresets.ongoing-game'),
    key: 'ongoing-game-default'
  }
])

const handleDropdownSelect = async (key: string) => {
  if (key === 'empty') {
    const newItem = await igs.createTemplate()
    if (newItem) {
      updateActiveItem(newItem.id)
    }

    return
  }

  const item = await igs.createPresetTemplate(key)
  if (item) {
    updateActiveItem(item.id)
  }
}

const isEditingName = ref(false)
const tempName = ref('')
const tempCode = ref('') // for temporarily use

const currentItem = computed(() => {
  return igs2.settings.templates.find((item) => item.id === activeItemId.value)
})

const changed = ref(false)
const filterText = ref('')
const filteredItems = computed(() => {
  return igs2.settings.templates.filter(
    (item) => item.name.includes(filterText.value) || item.id.includes(filterText.value)
  )
})

const updateActiveItem = (id: string) => {
  activeItemId.value = id
}

watch(
  () => currentItem.value,
  (item) => {
    if (item) {
      tempCode.value = item.code
      isEditingName.value = false
      changed.value = false
    }
  },
  { immediate: true }
)

const nameInputEl = useTemplateRef('nameInputEl')
const handleShowEditNameInput = () => {
  if (currentItem.value) {
    isEditingName.value = true
    tempName.value = currentItem.value.name
    nextTick(() => {
      nameInputEl.value?.focus()
    })
  }
}

const handleSaveName = async () => {
  if (currentItem.value) {
    igs.updateTemplate(currentItem.value.id, { name: tempName.value })
    isEditingName.value = false
  }
}

const handleRevert = () => {
  if (currentItem.value) {
    tempCode.value = currentItem.value.code
    changed.value = false
  }
}

const handleSave = () => {
  if (currentItem.value) {
    igs.updateTemplate(currentItem.value.id, { code: tempCode.value })
    message.success(() => t('TemplateEdit.saveSuccess', { name: currentItem.value!.name }))
  }
}

const handleChange = (_: string, __: any) => {
  changed.value = true
}

const handleDelete = () => {
  if (currentItem.value) {
    let name = currentItem.value.name
    igs.removeTemplate(currentItem.value.id)
    message.success(() => t('TemplateEdit.deleteSuccess', { name }))
  }
}

watch(
  () => igs2.settings.templates,
  (templates) => {
    nextTick(() => {
      if (!currentItem.value && templates.length > 0) {
        updateActiveItem(igs2.settings.templates[0].id)
      }
    })
  },
  { immediate: true }
)
</script>

<style lang="less" scoped>
.template-edit {
  display: flex;
  height: 600px;
  border: 1px solid #fff1;
}

.left-list {
  display: flex;
  flex-direction: column;
  width: 200px;
  height: 100%;
  border-right: 1px solid #fff1;
  flex-shrink: 0;

  .button-new {
    margin-bottom: 8px;
    align-self: flex-start;
  }

  .filter-input {
    margin-bottom: 8px;
  }

  .list {
    flex-grow: 1;
    border: 1px solid #fff1;
    border-radius: 2px;

    .list-item {
      display: flex;
      align-items: center;
      border-radius: 2px;
      height: 28px;
      padding: 0 8px;
      box-sizing: border-box;
      cursor: pointer;
      transition: background-color 0.2s;
      margin: 0 4px 2px 4px;
      font-size: 12px;

      &:hover {
        background-color: #fff1;
      }

      &.active {
        background-color: #fff2;
      }

      .name {
        flex-grow: 1;
      }

      .invalid-icon {
        font-size: 14px;
        color: #ffd900e0;
        margin-left: auto;
      }
    }
  }

  .empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;

    .empty-text {
      font-size: 16px;
      color: #fff1;
    }
  }
}

.right-content {
  flex: 1;
  width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    gap: 8px;
    align-items: center;

    .title {
      font-size: 16px;
      font-weight: bold;
      flex-grow: 1;
      width: 0;

      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      transition: color 0.2s;

      .name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &:hover {
        color: #fff;
      }
    }

    .actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    margin-bottom: 8px;
  }

  .editor {
    flex: 1;
    border: 1px solid #fff1;
    border-radius: 2px;
  }

  .empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;

    .empty-text {
      font-size: 16px;
      color: #fff1;
    }
  }
}

.left-list,
.right-content {
  padding: 8px;
  box-sizing: border-box;
}

.template-hint {
  color: #fff8;
  font-style: italic;
  font-size: 13px;
  margin-bottom: 12px;
}
</style>

<style lang="less" module>
.error-message {
  .error-title {
    font-size: 12px;
  }

  .error-divider {
    height: 1px;
    background-color: #fff2;
    margin: 8px 0;
  }

  .error-content {
    font-size: 12px;
    white-space: pre-wrap;
  }
}
</style>
