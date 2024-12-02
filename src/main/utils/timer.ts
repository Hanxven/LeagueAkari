export class TimeoutTask {
  private _timerId: NodeJS.Timeout | null = null
  private _started = false
  private _fn?: Function
  private _delay: number = 0

  constructor(fn?: Function, timeout?: number) {
    this._fn = fn
    if (timeout) {
      this._delay = timeout
    }
  }

  get isStarted() {
    return this._started
  }

  cancel(): boolean {
    if (this._started && this._timerId !== null) {
      clearTimeout(this._timerId)
      this._timerId = null
      this._started = false
      return true
    }
    return false
  }

  start(timeout: number): void {
    if (this._started && this._timerId !== null) {
      clearTimeout(this._timerId)
    }

    if (!this._fn) {
      return
    }

    this._delay = timeout
    this._started = true
    this._timerId = setTimeout(() => {
      this._fn && this._fn()
      this._started = false
      this._timerId = null
    }, this._delay) as unknown as NodeJS.Timeout
  }

  setTask(fn: Function, autoStart: boolean = false, timeout?: number): void {
    this._fn = fn

    if (this._started && this._timerId !== null) {
      clearTimeout(this._timerId)
      this._started = false
      this._timerId = null
    }

    if (autoStart) {
      const delay = timeout !== undefined ? timeout : this._delay
      this.start(delay)
    }
  }

  updateTime(newDelay: number): void {
    if (this._started && this._fn) {
      if (this._timerId !== null) {
        clearTimeout(this._timerId)
      }
      this._delay = newDelay
      this._timerId = setTimeout(() => {
        this._fn && this._fn()
        this._started = false
        this._timerId = null
      }, this._delay) as unknown as NodeJS.Timeout
    }
  }

  triggerCompletion(): void {
    if (this._started && this._fn) {
      this._fn()
      this.cancel()
    }
  }
}
