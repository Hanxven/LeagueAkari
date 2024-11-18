import { ComputedRef, Ref, UnwrapRef, computed, reactive, ref } from 'vue'

export interface TabType<T = any> {
  id: string
  isPinned: boolean
  isTemporary: boolean
  data: T
}

export interface UnwrappedTabType<T = any> {
  id: string
  isPinned: boolean
  isTemporary: boolean
  data: UnwrapRef<T>
}

export type UseTabsReturn<T> = {
  tabs: Readonly<Ref<UnwrappedTabType<T>[]>>
  current: ComputedRef<UnwrappedTabType<T> | null>
  setCurrent: (id: string) => void
  add: (id: string, data: T, options?: { pin?: boolean; temporary?: boolean }) => void
  get: (id: string) => UnwrappedTabType<T> | null
  set: (id: string, data: T) => void
  del: (id: string) => void
  setPinned: (id: string, pin: boolean) => void
  setTemporary: (id: string, temporary: boolean) => void
  move: (sourceId: string, targetId: string) => void
  closeAllTemporary: () => void
  closeAll: () => void
  closeOther: (currentId: string) => void
  canCloseOther: (currentId: string) => boolean
  canCloseCurrent: (currentId: string) => boolean
  canCloseAllTemporary: () => boolean
}

/**
 * 用于管理 tabs 的底层数据结构封装
 * @deprecated
 * @returns
 */
