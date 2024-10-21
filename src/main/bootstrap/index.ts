import { optimizer } from '@electron-toolkit/utils'
import { initAppLogger } from '@main/logger'
import { AkariProtocolMain } from '@main/shards/akari-protocol'
import { AppCommonMain } from '@main/shards/app-common'
import { AutoGameflowMain } from '@main/shards/auto-gameflow'
import { AutoReplyMain } from '@main/shards/auto-reply'
import { AutoSelectMain } from '@main/shards/auto-select'
import { GameClientMain } from '@main/shards/game-client'
import { AkariIpcMain } from '@main/shards/ipc'
import { KeyboardShortcutsMain } from '@main/shards/keyboard-shorcuts'
import { LeagueClientMain } from '@main/shards/league-client'
import { LeagueClientUxMain } from '@main/shards/league-client-ux'
import { LoggerFactoryMain } from '@main/shards/logger-factory'
import { MobxUtilsMain } from '@main/shards/mobx-utils'
import { OngoingGameMain } from '@main/shards/ongoing-game'
import { RespawnTimerMain } from '@main/shards/respawn-timer'
import { RiotClientMain } from '@main/shards/riot-client'
import { SelfUpdateMain } from '@main/shards/self-update'
import { SettingFactoryMain } from '@main/shards/setting-factory'
import { StorageMain } from '@main/shards/storage'
import { TrayMain } from '@main/shards/tray'
import { WindowManagerMain } from '@main/shards/window-manager'
import { AkariManager } from '@shared/akari-shard/manager'
import { formatError } from '@shared/utils/errors'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import { app, dialog, protocol } from 'electron'
import { configure } from 'mobx'
import EventEmitter from 'node:events'
import { Logger } from 'winston'

import toolkit from '../../native/laToolkitWin32x64.node'
import { readBaseConfig, writeBaseConfig } from './base-config'

interface AkariAppEventMap {
  'second-instance': [commandLine: string[], workingDirectory: string]
}

declare module '@shared/akari-shard/manager' {
  interface AkariSharedGlobal {
    /**
     * 应用日志记录对象
     */
    logger: Logger

    /**
     * 特殊事件总线
     */
    events: EventEmitter<AkariAppEventMap>

    /**
     * 是否是管理员权限
     */
    isAdministrator: boolean

    /**
     * 基础全局设置
     */
    baseConfig: {
      value: any
      write: (config: any) => void
    }
  }
}

function handleUnhandledErrors(logger: Logger) {
  process.on('uncaughtException', (error) => {
    logger.error({
      message: `意料之外的未处理错误 ${formatError(error)}`,
      namespace: 'error-handling'
    })
    dialog.showErrorBox('Uncaught Exception', formatError(error))
    app.quit()
  })

  process.on('unhandledRejection', (error) => {
    logger.warn({
      message: `功能初始化时出现错误 ${formatError(error)}`,
      namespace: 'error-handling'
    })
  })
}

export const isAdministrator = toolkit.isElevated()

/**
 * 应用级别的初始化启动细节，基础组件注入和基础事件处理
 */
export function bootstrap() {
  // 创建全局唯一的日志器
  const logger = initAppLogger()

  // 应用级别的事件总线
  const events = new EventEmitter<AkariAppEventMap>()

  // 基础全局设置
  EventEmitter.defaultMaxListeners = 1e5
  dayjs.extend(relativeTime)
  dayjs.extend(duration)

  // mobx 设置
  configure({ enforceActions: 'observed' })

  // 注册 akari 协议的支持, 是 HTTP 请求的代理
  protocol.registerSchemesAsPrivileged([
    {
      scheme: AkariProtocolMain.AKARI_PROTOCOL,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
        bypassCSP: true
      }
    }
  ])

  logger.info({
    message: `League Akari ${app.getVersion()}`,
    namespace: 'bootstrap'
  })

  try {
    // 基础设置
    const baseConfig = readBaseConfig()
    if (
      baseConfig &&
      baseConfig.disableHardwareAcceleration &&
      baseConfig.disableHardwareAcceleration === true
    ) {
      app.disableHardwareAcceleration()
    }

    // 处理应用级别的错误
    handleUnhandledErrors(logger)

    // 启用所有 akari shard
    const manager = new AkariManager()
    manager.global.logger = logger
    manager.global.events = events
    manager.global.baseConfig = {
      value: baseConfig,
      write: (config: any) => writeBaseConfig(config)
    }
    manager.global.isAdministrator = isAdministrator

    manager.use(
      // basic fundamental shards
      AkariIpcMain,
      AppCommonMain,
      LoggerFactoryMain,
      MobxUtilsMain,
      SettingFactoryMain,
      StorageMain,

      // connection & data provider shards
      GameClientMain,
      LeagueClientMain,
      LeagueClientUxMain,
      RiotClientMain,

      // application specific shards
      WindowManagerMain,
      TrayMain,
      KeyboardShortcutsMain,
      SelfUpdateMain,

      // functional shards
      AutoGameflowMain,
      AutoReplyMain,
      AutoSelectMain,
      AutoSelectMain,
      OngoingGameMain,
      RespawnTimerMain
    )

    app.on('second-instance', (_event, commandLine, workingDirectory) => {
      events.emit('second-instance', commandLine, workingDirectory)
      logger.warn({
        message: `用户尝试启动第二个实例, cmd=${JSON.stringify(commandLine)}, pwd=${workingDirectory}`,
        namespace: 'electron'
      })
    })

    app.on('window-all-closed', () => {
      // hanxven's note: this is a Windows only app
      app.quit()
    })

    app.whenReady().then(async () => {
      try {
        await manager.setup()
      } catch (error) {
        logger.error({
          message: `[10002] 功能初始化时出现错误 ${formatError(error)}`,
          namespace: 'akari-shard-manager'
        })
        dialog.showErrorBox('功能初始化时出现错误', formatError(error))
        app.exit(10002)
      }
    })

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    let shardDisposed = false
    app.on('will-quit', (e) => {
      if (shardDisposed) {
        return
      }

      e.preventDefault()

      manager
        .dispose()
        .catch((error) => {
          logger.error({
            message: `应用退出时出现错误 ${formatError(error)}`,
            namespace: 'akari-shard-manager'
          })
        })
        .finally(() => {
          shardDisposed = true
          events.removeAllListeners()
          logger.on('finish', () => app.quit())
          logger.end()
        })
    })
  } catch (error) {
    logger.error({
      message: `[10001] 应用启动时出现错误 ${formatError(error)}`,
      namespace: 'bootstrap'
    })
    dialog.showErrorBox('应用启动时出现错误', formatError(error))
    app.exit(10001)
  }
}
