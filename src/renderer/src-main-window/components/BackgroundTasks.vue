<template>
  <div class="tasks">
    <div class="task-title">{{ t('BackgroundTasks.taskTitle', { countV: bts.tasks.length }) }}</div>
    <div class="divider"></div>
    <div
      class="task"
      :class="{
        error: task.status === 'error'
      }"
      v-for="task of bts.tasks"
      :key="task.id"
    >
      <div class="task-name">
        <component :is="renderText(task.name)" />
      </div>
      <NProgress
        v-if="task.progress !== null"
        class="task-progress"
        type="line"
        :border-radius="2"
        :percentage="task.progress * 100"
        :status="task.status"
      >
        {{ (task.progress * 100).toFixed(2) }}%
      </NProgress>
      <div class="task-description">
        <component :is="renderText(task.description)" />
      </div>
      <div class="actions" v-if="task.actions.length">
        <NButton
          size="tiny"
          v-for="action of task.actions"
          @click="action.callback"
          v-bind="action.buttonProps"
        >
          <component :is="renderText(action.label)" />
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBackgroundTasksStore } from '@renderer-shared/shards/background-tasks/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NProgress } from 'naive-ui'
import { VNodeChild, h } from 'vue'

const { t } = useTranslation()
const bts = useBackgroundTasksStore()

const renderText = (node: string | (() => VNodeChild)) => {
  if (typeof node === 'string') {
    return h('span', node)
  }

  return { render: node }
}
</script>

<style lang="less" scoped>
.tasks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
  justify-content: flex-end;
}

.task-title {
  font-size: 12px;
  font-weight: bold;
}

.divider {
  height: 1px;
  background-color: #fff1;
}

.task {
  background-color: #fff1;
  border-radius: 2px;
  padding: 8px 16px;
  width: 320px;

  &.error {
    background-color: #ff4d4f20;
  }

  .task-name {
    font-size: 14px;
    font-weight: bold;
  }

  .task-progress {
    margin-top: 8px;
  }

  .task-description {
    font-size: 12px;
    margin-top: 8px;
    color: #fffc;
  }
}
</style>
