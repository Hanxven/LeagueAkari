import { formatError } from '@shared/utils/errors'
import { isAxiosError } from 'axios'
import { IpcMainInvokeEvent, WebContents, ipcMain } from 'electron'

export interface IpcMainSuccessDataType<T = any> {
  success: true
  data: T
}

export interface IpcMainErrorDataType<T = any> {
  success: false
  error: T
}

export type IpcMainDataType<T = any> = IpcMainSuccessDataType<T> | IpcMainErrorDataType<T>

// 测试性模块，用于 IPC 的封装
export class LeagueAkariModule {
  private _renderers: WebContents[] = []

  constructor(private _id: string) {}

  private _sendEventToRenderer(eventName: string, ...args: any[]) {
    this._renderers.forEach((w) => w.send(`event:${eventName}`, ...args))
  }

  private _handleRendererInvocation(
    path: string,
    listener: (event: IpcMainInvokeEvent, ...args: any[]) => any
  ) {
    ipcMain.handle(path, (event, ...args) => {
      try {
        const result = listener(event, ...args)
        if (result instanceof Promise) {
          return result
            .then((res) => ({
              success: true,
              data: res
            }))
            .catch((error) => this._handleError(error))
        } else {
          return { success: true, data: result }
        }
      } catch (error) {
        return this._handleError(error)
      }
    })
  }

  private _handleError(error: any): IpcMainDataType {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      }
    } else if (error instanceof Error) {
      return {
        success: false,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      }
    }

    return {
      success: false,
      error: { message: formatError(error) }
    }
  }

  /**
   * 渲染进程调用
   * @param name 方法名称
   * @param callback 回调
   */
  onCall<T = any>(name: string, callback: () => T | Promise<T>) {}

  /**
   * 发送一个事件
   * @param name 资源名称
   * @param value 资源值，必须可序列化
   */
  sendEvent<T = any>(name: string, value: T) {}
}

export class MobxBasedModule extends LeagueAkariModule {
  constructor(id: string) {
    super(id)
  }

  /**
   * 基于 Mobx 响应式的状态同步
   * @param name 状态名称
   * @param reactiveGetter 简单可变内容的 getter，必须可序列化
   */
  syncState(name: string, reactiveGetter: () => any) {}
}
