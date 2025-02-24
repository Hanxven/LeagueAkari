import { optimizer } from '@electron-toolkit/utils'
import '@main/i18n'
import { initAppLogger } from '@main/logger'
import tools from '@main/native/la-tools-win64.node'
import { AkariProtocolMain } from '@main/shards/akari-protocol'
import { AppCommonMain } from '@main/shards/app-common'
import { AutoChampionConfigMain } from '@main/shards/auto-champ-config'
import { AutoGameflowMain } from '@main/shards/auto-gameflow'
import { AutoReplyMain } from '@main/shards/auto-reply'
import { AutoSelectMain } from '@main/shards/auto-select'
import { ClientInstallationMain } from '@main/shards/client-installation'
import { ConfigMigrateMain } from '@main/shards/config-migrate'
import { ExtraAssetsMain } from '@main/shards/extra-assets'
import { GameClientMain } from '@main/shards/game-client'
import { InGameSendMain } from '@main/shards/in-game-send'
import { AkariIpcMain } from '@main/shards/ipc'
import { KeyboardShortcutsMain } from '@main/shards/keyboard-shortcuts'
import { LeagueClientMain } from '@main/shards/league-client'
import { LeagueClientUxMain } from '@main/shards/league-client-ux'
import { LoggerFactoryMain } from '@main/shards/logger-factory'
import { MobxUtilsMain } from '@main/shards/mobx-utils'
import { OngoingGameMain } from '@main/shards/ongoing-game'
import { PlayerStalkingMain } from '@main/shards/player-stalking'
import { RendererDebugMain } from '@main/shards/renderer-debug'
import { RespawnTimerMain } from '@main/shards/respawn-timer'
import { RiotClientMain } from '@main/shards/riot-client'
import { SavedPlayerMain } from '@main/shards/saved-player'
import { SelfUpdateMain } from '@main/shards/self-update'
import { SettingFactoryMain } from '@main/shards/setting-factory'
import { SgpMain } from '@main/shards/sgp'
import { StorageMain } from '@main/shards/storage'
import { TrayMain } from '@main/shards/tray'
import { WindowManagerMain } from '@main/shards/window-manager'
import { AkariManager } from '@shared/akari-shard/manager'
import { formatError } from '@shared/utils/errors'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import { app, dialog } from 'electron'
import { configure } from 'mobx'
import EventEmitter from 'node:events'
import os from 'node:os'
import { Logger } from 'winston'

import { BaseConfig, readBaseConfig, writeBaseConfig } from './base-config'

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
     * 日志文件名
     */
    logFilename: string

    /**
     * 特殊事件总线
     */
    events: EventEmitter<AkariAppEventMap>

    /**
     * 是否是管理员权限
     */
    isAdministrator: boolean

    /**
     * 是否是 Windows 11 22H2 或更高版本
     */
    isWindows11_22H2_OrHigher: boolean

    /**
     * 基础全局设置
     */
    baseConfig: {
      value: BaseConfig | null
      write: (config: Partial<BaseConfig>) => void
    }

    version: string

    /**
     * 退出应用
     */
    quit: () => void

    /**
     * app.relaunch() + app.quit()
     * @returns
     */
    restart: () => void
  }
}

function handleUnhandledErrors(logger: Logger) {
  process.on('uncaughtException', (error) => {
    logger.error({
      message: `意料之外的未处理错误 ${formatError(error)}`,
      namespace: 'error-handling'
    })
    dialog.showErrorBox('Uncaught Exception', formatError(error))
    app.exit(10003)
  })

  process.on('unhandledRejection', (error) => {
    logger.warn({
      message: `意料之外的 Rejection ${formatError(error)}`,
      namespace: 'error-handling'
    })
  })
}

/**
 * 支持 Mica 的版本
 */
export function isWindows11_22H2_OrHigher() {
  const release = os.release() // e.g., '10.0.22621'
  const [major, minor, build] = release.split('.').map(Number)

  // Check if it's Windows 11 (major 10, minor 0) and build is 22621 or higher
  if (major === 10 && minor === 0 && build >= 22621) {
    return true
  }
  return false
}

