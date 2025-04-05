import { onActivated, onDeactivated, ref } from 'vue'

export function useActivated() {
  const isActivated = ref(false)

  onActivated(() => (isActivated.value = true))
  onDeactivated(() => (isActivated.value = false))

  return isActivated
}
