import { mainCall, mainStateSync } from '@shared/renderer/utils/ipc'
import { shallowRef } from 'vue'

import { TitleBarTask, useMainWindowStore } from './store'

export async function setupMainWindow() {
  const app = useMainWindowStore()

  await migrateFromPreviousLocalStorageSettings()

  mainStateSync('main-window/state', (s) => (app.windowState = s))

  mainStateSync('main-window/focus', (s) => (app.focusState = s))
}

/**
 * 尝试迁移所有设置项到新版本中
 */
async function migrateFromPreviousLocalStorageSettings() {
  const all: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const item = localStorage.getItem(key)
      if (item) {
        all[key] = item
      }
    }
  }

  if (Object.keys(all).length === 0) {
    return
  }

  try {
    const ok = await mainCall('app/migrate-settings-from-previous-local-storage', all)
    if (ok) {
      localStorage.clear()
    }
  } catch {}
}

// 暂时未使用，在复杂度提升后，将作为标题栏任务的展示方式
export function createTitleBarTask(id: string) {
  const app = useMainWindowStore()

  if (app.titleBarTasks.find((t) => t.id === id)) {
    throw new Error(`Module ${id} already exists`)
  }

  const task = shallowRef<TitleBarTask>({ id })

  app.titleBarTasks.push(task.value)

  return {
    task,
    remove: () => {
      const index = app.titleBarTasks.findIndex((t) => t.id === id)
      if (index !== -1) {
        app.titleBarTasks.splice(index, 1)
      }
    }
  }
}