export const isAdministrator = tools.isElevated()

/**
 * 应用级别的初始化启动细节，基础组件注入和基础事件处理
 */
export function bootstrap() {
  // 基础设置
  const baseConfig = readBaseConfig()

  // 创建全局唯一的日志器
  const logLevel = baseConfig && baseConfig.logLevel ? baseConfig.logLevel : 'info'
  const { logger, filename: logFilename } = initAppLogger(logLevel)

  // 应用级别的事件总线
  const events = new EventEmitter<AkariAppEventMap>()

  // 基础全局设置
  EventEmitter.defaultMaxListeners = 1e5
  dayjs.extend(relativeTime)
  dayjs.extend(duration)

  // mobx 设置
  configure({ enforceActions: 'observed' })

  // 注册 akari 协议的支持, 是 HTTP 请求的代理
  AkariProtocolMain.register()

  logger.info({
    message: `League Akari ${app.getVersion()}`,
    namespace: 'app'
  })

  try {
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
    manager.global.logFilename = logFilename
    manager.global.events = events
    manager.global.baseConfig = {
      value: baseConfig,
      write: (config: any) => writeBaseConfig(config)
    }
    manager.global.isAdministrator = isAdministrator
    manager.global.version = app.getVersion()
    manager.global.isWindows11_22H2_OrHigher = isWindows11_22H2_OrHigher()
    manager.global.quit = () => app.quit()
    manager.global.restart = () => {
      app.relaunch()
      app.quit()
    }

    if (isAdministrator) {
      logger.info({
        message: `应用以管理员权限启动`,
        namespace: 'app'
      })
    }

    // basic fundamental shards
    manager.use(AkariIpcMain)
    manager.use(AppCommonMain)
    manager.use(LoggerFactoryMain)
    manager.use(MobxUtilsMain)

    // connection & data provider shards
    manager.use(ConfigMigrateMain)
    manager.use(SettingFactoryMain)
    manager.use(StorageMain)

    manager.use(AkariProtocolMain)
    manager.use(GameClientMain)
    manager.use(LeagueClientMain)
    manager.use(LeagueClientUxMain)
    manager.use(RiotClientMain)

    // application specific shards
    manager.use(ClientInstallationMain)
    manager.use(WindowManagerMain)
    manager.use(TrayMain)
    manager.use(KeyboardShortcutsMain)
    manager.use(SelfUpdateMain)

    // functional shards
    manager.use(AutoChampionConfigMain)
    manager.use(AutoGameflowMain)
    manager.use(AutoReplyMain)
    manager.use(AutoSelectMain)
    manager.use(InGameSendMain)
    manager.use(OngoingGameMain)
    manager.use(PlayerStalkingMain)
    manager.use(RespawnTimerMain)
    manager.use(SavedPlayerMain)
    manager.use(SgpMain)

    // other
    manager.use(ExtraAssetsMain)
    manager.use(RendererDebugMain)

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
        logger.on('finish', () => app.exit(10002))
        logger.end()
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
          logger.info({
            message: `应用即将退出`,
            namespace: 'app'
          })
          logger.on('finish', () => app.exit()) // 不知为何, 使用 app.quit() 在这里不会生效. 除非包裹 setImmediate 或 setTimeout
          logger.end()
        })
    })

    app.on('quit', () => {
      console.log(
        `\x1b[1m\x1b[92m[${dayjs().format('YYYY-MM-DD HH:mm:ss:SSS')}] [finale] 应用退出\x1b[0m`
      )
    })
  } catch (error) {
    logger.error({
      message: `[10001] 应用启动时出现错误 ${formatError(error)}`,
      namespace: 'app'
    })
    dialog.showErrorBox('应用启动时出现错误', formatError(error))
    logger.on('finish', () => app.exit(10001))
    logger.end()
  }
}
