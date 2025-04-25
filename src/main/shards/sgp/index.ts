import { IntervalTask } from '@main/utils/timer'
import builtinSgpServersJson from '@resources/builtin-config/sgp/league-servers.json?commonjs-external&asset'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { LeagueSgpApi } from '@shared/data-sources/sgp'
import { GithubFile } from '@shared/types/github'
import { formatError } from '@shared/utils/errors'
import axios, { isAxiosError } from 'axios'
import dayjs from 'dayjs'
import ofs from 'node:original-fs'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { validateSchema } from './config-validation'
import {
  mapSgpGameDetailsToLcu0Format,
  mapSgpGameSummaryToLcu0Format,
  mapSgpMatchHistoryToLcu0Format,
  mapSgpSummonerToLcu0Format
} from './data-mapper'
import { SgpState } from './state'

/**
 * Service Gateway Proxy
 * 处理任何跨区相关逻辑, 提供 API 调用或数据转换
 */
@Shard(SgpMain.id)
export class SgpMain implements IAkariShardInitDispose {
  static id = 'sgp-main'

  static LEAGUE_SGP_SERVERS_JSON = 'league-servers.json'
  static CONFIG_SCHEMA_VERSION = 1
  static SGP_SERVERS_CONFIG_GITHUB_URL =
    '/repos/Hanxven/LeagueAkari-Config/contents/configs/sgp/league-servers.json?ref=main'

  public readonly state: SgpState

  private readonly _log: AkariLogger
  private readonly _setting: SetterSettingService

  private readonly _http = axios.create({
    baseURL: 'https://api.github.com'
  })

  private readonly _api = new LeagueSgpApi()

  private _updateConfigTask = new IntervalTask(
    () => this._fetchAndUpdateSgpServers(),
    1000 * 60 * 20
  )

  constructor(
    private readonly _app: AppCommonMain,
    private readonly _loggerFactory: LoggerFactoryMain,
    private readonly _settingFactory: SettingFactoryMain,
    private readonly _mobx: MobxUtilsMain,
    private readonly _lc: LeagueClientMain,
    private readonly _ipc: AkariIpcMain
  ) {
    this._log = _loggerFactory.create(SgpMain.id)
    this._setting = _settingFactory.register(SgpMain.id, {}, {})

    this.state = new SgpState(this._lc.state)
  }

  async onInit() {
    await this._loadSgpServerConfigFromLocalFile()

    this._mobx.propSync(SgpMain.id, 'state', this.state, [
      'availability',
      'isTokenReady',
      'sgpServerConfig'
    ])

    this._handleIpcCall()
    this._handleUpdateHttpProxy()
    this._handleUpdateConfig()
    this._maintainEntitlementsToken()
    this._maintainLeagueSessionToken()

    this._updateConfigTask.start(true)
  }

