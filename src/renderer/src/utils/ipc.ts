import { IpcMainDataType } from '@shared/types/ipc'
import { IpcRendererEvent } from 'electron'

/**
 * 兼容主进程封装后的 IPC 通信格式
 */
export async function ipcMainCallStandardized<R = any>(path: string, ...args: any[]): Promise<R> {
  const res = (await window.electron.ipcRenderer.invoke(path, ...args)) as IpcMainDataType

  if (!res.success) {
    throw res.error
  }

  return res.data
}

/**
 * 主进程状态同步，使用异步将等待状态加载完成
 * @param resName 状态
 * @param stateSetter 获取状态
 * @returns
 */
export function mainStateSync(resName: string, stateSetter: (state: any) => void) {
  const hd = window.electron.ipcRenderer.on(`update:${resName}`, (_, state, _prev) =>
    stateSetter(state)
  )
  window.electron.ipcRenderer.invoke(`get:${resName}`).then((r) => stateSetter(r))
  return hd
}

export function mainCall<T = any>(resName: string, ...args: any[]) {
  return ipcMainCallStandardized<T>(`call:${resName}`, ...args)
}

export function onMainEvent(
  eventName: string,
  callback: (event: IpcRendererEvent, ...args: any[]) => void
) {
  return window.electron.ipcRenderer.on(`event:${eventName}`, callback)
}
