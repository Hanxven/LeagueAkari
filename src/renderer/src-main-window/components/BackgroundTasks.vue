<template>
  <div class="tasks">
    <div class="task" v-for="task of bts.tasks" :key="task.id">
      <div class="task-name">
        <component :is="renderText(task.name)" />
      </div>
      <NProgress
        v-if="task.progress !== null"
        class="task-progress"
        type="line"
        :border-radius="2"
        :percentage="task.progress * 100"
        >{{ (task.progress * 100).toFixed(2) }}%</NProgress
      >
      <div class="task-description">
        <component :is="renderText(task.description)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBackgroundTasksStore } from '@renderer-shared/shards/background-tasks/store'
import { NProgress } from 'naive-ui'
import { VNodeChild, h } from 'vue'

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

.task {
  border: 1px solid #fff2;
  border-radius: 2px;
  padding: 8px;
  width: 320px;

  .task-name {
    font-size: 14px;
    font-weight: bold;
  }

  .task-progress {
    margin-top: 8px;
  }

  .task-description {
    font-size: 12px;
    margin-top: 4px;
    color: #fffc;
  }
}
</style>
