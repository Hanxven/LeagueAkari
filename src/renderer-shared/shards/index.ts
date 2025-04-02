import { AkariManager, Constructor } from '@shared/akari-shard'
import { App, getCurrentInstance } from 'vue'

import { LoggerRenderer } from './logger'

declare module 'vue' {
  export interface ComponentCustomProperties {
    $akariManager: AkariManager
  }
}

declare global {
  interface Window {
    akariManager: AkariManager
  }
}

/**
 * Vue 版本插件工厂, 特别地, 日志工具被内置到支持中
 * @returns
 */
export function createManager() {
  const akariManager = new AkariManager()

  return {
    install: (app: App) => {
      app.config.globalProperties.$akariManager = akariManager
      app.config.errorHandler = (err, _instance, info) => {
        const logger = akariManager.getInstance('logger-renderer') as LoggerRenderer
        logger?.error('Vue', err, info)
      }

      window.akariManager = akariManager
    },
    setup: () => akariManager.setup(),
    getInstance: (id: string) => akariManager.getInstance(id),
    use: (shard: Constructor, config?: object) => akariManager.use(shard, config)
  }
}

/**
 * 批判的使用
 * @param id
 * @returns
 */
export function useInstance(id: string): any
export function useInstance<T extends new (...args: any[]) => any>(Ctor: T): InstanceType<T>
export function useInstance(idOrCtor: any): any {
  const ctx = getCurrentInstance()

  if (!ctx) {
    throw new Error('useInstance must be called within a setup function')
  }

  if (!ctx.appContext.config.globalProperties.$akariManager) {
    throw new Error('AkariManager not found in app context')
  }

  const ins = ctx.appContext.config.globalProperties.$akariManager.getInstance(idOrCtor)

  if (!ins) {
    throw new Error(`Shard with id (or constructor) "${idOrCtor}" not instantiated`)
  }

  return ins
}
