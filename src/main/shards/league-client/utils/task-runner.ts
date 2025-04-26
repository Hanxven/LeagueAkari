// TaskRunner.ts
import { EventEmitter } from 'node:events'
import PQueue from 'p-queue'

interface TaskStartPayload {
  id: string
}

interface TaskSuccessPayload {
  id: string
  status: 'fulfilled'
  value: any
}

interface TaskErrorPayload {
  id: string
  status: 'rejected'
  error: any
}

type TaskCompletePayload = TaskSuccessPayload | TaskErrorPayload

interface ScheduledTask {
  id: string
  fn: () => Promise<any> | any
  priority?: number
  group: string
}

/**
 * 批量任务运行工具
 */
export class TaskRunner extends EventEmitter<{
  'task-start': [payload: TaskStartPayload]
  'task-complete': [payload: TaskCompletePayload]
  start: []
  stop: []
}> {
  private _queues = new Map<string, PQueue>()
  private _tasks = new Map<string, ScheduledTask>()
  private _controller: AbortController | null = null
  private _isRunning = false

  get tasks() {
    return this._tasks
  }

  constructor(defaultConcurrency: number = 2992) {
    super()
    this._queues.set('default', new PQueue({ concurrency: defaultConcurrency }))
  }

  public createGroup(id: string, options: { concurrency?: number } = {}) {
    if (this._queues.has(id)) {
      throw new Error(`Task group "${id}" already exists`)
    }
    this._queues.set(id, new PQueue({ concurrency: options.concurrency }))
  }

  public removeGroup(id: string): boolean {
    if (id === 'default') {
      throw new Error(`Cannot remove the default group`)
    }
    return this._queues.delete(id)
  }

  public register(
    id: string,
    fn: () => Promise<any> | any,
    options: { priority?: number; group?: string } = {}
  ) {
    if (this._isRunning) {
      throw new Error('Cannot add tasks while running')
    }

    if (this._tasks.has(id)) {
      throw new Error(`Task with id "${id}" already exists`)
    }

    const group = options.group ?? 'default'
    if (!this._queues.has(group)) {
      throw new Error(`No task group "${group}" found`)
    }
    this._tasks.set(id, { id, fn, priority: options.priority, group })
  }

  public remove(id: string): boolean {
    if (this._isRunning) {
      throw new Error('Cannot remove tasks while running')
    }
    return this._tasks.delete(id)
  }

  public start() {
    if (this._isRunning) {
      throw new Error('TaskRunner is already running')
    }

    this._isRunning = true
    this._controller = new AbortController()
    const signal = this._controller.signal
    this.emit('start')

    for (const task of this._tasks.values()) {
      const queue = this._queues.get(task.group)!

      // 事实上 PQueue 自带错误处理机制. 但这里直接让它永远为 fulfilled 以方便在外部封装
      queue.add(
        async () => {
          this.emit('task-start', { id: task.id })
          try {
            const result = await task.fn()
            this.emit('task-complete', {
              id: task.id,
              status: 'fulfilled',
              value: result
            })
          } catch (err) {
            this.emit('task-complete', {
              id: task.id,
              status: 'rejected',
              error: err
            })
          }
        },
        { priority: task.priority, signal }
      )
    }

    Promise.all(Array.from(this._queues.values()).map((q) => q.onIdle())).finally(() => {
      this._isRunning = false
      this._controller = null
      this.emit('stop')
    })
  }

  public stop(): void {
    if (!this._isRunning || !this._controller) {
      throw new Error('TaskRunner is not running')
    }
    this._controller.abort()
  }

  public get isRunning(): boolean {
    return this._isRunning
  }
}
