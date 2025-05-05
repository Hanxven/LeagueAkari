import { ButtonProps } from 'naive-ui'
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

  buttonProps?: ButtonProps
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

  status: 'success' | 'error' | 'warning' | 'info' | 'default'

  /**
   * 任务描述
   */
  description: string | (() => VNodeChild)

  progress: number | null

  actions: BackgroundTaskAction[]
}

export interface BackgroundTaskRef {
  isRemoved: () => boolean
  update: (task: Partial<Omit<BackgroundTask, 'id'>>) => void
  remove: () => void
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

  const removeTask = (id: string) => {
    const index = tasks.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      tasks.value.splice(index, 1)
    }
  }

  const createTask = (
    id: string,
    task?: Partial<Omit<BackgroundTask, 'id'>>
  ): BackgroundTaskRef => {
    const newTask: BackgroundTask = {
      id,
      createAt: Date.now(),
      name: '',
      status: 'default',
      description: '',
      progress: null,
      actions: [],
      ...task
    }
    tasks.value.push(newTask)

    return {
      isRemoved: () => tasks.value.findIndex((t) => t.id === id) === -1,
      update: (task: Partial<Omit<BackgroundTask, 'id'>>) => updateTask(id, task),
      remove: () => removeTask(id)
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
