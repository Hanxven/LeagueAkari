<template>
  <NScrollbar style="height: 65vh">
    <NCard size="small">
      <template #header><span class="card-header-title">存储的玩家记录 (开发中)</span></template>
      <div class="operations">
        <NButton :disabled="isLoading" size="small" @click="handleReload">刷新</NButton>
      </div>
      <NDataTable
        :single-line="false"
        :loading="isLoading"
        :row-class-name="rowBaseClass"
        :row-key="(d) => d.id"
        size="small"
        remote
        :pagination
        :columns
        :data
      />
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { SavedPlayerRenderer } from '@renderer-shared/shards/saved-player'
import dayjs from 'dayjs'
import {
  DataTableColumns,
  NButton,
  NCard,
  NDataTable,
  NPopconfirm,
  NScrollbar,
  PaginationProps,
  useMessage
} from 'naive-ui'
import { computed, h, onMounted, reactive, ref, useCssModule } from 'vue'

const sp = useInstance<SavedPlayerRenderer>('saved-player-renderer')
const styles = useCssModule()

const renderDate = (date: string | number | Date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const renderEllipsis = (text: string, length: number) => {
  if (text.length > length) {
    return text.slice(0, length) + '...'
  }
  return text
}

const renderEmpty = (text: string | null | undefined) => {
  if (text) {
    return text
  }

  return h(
    'span',
    {
      class: styles['empty']
    },
    '(empty)'
  )
}

const columns = computed<DataTableColumns>(() => [
  {
    title: '玩家',
    key: 'puuid',
    render: (row: any) => {
      return renderEllipsis(row.puuid, 6)
    }
  },
  {
    title: '记录自',
    key: 'selfPuuid',
    render: (row: any) => {
      return renderEllipsis(row.puuid, 6)
    }
  },
  { title: '地区', key: 'region' },
  { title: '平台', key: 'rsoPlatformId' },
  {
    title: '标记',
    key: 'tag',
    render: (row: any) => {
      return renderEmpty(row.tag)
    }
  },
  {
    title: '更新日期',
    key: 'updateAt',
    render: (row: any) => {
      return renderDate(row.updateAt)
    }
  },
  {
    title: '上次遇到',
    key: 'lastMetAt',
    render: (row: any) => {
      return renderDate(row.lastMetAt)
    }
  },
  {
    title: '操作',
    key: 'operations',
    render: (row: any) => {
      return h(
        'div',
        {
          styles: {
            display: 'flex',
            gap: '4px',
            alignItems: 'center'
          }
        },
        [
          h(
            NPopconfirm,
            {
              positiveText: '删除',
              negativeText: '取消',
              positiveButtonProps: {
                type: 'error',
                size: 'tiny'
              },
              negativeButtonProps: {
                size: 'tiny'
              },
              onPositiveClick: () => {
                deleteItem(row.puuid, row.selfPuuid)
              }
            },
            {
              trigger: () => h(NButton, { size: 'tiny', type: 'error' }, () => '删除'),
              default: () => '确认删除？'
            }
          )
        ]
      )
    }
  }
])

const data = ref<any[]>([])

const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  disabled: computed(() => isLoading.value),

  onChange: (page: number) => {
    loadPage(page, pagination.pageSize || 20)
  },
  onUpdatePageSize: (pageSize: number) => {
    loadPage(pagination.page || 1, pageSize)
  }
})

const message = useMessage()
const toUniqueKey = (puuid: string, selfPuuid) => {
  return `${puuid}:${selfPuuid}`
}

const isLoading = ref(false)

const loadPage = async (page: number, pageSize: number) => {
  if (isLoading.value) {
    return
  }

  isLoading.value = true

  try {
    const { data: pageData, count } = await sp.queryAllSavedPlayers({
      page,
      pageSize
    })

    data.value = pageData.map((value: any) => {
      return {
        ...value,
        id: toUniqueKey(value.puuid, value.selfPuuid)
      }
    })

    pagination.page = page
    pagination.pageSize = pageSize
    pagination.itemCount = count
  } catch {
    message.warning(`加载第 ${page} 页失败`)
  } finally {
    isLoading.value = false
  }
}

const deleteItem = async (puuid: string, selfPuuid: string) => {
  if (isLoading.value) {
    return
  }

  isLoading.value = true

  try {
    await sp.deleteSavedPlayer({
      puuid,
      selfPuuid
    })
    message.success('删除成功')
  } catch {
    message.error('删除失败')
  } finally {
    isLoading.value = false
  }

  await loadPage(pagination.page || 1, pagination.pageSize || 40)
}

const handleReload = async () => {
  await loadPage(pagination.page || 1, pagination.pageSize || 40)
  message.success('刷新')
}

onMounted(() => {
  loadPage(1, 20)
})

const rowBaseClass = () => {
  return styles['row-base']
}
</script>

<style lang="less" scoped>
.card-header-title {
  font-weight: bold;
  font-size: 18px;
}

.control-line {
  display: flex;
  align-items: center;
  font-size: 13px;
  height: 30px;

  &:not(:last-child) {
    margin-bottom: 16px;
  }

  .label {
    width: 130px;
  }

  // .control {
  // }

  .input-number {
    width: 120px;
  }
}

.operations {
  display: flex;
  margin-bottom: 8px;
}
</style>

<style lang="less" module>
.row-base {
  font-size: 12px;
}

.empty {
  color: #ffffff80;
}
</style>