  /**
   * 从本地的配置区加载配置文件. 若不存在, 则从应用内置的配置文件中加载, 并复制到本地配置区
   */
  private async _loadSgpServerConfigFromLocalFile() {
    try {
      const exists = await this._setting.jsonConfigFileExists(SgpMain.LEAGUE_SGP_SERVERS_JSON)

      if (!exists) {
        this._log.info('无已保存的配置文件，将使用内置的 SGP 服务器配置文件')

        if (ofs.existsSync(builtinSgpServersJson)) {
          const data = await ofs.promises.readFile(builtinSgpServersJson, 'utf-8')
          await this._setting.writeToJsonConfigFile(
            SgpMain.LEAGUE_SGP_SERVERS_JSON,
            JSON.parse(data)
          )
        } else {
          this._log.warn('未找到内置的 SGP 服务器配置文件')
          return
        }
      }

      const json = await this._setting.readFromJsonConfigFile(SgpMain.LEAGUE_SGP_SERVERS_JSON)

      if (this._validateConfig(json)) {
        this.state.setSgpServerConfig(json)
        this._log.info(
          '加载本地 SGP 服务器配置文件',
          dayjs(json.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
        )
      }
    } catch (error) {
      this._log.warn(`加载 SGP 服务器配置文件时发生错误: ${formatError(error)}`)
    }
  }

  /**
   * 版本和格式校验
   */
  private _validateConfig(json: any) {
    const { valid, errors } = validateSchema(json)

    if (!valid) {
      this._log.warn(`SGP 服务器配置文件格式错误: ${errors?.map((e) => formatError(e))}`)
      return false
    }

    // support only the exact version
    if (json.version !== SgpMain.CONFIG_SCHEMA_VERSION) {
      this._log.warn(
        `SGP 服务器配置文件版本不匹配, 当前版本: ${SgpMain.CONFIG_SCHEMA_VERSION}, 远程版本: ${json.version}`
      )
      return false
    }

    return true
  }

  private _handleUpdateConfig() {
    this._mobx.reaction(
      () => this.state.sgpServerConfig,
      (config) => {
        this._api.setSgpServerConfig(config)
      },
      { fireImmediately: true }
    )
  }

  /**
   * 如果远程的配置文件比应用内置的配置文件新, 则立即覆盖本地配置区的配置文件
   */
  private async _fetchAndUpdateSgpServers() {
    this._log.info('检查远程 SGP 服务器配置文件')

    try {
      const { data } = await this._http.get<GithubFile>(SgpMain.SGP_SERVERS_CONFIG_GITHUB_URL)

      const { content, encoding } = data

      if (encoding !== 'base64') {
        this._log.warn('检查远程 SGP 配置文件时, 遇到不支持的编码格式:', encoding)
        return
      }

      const raw = Buffer.from(content, 'base64').toString('utf-8')
      const json = JSON.parse(raw)

      if (this._validateConfig(json)) {
        if (json.lastUpdate > this.state.sgpServerConfig.lastUpdate) {
          this.state.setSgpServerConfig(json)
          await this._setting.writeToJsonConfigFile(SgpMain.LEAGUE_SGP_SERVERS_JSON, json)
          this._log.info(
            '更新本地 SGP 服务器配置文件',
            dayjs(json.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
          )
        } else {
          this._log.info(
            '远程 SGP 服务器配置文件没有更新',
            dayjs(json.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
          )
        }
      }
    } catch (error) {
      this._log.warn(`更新 SGP 服务器配置文件时发生错误:`, error)
    }
  }

  async getSummoner(puuid: string, sgpServerId?: string) {
    if (!sgpServerId) {
      sgpServerId = this.state.availability.sgpServerId
    }

    const { data } = await this._api.getSummonerByPuuid(sgpServerId, puuid)

    if (!data || data.length === 0) {
      return null
    }

    return data[0]
  }

  /**
   * 获取玩家的战绩记录
   * @param playerPuuid 玩家的 PUUID
   * @param start 起始索引
   * @param count 获取数量
   * @param sgpServerId 目标 SGP 服务器 ID，如果不提供则使用当前登录 LCU 的服务器 ID
   * @returns
   */
  async getMatchHistory(
    playerPuuid: string,
    start: number,
    count: number,
    tag?: string | null,
    sgpServerId?: string
  ) {
    if (!sgpServerId) {
      sgpServerId = this.state.availability.sgpServerId
    }

    if (tag) {
      const { data } = await this._api.getMatchHistory(sgpServerId, playerPuuid, start, count, tag)
      return data
    }

    const { data } = await this._api.getMatchHistory(sgpServerId, playerPuuid, start, count)
    return data
  }

  async getGameSummary(gameId: number, sgpServerId?: string) {
    if (!sgpServerId) {
      sgpServerId = this.state.availability.sgpServerId
    }

    const { data } = await this._api.getGameSummary(sgpServerId, gameId)

    return data
  }

  async getGameDetails(gameId: number, sgpServerId?: string) {
    if (!sgpServerId) {
      sgpServerId = this.state.availability.sgpServerId
    }

    const { data } = await this._api.getGameDetails(sgpServerId, gameId)

    return data
  }

  async getMatchHistoryLcuFormat(
    playerPuuid: string,
    start: number,
    count: number,
    tag?: string | null,
    sgpServerId?: string
  ) {
    const result = await this.getMatchHistory(playerPuuid, start, count, tag, sgpServerId)

    try {
      return mapSgpMatchHistoryToLcu0Format(result, start, count)
    } catch (error) {
      this._log.warn(`转换战绩数据 SGP 到 LCU 时发生错误: ${formatError(error)}, ${playerPuuid}`)
      throw error
    }
  }

  async getGameSummaryLcuFormat(gameId: number, sgpServerId?: string) {
    const result = await this.getGameSummary(gameId, sgpServerId)

    try {
      return mapSgpGameSummaryToLcu0Format(result)
    } catch (error) {
      this._log.warn(`转换对局数据 SGP 到 LCU 时发生错误: ${formatError(error)}, ${gameId}`)
      throw error
    }
  }

  async getSummonerLcuFormat(playerPuuid: string, sgpServerId?: string) {
    const result = await this.getSummoner(playerPuuid, sgpServerId)
    if (!result) {
      return null
    }

    try {
      return mapSgpSummonerToLcu0Format(result)
    } catch (error) {
      this._log.warn(`转换召唤师数据 SGP 到 LCU 时发生错误: ${formatError(error)}, ${playerPuuid}`)
      throw error
    }
  }

  async getTimelineLcuFormat(gameId: number, sgpServerId?: string) {
    const result = await this.getGameDetails(gameId, sgpServerId)

    try {
      return mapSgpGameDetailsToLcu0Format(result)
    } catch (error) {
      this._log.warn(`转换时间线数据 SGP 到 LCU 时发生错误: ${formatError(error)}, ${gameId}`)
      throw error
    }
  }

  async getRankedStats(puuid: string, sgpServerId?: string) {
    if (!sgpServerId) {
      sgpServerId = this.state.availability.sgpServerId
    }

    try {
      const { data } = await this._api.getRankedStats(sgpServerId, puuid)
      return data
    } catch (error) {
      this._log.warn(`获取排位信息失败: ${formatError(error)}`)
      throw error
    }
  }

  async getSpectatorGameflow(puuid: string, sgpServerId?: string) {
    if (!sgpServerId) {
      sgpServerId = this.state.availability.sgpServerId
    }

    try {
      const { data } = await this._api.getSpectatorGameflowByPuuid(sgpServerId, puuid)

      return data
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return null
      }

      throw error
    }
  }

  private _handleIpcCall() {
    this._ipc.onCall(
      SgpMain.id,
      'getMatchHistoryLcuFormat',
      async (
        _,
        playerPuuid: string,
        start: number,
        count: number,
        tag?: string,
        sgpServerId?: string
      ) => {
        return this.getMatchHistoryLcuFormat(playerPuuid, start, count, tag, sgpServerId)
      }
    )

    this._ipc.onCall(
      SgpMain.id,
      'getMatchHistory',
      async (
        _,
        playerPuuid: string,
        start: number,
        count: number,
        tag?: string,
        sgpServerId?: string
      ) => {
        return await this.getMatchHistory(playerPuuid, start, count, tag, sgpServerId)
      }
    )

    this._ipc.onCall(SgpMain.id, 'getSummoner', async (_, puuid: string, sgpServerId?: string) => {
      return this.getSummoner(puuid, sgpServerId)
    })

    this._ipc.onCall(
      SgpMain.id,
      'getSummonerLcuFormat',
      async (_, puuid: string, sgpServerId?: string) => {
        return this.getSummonerLcuFormat(puuid, sgpServerId)
      }
    )

    this._ipc.onCall(
      SgpMain.id,
      'getGameSummary',
      async (_, gameId: number, sgpServerId?: string) => {
        return this.getGameSummary(gameId, sgpServerId)
      }
    )

    this._ipc.onCall(
      SgpMain.id,
      'getGameSummaryLcuFormat',
      async (_, gameId: number, sgpServerId?: string) => {
        return this.getGameSummaryLcuFormat(gameId, sgpServerId)
      }
    )

    this._ipc.onCall(
      SgpMain.id,
      'getRankedStats',
      async (_, puuid: string, sgpServerId?: string) => {
        return this.getRankedStats(puuid, sgpServerId)
      }
    )

    this._ipc.onCall(
      SgpMain.id,
      'getSpectatorGameflow',
      async (_, puuid: string, sgpServerId?: string) => {
        return this.getSpectatorGameflow(puuid, sgpServerId)
      }
    )
  }

  private _maintainEntitlementsToken() {
    this._mobx.reaction(
      () => this._lc.data.entitlements.token,
      (token) => {
        if (!token) {
          this._api.setEntitlementsToken(null)
          this.state.setEntitlementsTokenSet(false)
          return
        }

        const copiedToken = structuredClone(token)

        copiedToken.accessToken = copiedToken.accessToken?.slice(0, 24) + '...'
        copiedToken.token = copiedToken.token?.slice(0, 24) + '...'

        this._log.info(`更新 Entitlements Token: ${JSON.stringify(copiedToken)}`)

        this._api.setEntitlementsToken(token.accessToken)
        this.state.setEntitlementsTokenSet(true)
      },
      { fireImmediately: true }
    )
  }

  private _maintainLeagueSessionToken() {
    this._mobx.reaction(
      () => this._lc.data.leagueSession.token,
      (token) => {
        if (!token) {
          this._api.setLeagueSessionToken(null)
          this.state.setLeagueSessionTokenSet(false)
          return
        }

        const copied = token.slice(0, 24) + '...'

        this._log.info(`更新 Lol League Session Token: ${copied}`)

        this._api.setLeagueSessionToken(token)
        this.state.setLeagueSessionTokenSet(true)
      },
      { fireImmediately: true }
    )
  }

  private _handleUpdateHttpProxy() {
    this._mobx.reaction(
      () => this._app.settings.httpProxy,
      (httpProxy) => {
        if (httpProxy.strategy === 'force') {
          this._api.http.defaults.proxy = {
            host: httpProxy.host,
            port: httpProxy.port
          }
        } else if (httpProxy.strategy === 'auto') {
          this._api.http.defaults.proxy = undefined
        } else if (httpProxy.strategy === 'disable') {
          this._api.http.defaults.proxy = false
        }
      },
      { fireImmediately: true }
    )
  }

  async onDispose() {
    this._updateConfigTask.cancel()
  }
}
