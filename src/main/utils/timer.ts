export class TimeoutTask {
  private _timerId: NodeJS.Timeout | null = null
  private _isStarted = false
  private _callback?: () => void
  private _delay: number

  /**
   * @param callback 回调函数
   * @param delay 默认延迟时间（毫秒）
   */
  constructor(callback?: () => void, delay = 0) {
    this._callback = callback
    this._delay = delay
  }

  /**
   * 是否已经启动
   */
  get isStarted(): boolean {
    return this._isStarted
  }

  /**
   * 取消定时任务
   * @returns 是否成功取消（如果当前未启动则返回 false）
   */
  cancel(): boolean {
    if (!this._isStarted || !this._timerId) {
      return false
    }
    clearTimeout(this._timerId)
    this._timerId = null
    this._isStarted = false
    return true
  }

  /**
   * 启动定时器
   * @param delay 可选新延迟时间，不传则使用当前 _delay
   */
  start(delay?: number): void {
    // 如果需要更新新的延迟时间
    if (delay !== undefined) {
      this._delay = delay
    }
    if (!this._callback) {
      return
    }

    // 先取消已存在的定时器，避免重复
    this.cancel()

    this._isStarted = true
    this._timerId = setTimeout(() => {
      this._callback?.()
      this._isStarted = false
      this._timerId = null
    }, this._delay)
  }

  /**
   * 设置新的回调函数，并根据 autoStart 决定是否立即启动
   * @param callback 回调函数
   * @param autoStart 是否自动启动
   * @param delay 可选新的延迟时间
   */
  setTask(callback: () => void, autoStart = false, delay?: number): void {
    this._callback = callback
    // 如果当前已在执行，则先取消
    this.cancel()

    if (autoStart) {
      this.start(delay)
    }
  }

  /**
   * 更新延迟时间，如果定时器正在执行，则重启定时器使其应用新的延迟
   * @param newDelay 新的延迟时间
   */
  updateTime(newDelay: number): void {
    this._delay = newDelay
    // 如果已经启动，需要让新的延迟生效
    if (this._isStarted) {
      this.start(this._delay)
    }
  }

  /**
   * 触发回调并立即取消定时器
   */
  triggerCompletion(): void {
    if (this._isStarted && this._callback) {
      this._callback()
      this.cancel()
    }
  }

  /**
   * 立即刷新时间（如果正在执行，则重启定时器，延迟从当前时间开始重新计时）
   */
  refreshTimeImmediately(): void {
    if (this._isStarted) {
      this.start(this._delay)
    }
  }
}
