import { defineStore } from 'pinia'
import { VNodeChild, h, ref } from 'vue'

export interface BackgroundTaskAction {
  /**
   * 上面写着什么
   */
  label: string | (() => VNodeChild)

  /**
   * 点击这个 action 提供的回调方法
   */
  callback: () => void
}

export interface BackgroundTask {
  /**
   * 唯一标识
   */
  id: string

  /**
   * 任务创建时间
   */
  createAt: number

  /**
   * 任务名称
   */
  name: string | (() => VNodeChild)

  /**
   * 任务描述
   */
  description: string | (() => VNodeChild)

  progress: number | null

  actions: BackgroundTaskAction[]
}

/**
 * store only
 */
export const useBackgroundTasksStore = defineStore('shard:background-tasks-renderer', () => {
  const tasks = ref<BackgroundTask[]>([])

  const updateTask = (id: string, task?: Partial<Omit<BackgroundTask, 'id'>>) => {
    const index = tasks.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...task }
    }
  }

  const createTask = (id: string, task?: Partial<Omit<BackgroundTask, 'id'>>) => {
    const newTask: BackgroundTask = {
      id,
      createAt: Date.now(),
      name: '',
      description: '',
      progress: null,
      actions: [],
      ...task
    }
    tasks.value.push(newTask)
  }

  const removeTask = (id: string) => {
    const index = tasks.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      tasks.value.splice(index, 1)
    }
  }

  const hasTask = (id: string) => {
    return tasks.value.some((t) => t.id === id)
  }

  return {
    tasks,

    updateTask,
    createTask,
    removeTask,
    hasTask
  }
})
