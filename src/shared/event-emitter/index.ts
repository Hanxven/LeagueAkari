import { RadixMatcher } from '@shared/utils/radix-matcher'

/**
 * 高效的封装，完美的封装，爱来自 Hanxven ❤️
 */
export class RadixEventEmitter {
  private matcher = new RadixMatcher()

  /**
   * dispatcher!
   * @param uri 资源标识符
   * @param data 除了 null 和 undefined 之外的东西
   */
  emit<T = any>(uri: string, data: T): void {
    const routes = this.matcher.findAll(uri)

    for (const r of routes) {
      for (const cb of r.data.callbacks) {
        cb(data, r.params)
      }
    }
  }

  /**
   * @param uri 资源标识符
   * @param listener 回调
   * @returns 一个取消监听的回调
   */
  on<T = any, P = Record<string, any>>(
    uri: string,
    listener: (data: T, params: P) => void
  ): () => void {
    const data = this.matcher.getRouteData(uri)

    if (data) {
      data.data.callbacks.add(listener)
    } else {
      this.matcher.insert(uri, { callbacks: new Set([listener]) })
    }

    return () => {
      const routeData = this.matcher.getRouteData(uri)
      if (routeData) {
        routeData.data.callbacks.delete(listener)
        if (routeData.data.callbacks.size === 0) {
          this.matcher.remove(uri)
        }
      }
    }
  }

  clear() {
    this.matcher.clear()
  }
}
