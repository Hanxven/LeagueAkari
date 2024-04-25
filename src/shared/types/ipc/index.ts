export interface IpcMainSuccessDataType<T = any> {
  success: true
  data: T
}

export interface IpcMainErrorDataType<T = any> {
  success: false
  error: T
}

export type IpcMainDataType<T = any> = IpcMainSuccessDataType<T> | IpcMainErrorDataType<T>