export function useTabs<T = any>(): UseTabsReturn<T> {
  const tabs = ref<TabType<T>[]>([])
  const tabsMap = new Map<string, UnwrappedTabType<T>>()
  const currentTabId = ref<string | null>(null)

  const current = computed(() => {
    if (currentTabId.value === null) {
      return null
    }
    return tabsMap.get(currentTabId.value) || null
  })

  const setCurrent = (id: string) => {
    if (tabsMap.has(id)) {
      currentTabId.value = id
    } else {
      console.warn(`Tab with ID ${id} not found.`)
    }
  }

  const switchToAdjacentTab = (index: number) => {
    const right = Math.min(index, tabs.value.length - 1)

    if (right === 0) {
      setCurrent(tabs.value[0].id)
      return
    }

    setCurrent(tabs.value[index - 1].id)
  }

  const del = (id: string) => {
    const index = tabs.value.findIndex((t) => t.id === id)
    if (index === -1) {
      console.warn(`Tab with ID ${id} not found.`)
      return
    }

    if (tabs.value[index].isPinned) {
      console.warn(`Cannot delete a pinned tab. Please unpin it first.`)
      return
    }

    if (currentTabId.value === id) {
      switchToAdjacentTab(index)
    }

    tabs.value.splice(index, 1)
    tabsMap.delete(id)
  }

  const get = (id: string) => {
    const tab = tabsMap.get(id)
    if (!tab) {
      return null
    }
    return tab
  }

  const add = (
    id: string,
    data: T,
    options: {
      pin?: boolean
      temporary?: boolean
    } = {}
  ) => {
    const { pin = false, temporary = false } = options
    const newTab: UnwrappedTabType<T> = reactive({
      id,
      isPinned: pin,
      isTemporary: pin ? false : temporary,
      data
    })

    tabsMap.set(id, newTab)

    if (pin) {
      tabs.value.unshift(newTab)
    } else {
      tabs.value.push(newTab)
    }

    if (currentTabId.value === null) {
      setCurrent(id)
    }
  }

  const set = (id: string, data: T) => {
    const tab = tabsMap.get(id)
    if (!tab) {
      console.warn(`Tab with ID ${id} not found.`)
      return
    }

    tab.data = data as UnwrapRef<T>
  }

  const setPinned = (id: string, pin: boolean) => {
    const tab = tabsMap.get(id)
    if (!tab) {
      console.warn(`Tab with ID ${id} not found.`)
      return
    }

    if (tab.isPinned === pin) {
      return
    }

    tab.isPinned = pin

    const index = tabs.value.findIndex((t) => t.id === id)

    if (pin) {
      tabs.value.splice(index, 1)
      tabs.value.unshift(tab)
    } else {
      const lastPinnedIndex = tabs.value.findLastIndex((t) => t.isPinned)
      if (index !== lastPinnedIndex + 1) {
        tabs.value.splice(index, 1)
        tabs.value.splice(lastPinnedIndex, 0, tab)
      }
    }
  }

  const setTemporary = (id: string, temporary: boolean) => {
    const tab = tabsMap.get(id)
    if (!tab) {
      console.warn(`Tab with ID ${id} not found.`)
      return
    }

    if (tab.isPinned) {
      console.warn(`Tab with ID ${id} is pinned.`)
      return
    }

    tab.isTemporary = temporary
  }

  const move = (sourceId: string, targetId: string) => {
    const sourceTab = tabsMap.get(sourceId)
    const targetTab = tabsMap.get(targetId)

    if (!sourceTab || !targetTab) {
      console.warn(`One or both tabs with IDs ${sourceId} and ${targetId} not found.`)
      return
    }

    if (sourceTab.id === targetTab.id) {
      console.warn(`Destination must be different.`)
      return
    }

    const sourceIndex = tabs.value.findIndex((tab) => tab.id === sourceId)
    const targetIndex = tabs.value.findIndex((tab) => tab.id === targetId)

    if (sourceIndex === -1 || targetIndex === -1) {
      console.warn(`Error finding tab positions.`)
      return
    }

    if (sourceTab.isPinned !== targetTab.isPinned) {
      // 如果跨区移动，则找到最后一个固定标签页的位置
      const lastPinnedIndex = tabs.value.findIndex((tab) => tab.isPinned)
      if (sourceTab.isPinned) {
        tabs.value.splice(sourceIndex, 1)
        tabs.value.splice(lastPinnedIndex, 0, sourceTab)
      } else {
        tabs.value.splice(sourceIndex, 1)
        tabs.value.splice(lastPinnedIndex + 1, 0, sourceTab)
      }
    } else {
      tabs.value.splice(sourceIndex, 1)
      tabs.value.splice(targetIndex, 0, sourceTab)
    }
  }

  const closeAllTemporary = () => {
    const currentTabIndex = tabs.value.findIndex((tab) => tab.id === currentTabId.value)
    for (let i = tabs.value.length - 1; i >= 0; i--) {
      const tab = tabs.value[i]
      if (tab.isTemporary) {
        tabs.value.splice(i, 1)
        tabsMap.delete(tab.id)
      }
    }
    if (!tabsMap.has(currentTabId.value!)) {
      switchToAdjacentTab(currentTabIndex)
    }
  }

  const closeAll = () => {
    tabs.value = []
    tabsMap.clear()
    currentTabId.value = null
  }

  const closeOther = (currentId: string) => {
    let currentIndex = -1
    for (let i = tabs.value.length - 1; i >= 0; i--) {
      const tab = tabs.value[i]
      if (tab.id === currentId) {
        currentIndex = i
        continue
      }
      if (!tab.isPinned) {
        if (currentIndex !== -1) {
          currentIndex--
        }
        tabs.value.splice(i, 1)
        tabsMap.delete(tab.id)
      }
    }
    if (!tabsMap.has(currentTabId.value!)) {
      switchToAdjacentTab(currentIndex)
    }
  }

  const canCloseOther = (currentId: string): boolean => {
    return tabs.value.some((tab) => !tab.isPinned && tab.id !== currentId)
  }

  const canCloseCurrent = (currentId: string): boolean => {
    const currentTab = tabsMap.get(currentId)
    if (!currentTab) {
      return false
    }
    return !currentTab.isPinned
  }

  const canCloseAllTemporary = (): boolean => {
    return tabs.value.some((tab) => tab.isTemporary)
  }

  return {
    tabs,
    current,
    setCurrent,
    add,
    get,
    set,
    del,
    setPinned,
    setTemporary,
    move,
    closeAllTemporary,
    closeAll,
    closeOther,
    canCloseAllTemporary,
    canCloseCurrent,
    canCloseOther
  }
}
