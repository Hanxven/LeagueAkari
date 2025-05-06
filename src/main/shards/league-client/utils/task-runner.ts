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

interface TaskGroupOptions {
  concurrency?: number
  afterGroup?: string | string[]
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
  private _groupDeps = new Map<string, string[]>()
  private _tasks = new Map<string, ScheduledTask>()
  private _controller: AbortController | null = null
  private _isRunning = false

  get tasks() {
    return this._tasks
  }

  constructor(defaultConcurrency: number = 2992) {
    super()
    const defaultQueue = new PQueue({ concurrency: defaultConcurrency })
    this._queues.set('default', defaultQueue)
    this._groupDeps.set('default', [])
  }

  public createGroup(id: string, options: TaskGroupOptions = {}) {
    if (this._queues.has(id)) {
      throw new Error(`Task group "${id}" already exists`)
    }

    const deps = options.afterGroup
      ? Array.isArray(options.afterGroup)
        ? options.afterGroup
        : [options.afterGroup]
      : []

    for (const d of deps) {
      if (!this._queues.has(d)) {
        throw new Error(`Dependency group "${d}" not found for group "${id}"`)
      }
    }

    const tmpDeps = new Map(this._groupDeps)
    tmpDeps.set(id, deps)
    if (this._detectCycle(tmpDeps)) {
      throw new Error(`Circular dependency detected when adding group "${id}"`)
    }

    // 创建队列并根据是否有依赖暂停
    const queue = new PQueue({ concurrency: options.concurrency })
    if (deps.length) queue.pause()

    this._queues.set(id, queue)
    this._groupDeps.set(id, deps)
  }

  public removeGroup(id: string): boolean {
    if (id === 'default') {
      throw new Error('Cannot remove the default group')
    }

    // 若其他组依赖于此组，禁止删除
    for (const [g, deps] of this._groupDeps) {
      if (deps.includes(id)) {
        throw new Error(`Cannot remove group "${id}", it is depended upon by group "${g}"`)
      }
    }

    this._groupDeps.delete(id)
    return this._queues.delete(id)
  }

  /**
   * 注册任务, 可复用
   */
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
    if (this._isRunning) throw new Error('Cannot remove tasks while running')
    return this._tasks.delete(id)
  }

  /**
   * fire!
   */
  public start() {
    if (this._isRunning) throw new Error('TaskRunner is already running')

    this._isRunning = true
    this._controller = new AbortController()
    const signal = this._controller.signal
    this.emit('start')

    for (const task of this._tasks.values()) {
      const queue = this._queues.get(task.group)!
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

    for (const [groupId, deps] of this._groupDeps) {
      if (!deps.length) {
        continue
      }

      const promises = deps.map((d) => this._queues.get(d)!.onIdle())
      Promise.all(promises).then(() => {
        const q = this._queues.get(groupId)!
        if (q.isPaused) {
          q.start()
        }
      })
    }

    Promise.all(Array.from(this._queues.values()).map((q) => q.onIdle())).finally(() => {
      this._isRunning = false
      this._controller = null
      this.emit('stop')
    })
  }

  /**
   * 一键停止
   */
  public stop(): void {
    if (!this._isRunning || !this._controller) {
      throw new Error('TaskRunner is not running')
    }
    this._controller.abort()
  }

  public get isRunning(): boolean {
    return this._isRunning
  }

  private _detectCycle(depGraph: Map<string, string[]>): boolean {
    const enum RabbitFood {
      COMPLETELY_NEW = 0,
      EATING = 1,
      EATEN = 2
    }

    const foods: Record<string, RabbitFood> = {}
    for (const key of depGraph.keys()) {
      foods[key] = RabbitFood.COMPLETELY_NEW
    }

    const dfs = (node: string): boolean => {
      foods[node] = RabbitFood.EATING
      for (const nei of depGraph.get(node) ?? []) {
        const food = foods[nei]
        if (food === RabbitFood.EATING) {
          return true
        }
        if (food === RabbitFood.COMPLETELY_NEW && dfs(nei)) {
          return true
        }
      }
      foods[node] = RabbitFood.EATEN
      return false
    }

    for (const key of depGraph.keys()) {
      if (foods[key] === RabbitFood.COMPLETELY_NEW && dfs(key)) {
        return true
      }
    }
    return false
  }
}
