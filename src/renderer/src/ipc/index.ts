import { IpcRendererEvent } from 'electron'

export interface IpcSuccessDataType {
  success: true
  data: any
}

export interface IpcErrorDataType {
  success: false
  error: any
}

export type IpcDataType = IpcSuccessDataType | IpcErrorDataType

// 封装的主进程调用，以 call: 为前缀
// 因为类型提示很麻烦，所以先暂时不标注类型，之后可以放到 .d.ts 声明文件中
export async function call<R = any>(func: string, ...args: any[]): Promise<R> {
  const res = (await window.electron.ipcRenderer.invoke(`call:${func}`, ...args)) as IpcDataType

  if (!res.success) {
    throw res.error
  }

  return res.data
}

// 封装的状态更新，以 update: 为前缀，仅推送到当前渲染进程
export function onUpdate(
  state: string,
  listener: (event: IpcRendererEvent, ...args: any[]) => void
): () => void {
  return window.electron.ipcRenderer.on(`update:${state}`, listener)
}
