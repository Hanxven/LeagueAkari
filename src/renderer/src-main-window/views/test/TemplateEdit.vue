<template>
  <NCard size="small">
    <div class="template-edit">
      <div class="left-list">
        <NButton type="primary" secondary class="button-new" size="small" @click="handleNew">
          <template #icon>
            <NIcon>
              <AddIcon />
            </NIcon>
          </template>
          New
        </NButton>
        <NInput v-model:value="filterText" class="filter-input" size="small" clearable>
          <template #prefix>
            <NIcon>
              <SearchIcon />
            </NIcon>
          </template>
        </NInput>
        <NVirtualList
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
              {{ item.name }}
            </div>
          </template>
        </NVirtualList>
      </div>
      <div class="right-content">
        <template v-if="currentItem">
          <div class="header">
            <div class="title">{{ currentItem?.name }}</div>
            <div class="actions">
              <NButton size="small" secondary @click="handleRevert" :disabled="!changed">
                Revert
              </NButton>
              <NButton size="small" secondary @click="handleSave" :disabled="!changed">
                Save
              </NButton>
              <NButton size="small" secondary type="warning" @click="handleDelete">
                Delete
              </NButton>
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
            <div class="empty-text">No template selected</div>
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
import { TemplateDef, useInGameSendStore } from '@renderer-shared/shards/in-game-send/store'
import { Add as AddIcon, Search as SearchIcon } from '@vicons/carbon'
import { NButton, NCard, NIcon, NInput, NVirtualList, useMessage } from 'naive-ui'
import { computed, onMounted, ref, watch } from 'vue'
import { Codemirror } from 'vue-codemirror'

const igs2 = useInGameSendStore()
const igs = useInstance(InGameSendRenderer)

const message = useMessage()
const activeItemId = ref<string | null>(null)
const tempCode = ref('') // for temporarily use

const currentItem = computed(() => {
  return igs2.settings.templates.find((item) => item.id === activeItemId.value)
})

const changed = ref(false)
const filterText = ref('')
const filteredItems = computed(() => {
  return igs2.settings.templates.filter((item) => item.name.includes(filterText.value))
})

const updateActiveItem = (id: string) => {
  activeItemId.value = id
}

watch(
  () => currentItem.value,
  (item) => {
    if (item) {
      activeItemId.value = item.id
      tempCode.value = item.code
      changed.value = false
    }
  },
  { immediate: true }
)

const handleRevert = () => {
  if (currentItem.value) {
    tempCode.value = currentItem.value.code // shallow copy it
    changed.value = false
    message.success(`Reverted ${currentItem.value.name}`)
  }
}

const handleSave = () => {
  if (currentItem.value) {
    igs.updateTemplate(currentItem.value.id, { ...currentItem.value, code: tempCode.value })
    message.success(`Saved ${currentItem.value.name}`)
  }
}

const handleChange = (_: string, __: any) => {
  changed.value = true
}

const handleDelete = () => {
  if (currentItem.value) {
    igs.removeTemplate(currentItem.value.id)
    message.success(`Deleted ${currentItem.value.name}`)
  }
}

const handleNew = async () => {
  const newItem = await igs.createTemplate()
  updateActiveItem(newItem.id)
}

watch(
  () => igs2.settings.templates,
  (_) => {
    console.log('changed', _)

    if (!currentItem.value && igs2.settings.templates.length > 0) {
      updateActiveItem(igs2.settings.templates[0].id)
    }
  },
  { immediate: true }
)
</script>

<style lang="less" scoped>
.template-edit {
  display: flex;
  width: 798px;
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
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      font-size: 12px;

      &:hover {
        background-color: #fff1;
      }

      &.active {
        background-color: #fff2;
      }
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

    .title {
      font-size: 16px;
      font-weight: bold;
      flex-grow: 1;
      width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
</style>
