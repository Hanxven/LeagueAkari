import { isAxiosError } from 'axios'
import { BrowserWindow, IpcMainInvokeEvent, WebContents, ipcMain } from 'electron'

// IPC 包装层，保证统一的返回格式
export function onCall(
  func: string,
  listener: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<void> | any
) {
  ipcMain.handle(`call:${func}`, async (event, ...args) => {
    try {
      const res = await listener(event, ...args)
      return {
        success: true,
        data: res
      }
    } catch (err) {
      if (isAxiosError(err)) {
        return {
          success: false,
          error: {
            code: err.code,
            message: err.message,
            stack: err.stack,
            name: err.name
          }
        }
      } else if (err instanceof Error) {
        return {
          success: false,
          error: {
            message: err.message,
            stack: err.stack,
            name: err.name
          }
        }
      }

      console.log('unknown error', err)

      // 如果不能确定 Error 的类型，那么返回一个占位符号
      // 这么做的考虑是，由于 Electron 的 IPC 机制，Error 必须是可序列化的
      return {
        success: false,
        error: {
          message: 'An error occurred'
        }
      }
    }
  })
}

// 将消息发送到所有渲染进程
export function sendUpdateToAll(state: string, ...args: any[]) {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(`update:${state}`, ...args)
  }
}

export function sendUpdate(webContents: WebContents, state: string, ...args: any[]) {
  webContents.send(`update:${state}`, ...args)
}
