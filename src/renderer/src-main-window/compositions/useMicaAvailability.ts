import { useWindowManagerStore } from '@renderer-shared/shards/window-manager/store'
import { computed } from 'vue'

/**
 * 是否希望使用 Mica 材质
 * @returns
 */
export function useMicaAvailability() {
  const wms = useWindowManagerStore()

  return computed(() => {
    return wms.supportsMica && wms.settings.backgroundMaterial === 'mica'
  })
}
