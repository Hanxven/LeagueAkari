import { createLogger } from '@main/modules/akari-core/log'
import { IpcMainDataType } from '@shared/types/ipc'
import { formatError } from '@shared/utils/errors'
import { isAxiosError } from 'axios'
import { BrowserWindow, IpcMainInvokeEvent, WebContents, ipcMain } from 'electron'
import { reaction } from 'mobx'

const logger = createLogger('utils:ipc')

function handleError(error: any): IpcMainDataType {
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

  logger.warn(`未知错误: ${formatError(error)}`)

  return {
    success: false,
    error: { message: 'An error occurred' }
  }
}

/**
 * 封装后的适合应用的通用 IPC 格式
 * @param path
 * @param listener
 */

export function ipcHandleRendererStandardized(
  path: string,
  listener: (event: IpcMainInvokeEvent, ...args: any[]) => any
) {
  ipcMain.handle(path, (event, ...args) => {
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
          .catch((error: any) => handleError(error))
      } else {
        return {
          success: true,
          data: result
        } as IpcMainDataType
      }
    } catch (error) {
      return handleError(error)
    }
  })
}

/**
 * 发送事件到全体窗口
 * @param eventName
 * @param args
 */
export function sendEventToAllRenderers(eventName: string, ...args: any[]) {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(`event:${eventName}`, ...args)
  }
}

/**
 * 发送事件
 * @param path
 * @param args
 */
export function sendEventToRenderer(webContents: WebContents, eventName: string, ...args: any[]) {
  webContents.send(`event:${eventName}`, ...args)
}

/**
 * 封装的资源状态同步
 * @param resName 资源名称，不包括 `get:` or `update:` 前缀
 * @param stateGetter 获取 mobx 字段的 Getter
 * @param webContents 需要发送的渲染进程，不指定时为发送全部
 */
export function ipcStateSync(
  resName: string,
  stateGetter: (...arg: any[]) => any,
  webContents?: WebContents | WebContents[]
) {
  ipcMain.handle(`get:${resName}`, stateGetter)

  if (webContents) {
    if (Array.isArray(webContents)) {
      reaction(stateGetter, (state, prev) => {
        for (const w of webContents) {
          w.send(`update:${resName}`, state, prev)
        }
      })
    } else {
      reaction(stateGetter, (state, prev) => {
        webContents.send(`update:${resName}`, state, prev)
      })
    }
  } else {
    reaction(stateGetter, (state, prev) => {
      for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send(`update:${resName}`, state, prev)
      }
    })
  }
}

/**
 * 封装后的资源 call 操作
 * @param resName
 * @param listener
 */
export function onRendererCall(
  resName: string,
  listener: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any> | any
) {
  ipcHandleRendererStandardized(`call:${resName}`, listener)
}
