import { IpcMainDataType } from '@shared/types/ipc'
import { IpcRendererEvent } from 'electron'

declare var window: any

/**
 * IPC 工具类
 */
export class LeagueAkariRendererIpc {
  static call<T = any>(resName: string, ...args: any[]) {
    return LeagueAkariRendererIpc._doCall<T>(`call:${resName}`, ...args)
  }

  static onEvent(eventName: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) {
    return window.electron.ipcRenderer.on(`event:${eventName}`, callback)
  }

  private static async _doCall<R = any>(path: string, ...args: any[]): Promise<R> {
    const res = (await window.electron.ipcRenderer.invoke(path, ...args)) as IpcMainDataType

    if (!res.success) {
      throw res.error
    }

    return res.data
  }
}
