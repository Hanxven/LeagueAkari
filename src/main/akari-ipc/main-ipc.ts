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

/**
 * 静态类，用于处理主进程与渲染进程之间的 IPC 通信数据格式
 */
export class LeagueAkariIpc {
  static sendEvent(webContent: WebContents, eventName: string, ...args: any[]) {
    webContent.send(`event:${eventName}`, ...args)
  }

  static onCall(
    resName: string,
    listener: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any> | any
  ) {
    return LeagueAkariIpc._handleRenderer(`call:${resName}`, listener)
  }

  private static _handleError(error: any): IpcMainDataType {
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
      error: { message: 'An error occurred' }
    }
  }

  private static _handleRenderer(
    path: string,
    listener: (event: IpcMainInvokeEvent, ...args: any[]) => any
  ) {
    const handler = (event: IpcMainInvokeEvent, ...args: any[]) => {
      try {
        const result = listener(event, ...args)
        if (result instanceof Promise) {
          return result
            .then((res) => {
              return {
                success: true,
                data: res
              } as IpcMainDataType
            })
            .catch((error: any) => LeagueAkariIpc._handleError(error))
        } else {
          return {
            success: true,
            data: result
          } as IpcMainDataType
        }
      } catch (error) {
        return LeagueAkariIpc._handleError(error)
      }
    }

    ipcMain.handle(path, handler)

    return () => {
      ipcMain.removeListener(path, handler)
    }
  }
}
