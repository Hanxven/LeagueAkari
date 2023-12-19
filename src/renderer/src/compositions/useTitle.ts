import { computed } from 'vue'

import { useAppState } from '@renderer/features/stores/app'

// 在管理员权限运行时，改一个名字，不明觉厉
export function useTitle() {
  const appState = useAppState()
  return computed(() => (appState.isAdmin ? 'League Toolkiverse' : 'League Toolkit'))
}
