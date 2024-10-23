import { AkariManager } from '@shared/akari-shard/manager'
import { inject } from 'vue'

export function useShardInstance<T = any>(id: string) {
  const manager = inject<AkariManager>('shard-manager')

  if (!manager) {
    throw new Error('AkariManager is not provided')
  }

  return manager.getInstance(id) as T
}
