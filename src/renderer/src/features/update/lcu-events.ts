import { onUpdate } from '@renderer/ipc'
import { RadixMatcher } from '@renderer/utils/radix-matcher'

const matcher = new RadixMatcher()

export interface LcuEvent<T = any> {
  uri: string
  data: T
  eventType: 'Update' | 'Create' | 'Delete'
}

export function startLcuEventUpdate(): () => void {
  return onUpdate('lcuEvent', async (_event, event: LcuEvent) => {
    const routes = matcher.findAll(event.uri)
    for (const r of routes) {
      for (const cb of r.data.callbacks) {
        cb(event, r.params)
      }
    }
  })
}

export function onLcuEvent<T = any, P = Record<string, any>>(
  route: string,
  listener: (event: LcuEvent<T>, params: P) => void
): () => void {
  const data = matcher.getRouteData(route)

  if (data) {
    data.data.callbacks.add(listener)
  } else {
    matcher.insert(route, { callbacks: new Set([listener]) })
  }

  return () => {
    const routeData = matcher.getRouteData(route)
    if (routeData) {
      routeData.data.callbacks.delete(listener)
      if (routeData.data.callbacks.size === 0) {
        matcher.remove(route)
      }
    }
  }
}
