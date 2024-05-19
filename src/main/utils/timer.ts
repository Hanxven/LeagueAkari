export class TimeoutTask {
  private _timerId: NodeJS.Timeout
  private _started = false
  private _fn: Function

  constructor(fn: Function) {
    this._fn = fn
  }

  get isStarted() {
    return this._started
  }

  /**
   * 取消即将进行的任务
   * @returns {boolean} 是否取消了
   */
  cancel(): boolean {
    if (this._started) {
      clearTimeout(this._timerId)
      return true
    }

    return (this._started = false)
  }

  /**
   * 进行预设的任务。如果已经有一个任务，则取消旧任务
   * @param timeout 时限
   * @returns
   */
  start(timeout: number) {
    if (this._started) {
      clearTimeout(this._timerId)
    }

    this._started = true
    this._timerId = setTimeout(() => {
      this._fn()
      this._started = false
    }, timeout) as unknown as NodeJS.Timeout
  }

  setTask(fn: Function) {
    if (this._started) {
      clearTimeout(this._timerId)
    }

    this._fn = fn
  }
}
