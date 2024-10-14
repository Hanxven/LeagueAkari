import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import axios from 'axios'
import https from 'https'

import toolkit from '../../native/laToolkitWin32x64.node'
import { AkariIpcMain } from '../ipc'
import { AkariLoggerInstance, LoggerFactoryMain } from '../logger-factory'
import { SettingFactoryMain } from '../setting-factory'
import { MobxSettingService } from '../setting-factory/mobx-setting-service'
import { GameClientHttpApi } from './http-api'
import { GameClientSettings } from './state'

/**
 * 处理游戏端相关的功能
 */
export class GameClientMain implements IAkariShardInitDispose {
  static id = 'game-client-main'
  static dependencies = ['akari-ipc-main']

  static GAME_CLIENT_PROCESS_NAME = 'League of Legends.exe'
  static TERMINATE_DELAY = 200
  static GAME_CLIENT_BASE_URL = 'https://127.0.0.1:2999'

  private readonly _ipc: AkariIpcMain
  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _settingFactory: SettingFactoryMain
  private readonly _log: AkariLoggerInstance
  private readonly _setting: MobxSettingService

  private readonly _http = axios.create({
    baseURL: GameClientMain.GAME_CLIENT_BASE_URL,
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
      maxFreeSockets: 1024,
      maxCachedSessions: 2048
    })
  })
  private readonly _api: GameClientHttpApi

  public readonly settings = new GameClientSettings()

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
    this._loggerFactory = new LoggerFactoryMain()
    this._log = this._loggerFactory.create(GameClientMain.id)
    this._settingFactory = deps['setting-factory-main']
    this._api = new GameClientHttpApi(this._http)

    this._setting = this._settingFactory.create(
      GameClientMain.id,
      {
        terminateGameClientOnAltF4: { default: false }
      },
      this.settings
    )
  }

  get http() {
    return this._http
  }

  get api() {
    return this._api
  }

  async onInit() {
    await this._setting.applySettingsToState()
    this._handleCall()
  }

  private _handleCall() {
    this._ipc.onCall(GameClientMain.id, 'terminateGameClient', () => {
      this._terminateGameClient()
    })
  }

  private _terminateGameClient() {
    toolkit.getPidsByName(GameClientMain.GAME_CLIENT_PROCESS_NAME).forEach((pid) => {
      if (!toolkit.isProcessForeground(pid)) {
        return
      }

      this._log.info(`终止游戏客户端进程 ${pid}`)

      // 这里设置 200 ms，用于使客户端消耗 Alt+F4 事件，避免穿透
      setTimeout(() => {
        toolkit.terminateProcess(pid)
      }, GameClientMain.TERMINATE_DELAY)
    })
  }
}
