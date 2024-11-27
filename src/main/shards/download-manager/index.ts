import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import axios from 'axios'
import EventEmitter from 'node:events'
import ofs from 'original-fs'
import path from 'path'
import stream, { Readable } from 'stream'

import { AkariIpcMain } from '../ipc'

interface ProgressChecking {
  taskId: number
  state: 'checking'
}

interface ProgressFinish {
  taskId: number
  state: 'finish'
}

interface ProgressDownloading {
  taskId: number
  state: 'downloading'
  progress: number
  averageSpeed: number
  timeLeft: number
}

interface ProgressAborted {
  taskId: number
  state: 'aborted' | 'error'
  reason: any
}

interface DownloadTaskController {
  id: number
  controller: AbortController
}

/**
 * [暂未实装]
 * 控制下载流程的模块
 */
export class DownloadManagerMain implements IAkariShardInitDispose {
  static id = 'download-manager-main'
  static dependencies = ['akari-ipc-main']

  private readonly _ipc: AkariIpcMain

  private _taskIdIncl = 0
  private readonly _taskControllers = new Map<number, DownloadTaskController>()

  static UPDATE_PROGRESS_UPDATE_INTERVAL = 200

  public readonly events = new EventEmitter<{
    'download-progress': [
      progress: ProgressChecking | ProgressDownloading | ProgressAborted | ProgressFinish
    ]
  }>()

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
  }

  async onInit() {
    this.events.on('download-progress', (progress) => {
      this._ipc.sendEvent(DownloadManagerMain.id, 'download-progress', progress)
    })
  }

  private _generateTaskId() {
    return this._taskIdIncl++
  }

  private async _ensureTargetDir(dirPath: string) {
    try {
      const stat = await ofs.promises.stat(dirPath)
      if (!stat.isDirectory()) {
        throw new Error(`Path exists and is not a directory: ${dirPath}`)
      }
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        await ofs.promises.mkdir(dirPath, { recursive: true })
      } else {
        throw err
      }
    }
  }

  async download(url: string, filename: string, toDir: string) {
    const inst = axios.create()
    const tId = this._generateTaskId()

    await this._ensureTargetDir(toDir)

    const task = async () => {
      try {
        const controller = new AbortController()

        this._taskControllers.set(tId, {
          id: tId,
          controller
        })

        this.events.emit('download-progress', {
          taskId: tId,
          state: 'checking'
        })

        const { data, headers } = await inst.get<Readable>(url, {
          responseType: 'stream',
          signal: controller.signal
        })

        const started = Date.now()
        const totalLength = Number(headers['content-length']) || -1

        let bytesDownloaded = 0
        let startedAt = started
        let lastUpdateAt = started
        const _updateProgress = (now: number) => {
          const averageSpeed = (bytesDownloaded / (now - startedAt)) * 1e3
          const secondsLeft = (totalLength - bytesDownloaded) / averageSpeed

          this.events.emit('download-progress', {
            taskId: tId,
            state: 'downloading',
            progress: bytesDownloaded / totalLength,
            averageSpeed: averageSpeed,
            timeLeft: secondsLeft
          })
        }

        data.on('data', (chunk: Buffer) => {
          bytesDownloaded += chunk.length

          const now = Date.now()
          if (now - lastUpdateAt >= DownloadManagerMain.UPDATE_PROGRESS_UPDATE_INTERVAL) {
            lastUpdateAt = now
            _updateProgress(now)
          }
        })

        const fileStream = ofs.createWriteStream(path.join(toDir, filename))

        this.events.emit('download-progress', {
          taskId: tId,
          state: 'downloading',
          progress: 0,
          averageSpeed: -1,
          timeLeft: -1
        })

        await stream.promises.pipeline(data, fileStream)

        _updateProgress(Date.now())

        this.events.emit('download-progress', {
          taskId: tId,
          state: 'finish'
        })
      } catch (error: any) {
        if (error.name === 'AbortError') {
          this._ipc.sendEvent(DownloadManagerMain.id, 'download-progress', {
            taskId: tId,
            state: 'aborted',
            reason: 'aborted'
          })
          return
        }

        this.events.emit('download-progress', {
          taskId: tId,
          state: 'error',
          reason: error.message
        })
      } finally {
        this._taskControllers.delete(tId)
      }
    }

    task()

    return { taskId: tId }
  }

  abort(taskId: number) {
    const c = this._taskControllers.get(taskId)
    if (c) {
      c.controller.abort()
    }
  }
}
