import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { AvailableServersMap, SgpApi } from '@shared/data-sources/sgp'
import {
  SgpGameDetailsLol,
  SgpGameSummaryLol,
  SgpMatchHistoryLol,
  SgpSummoner
} from '@shared/data-sources/sgp/types'
import { Game, GameTimeline, MatchHistory } from '@shared/types/league-client/match-history'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import { formatError } from '@shared/utils/errors'
import Ajv from 'ajv'
import { isAxiosError } from 'axios'
import fs from 'node:fs'

import builtinSgpServersJson from '../../../../resources/builtin-config/sgp/mh-sgp-servers.json?commonjs-external&asset'
import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { SgpState } from './state'

/**
 * 配置文件需要遵守
 */
const SCHEMA = {
  type: 'object',
  properties: {
    servers: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          name: {
            type: 'string'
          },
          matchHistory: {
            type: ['string', 'null']
          },
          common: {
            type: ['string', 'null']
          }
        },
        required: ['name'],
        additionalProperties: false
      }
    },
    tencentServerMatchHistoryInteroperability: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    tencentServerSpectatorInteroperability: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    tencentServerSummonerInteroperability: {
      type: 'array',
      items: {
        type: 'string'
      }
    }
  },
  required: [
    'servers',
    'tencentServerMatchHistoryInteroperability',
    'tencentServerSpectatorInteroperability',
    'tencentServerSummonerInteroperability'
  ],
  additionalProperties: false
} as const

/**
 * Service Gateway Proxy
 * 处理任何跨区相关逻辑, 提供 API 调用或数据转换
 */
export class SgpMain implements IAkariShardInitDispose {
  static id = 'sgp-main'
  static dependencies = [
    'logger-factory-main',
    'setting-factory-main',
    'mobx-utils-main',
    'league-client-main',
    'akari-ipc-main'
  ]

  static MH_SGP_SERVERS_JSON = 'mh-sgp-servers_v7.json'

  public readonly state: SgpState

  private _loggerFactory: LoggerFactoryMain
  private _settingFactory: SettingFactoryMain
  private _log: AkariLogger
  private _setting: SetterSettingService
  private _mobx: MobxUtilsMain
  private _lc: LeagueClientMain
  private _ipc: AkariIpcMain

  private readonly _sgp = new SgpApi()

  constructor(deps: any) {
    this._loggerFactory = deps['logger-factory-main']
    this._settingFactory = deps['setting-factory-main']
    this._mobx = deps['mobx-utils-main']
    this._lc = deps['league-client-main']
    this._ipc = deps['akari-ipc-main']
    this._log = this._loggerFactory.create(SgpMain.id)
    this._setting = this._settingFactory.create(SgpMain.id, {}, {})

    this.state = new SgpState(this._lc.data)
  }

  async onInit() {
    await this._loadAvailableServersFromLocalFile()

    this._mobx.propSync(SgpMain.id, 'state', this.state, ['availability', 'isTokenReady'])

    this._handleIpcCall()
    this._handleUpdateSupportedInfo()
    this._maintainEntitlementsToken()
    this._maintainLolLeagueSessionToken()
  }

  private async _loadAvailableServersFromLocalFile() {
    try {
      if (!(await this._setting.jsonConfigFileExists(SgpMain.MH_SGP_SERVERS_JSON))) {
        if (fs.existsSync(builtinSgpServersJson)) {
          this._log.info('配置文件目录不存在，将使用内置的 SGP 服务器配置文件')
          const data = await fs.promises.readFile(builtinSgpServersJson, 'utf-8')
          await this._setting.writeToJsonConfigFile(SgpMain.MH_SGP_SERVERS_JSON, JSON.parse(data))
        } else {
          this._log.warn('未找到内置的 SGP 服务器配置文件')
          return
        }
      }

      this._log.info('加载到本地 SGP 服务器配置文件')
      const json = await this._setting.readFromJsonConfigFile(SgpMain.MH_SGP_SERVERS_JSON)

      const ajv = new Ajv()
      const validate = ajv.compile<AvailableServersMap>(SCHEMA)
      const valid = validate(json)

      if (!valid) {
        this._log.warn(`SGP 服务器配置文件格式错误: ${validate.errors?.map((e) => formatError(e))}`)
        return
      }

      this._sgp.setAvailableSgpServers(json)
      this.state.setAvailability(
        '',
        '',
        '',
        {
          common: false,
          matchHistory: false
        },
        json
      )
    } catch (error) {
      this._log.warn(`加载 SGP 服务器配置文件时发生错误: ${formatError(error)}`)
    }
  }

  private _handleUpdateSupportedInfo() {
    this._mobx.reaction(
      () => this._lc.state.auth,
      async (auth) => {
        if (!auth) {
          this.state.setAvailability(
            '',
            '',
            '',
            {
              common: false,
              matchHistory: false
            },
            this.state.availability.sgpServers
          )
          return
        }

        const sgpServerId =
          auth.region === 'TENCENT' ? `${auth.region}_${auth.rsoPlatformId}` : auth.region

        const supported = this._sgp.supportsSgpServer(sgpServerId)
        const sgpServers = this._sgp.sgpServers()

        this.state.setAvailability(
          auth.region,
          auth.rsoPlatformId,
          sgpServerId,
          {
            common: supported.common,
            matchHistory: supported.matchHistory
          },
          sgpServers
        )
      },
      { fireImmediately: true }
    )
  }

  async getSummoner(puuid: string, sgpServerId?: string) {
    if (!sgpServerId) {
      sgpServerId = this.state.availability.sgpServerId
    }

    const { data } = await this._sgp.getSummonerByPuuid(sgpServerId, puuid)

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
      const { data } = await this._sgp.getMatchHistory(sgpServerId, playerPuuid, start, count, tag)
      return data
    }

    const { data } = await this._sgp.getMatchHistory(sgpServerId, playerPuuid, start, count)
    return data
  }

  async getGameSummary(gameId: number, sgpServerId?: string) {
    if (!sgpServerId) {
      sgpServerId = this.state.availability.sgpServerId
    }

    const { data } = await this._sgp.getGameSummary(sgpServerId, gameId)

    return data
  }

  async getGameDetails(gameId: number, sgpServerId?: string) {
    if (!sgpServerId) {
      sgpServerId = this.state.availability.sgpServerId
    }

    const { data } = await this._sgp.getGameDetails(sgpServerId, gameId)

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
      return this.parseSgpMatchHistoryToLcu0Format(result, start, count)
    } catch (error) {
      this._log.warn(`转换战绩数据 SGP 到 LCU 时发生错误: ${formatError(error)}, ${playerPuuid}`)
      throw error
    }
  }

  async getGameSummaryLcuFormat(gameId: number, sgpServerId?: string) {
    const result = await this.getGameSummary(gameId, sgpServerId)

    try {
      return this.parseSgpGameSummaryToLcu0Format(result)
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
      return this.parseSgpSummonerToLcu0Format(result)
    } catch (error) {
      this._log.warn(`转换召唤师数据 SGP 到 LCU 时发生错误: ${formatError(error)}, ${playerPuuid}`)
      throw error
    }
  }

  async getTimelineLcuFormat(gameId: number, sgpServerId?: string) {
    const result = await this.getGameDetails(gameId, sgpServerId)

    try {
      return this.parseSgpGameDetailsToLcu0Format(result)
    } catch (error) {
      this._log.warn(`转换时间线数据 SGP 到 LCU 时发生错误: ${formatError(error)}, ${gameId}`)
      throw error
    }
  }

  parseSgpGameSummaryToLcu0Format(game: SgpGameSummaryLol): Game {
    const { participants, teams, ...rest } = game.json

    const participantIdentities = participants.map((p) => {
      return {
        participantId: p.participantId,
        player: {
          accountId: 0,
          currentAccountId: 0,
          currentPlatformId: rest.platformId,
          matchHistoryUri: '',
          platformId: rest.platformId,
          profileIcon: p.profileIcon,
          puuid: p.puuid,
          summonerId: p.summonerId,
          summonerName: p.summonerName,
          tagLine: p.riotIdTagline,
          gameName: p.riotIdGameName
        }
      }
    })

    const p2s = participants.map((p) => {
      const perkInfo: {
        perkPrimaryStyle: number
        perkSubStyle: number
        perk0: number
        perk0Var1: number
        perk0Var2: number
        perk0Var3: number
        perk1: number
        perk1Var1: number
        perk1Var2: number
        perk1Var3: number
        perk2: number
        perk2Var1: number
        perk2Var2: number
        perk2Var3: number
        perk3: number
        perk3Var1: number
        perk3Var2: number
        perk3Var3: number
        perk4: number
        perk4Var1: number
        perk4Var2: number
        perk4Var3: number
        perk5: number
        perk5Var1: number
        perk5Var2: number
        perk5Var3: number
      } = {} as any

      p.perks.styles.forEach((style) => {
        if (style.description === 'primaryStyle') {
          perkInfo.perkPrimaryStyle = style.style
        } else if (style.description === 'subStyle') {
          perkInfo.perkSubStyle = style.style
        }
      })

      let perkIndex = 0
      p.perks.styles
        .map((v) => v.selections)
        .forEach((selections) => {
          selections.forEach((selection) => {
            const key = `perk${perkIndex++}`
            perkInfo[key] = selection.perk

            perkInfo[`${key}Var1`] = selection.var1
            perkInfo[`${key}Var2`] = selection.var2
            perkInfo[`${key}Var3`] = selection.var3
          })
        })

      return {
        championId: p.championId,
        highestAchievedSeasonTier: '',
        participantId: p.participantId,
        spell1Id: p.spell1Id,
        spell2Id: p.spell2Id,
        teamId: p.teamId,
        stats: {
          earlySurrenderAccomplice: false,
          causedEarlySurrender: false,
          firstInhibitorAssist: false, // 默认值
          firstInhibitorKill: false, // 默认值
          combatPlayerScore: 0, // 默认值
          playerScore0: 0, // 默认值
          playerScore1: 0, // 默认值
          playerScore2: 0, // 默认值
          playerScore3: 0, // 默认值
          playerScore4: 0, // 默认值
          playerScore5: 0, // 默认值
          playerScore6: 0, // 默认值
          playerScore7: 0, // 默认值
          playerScore8: 0, // 默认值
          playerScore9: 0, // 默认值
          totalPlayerScore: 0, // 默认值
          totalScoreRank: 0, // 默认值
          objectivePlayerScore: 0, // 默认值
          magicalDamageTaken: p.magicDamageTaken,
          neutralMinionsKilledEnemyJungle: p.totalEnemyJungleMinionsKilled,
          neutralMinionsKilledTeamJungle: p.totalAllyJungleMinionsKilled,
          totalTimeCrowdControlDealt: p.totalTimeCCDealt,
          ...perkInfo,
          ...p
        },
        timeline: {
          creepsPerMinDeltas: {},
          csDiffPerMinDeltas: {},
          damageTakenDiffPerMinDeltas: {},
          damageTakenPerMinDeltas: {},
          goldPerMinDeltas: {},
          lane: p.lane,
          participantId: p.participantId,
          role: p.role,
          xpDiffPerMinDeltas: {},
          xpPerMinDeltas: {}
        }
      }
    })

    // first blood teamId
    const firstBloodTeamId = participants.find((p) => p.firstBloodKill)?.teamId

    const t2s = teams.map((t) => {
      const { win, objectives, bans, teamId } = t

      return {
        teamId,
        bans,
        baronKills: objectives.baron?.kills || 0,
        dragonKills: objectives.dragon?.kills || 0,
        firstBaron: objectives.baron?.first || false,
        firstBlood: firstBloodTeamId === t.teamId,
        firstDargon: objectives.dragon?.first || false, // LCU 接口中的 Dragon 拼写就是如此，不确定是否是有意为之
        firstInhibitor: objectives.inhibitor?.first || false,
        firstTower: objectives.tower?.first || false,
        hordeKills: objectives.horde?.kills || 0,
        inhibitorKills: objectives.inhibitor?.kills || 0,
        riftHeraldKills: objectives.riftHerald?.kills || 0,
        vilemawKills: 0, // 默认值
        dominionVictoryScore: 0, // 默认值
        towerKills: objectives.tower?.kills || 0,
        win: win ? 'Win' : 'Fail'
      }
    })

    return {
      ...rest,
      gameCreationDate: new Date(rest.gameCreation).toISOString(),
      participantIdentities,
      participants: p2s,
      teams: t2s
    }
  }

  /**
   * 始终是 detailed 的，但只有部分属性
   * 不是很优雅
   */
  parseSgpMatchHistoryToLcu0Format(sgpMh: SgpMatchHistoryLol, start = 0, count = 20): MatchHistory {
    const jsonArr = sgpMh.games.map((game) => this.parseSgpGameSummaryToLcu0Format(game))

    const gamePage = {
      gameBeginDate: '', // 默认值
      gameCount: count,
      gameEndDate: '', // 默认值
      gameIndexBegin: start,
      gameIndexEnd: start + count - 1,
      games: jsonArr
    }

    return {
      accountId: 0, // 默认值
      games: gamePage,
      platformId: '' // 默认值
    }
  }

  parseSgpSummonerToLcu0Format(sgpSummoner: SgpSummoner): SummonerInfo {
    return {
      accountId: sgpSummoner.accountId,
      displayName: sgpSummoner.name,
      gameName: '',
      internalName: sgpSummoner.internalName,
      nameChangeFlag: sgpSummoner.nameChangeFlag,
      percentCompleteForNextLevel: Math.round(
        (sgpSummoner.expPoints / sgpSummoner.expToNextLevel) * 100
      ),
      privacy: sgpSummoner.privacy as 'PUBLIC' | 'PRIVATE' | string, // 强制转换以匹配类型
      profileIconId: sgpSummoner.profileIconId,
      puuid: sgpSummoner.puuid,

      // 默认留空
      rerollPoints: {
        currentPoints: 0,
        maxRolls: 0,
        pointsToReroll: 0,
        numberOfRolls: 0,
        pointsCostToRoll: 0
      },
      tagLine: '',
      summonerId: sgpSummoner.id,
      summonerLevel: sgpSummoner.level,
      unnamed: sgpSummoner.unnamed,
      xpSinceLastLevel: sgpSummoner.expPoints,
      xpUntilNextLevel: sgpSummoner.expToNextLevel - sgpSummoner.expPoints
    }
  }

  parseSgpGameDetailsToLcu0Format(bData: SgpGameDetailsLol): GameTimeline {
    return {
      frames: bData.json.frames.map((frame) => ({
        timestamp: frame.timestamp,
        events: frame.events.map((event) => ({
          // A 的 Event 字段：
          assistingParticipantIds: event.assistingParticipantIds ?? [],
          buildingType: event.buildingType ?? '',
          itemId: event.itemId ?? 0,
          killerId: event.killerId ?? 0,
          laneType: event.laneType ?? '',
          monsterSubType: event.monsterSubType ?? '',
          monsterType: event.monsterType ?? '',
          participantId: event.participantId ?? 0,
          position: event.position ?? { x: 0, y: 0 },
          skillSlot: event.skillSlot ?? 0,
          teamId: event.teamId ?? 0,
          timestamp: event.timestamp,
          towerType: event.towerType ?? '',
          type: event.type ?? '',
          victimId: event.victimId ?? 0
        })),
        participantFrames: Object.fromEntries(
          Object.values(frame.participantFrames).map((pf) => [
            pf.participantId,
            {
              currentGold: pf.currentGold ?? 0,
              dominionScore: 0, // B 中无对应数据，设为默认值
              jungleMinionsKilled: pf.jungleMinionsKilled ?? 0,
              level: pf.level ?? 0,
              minionsKilled: pf.minionsKilled ?? 0,
              participantId: pf.participantId,
              position: pf.position ?? { x: 0, y: 0 },
              teamScore: 0, // B 中无对应数据，设为默认值
              totalGold: pf.totalGold ?? 0,
              xp: pf.xp ?? 0
            }
          ])
        )
      }))
    }
  }

  async getRankedStats(puuid: string, sgpServerId?: string) {
    if (!sgpServerId) {
      sgpServerId = this.state.availability.sgpServerId
    }

    try {
      const { data } = await this._sgp.getRankedStats(sgpServerId, puuid)
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
      const { data } = await this._sgp.getSpectatorGameflowByPuuid(sgpServerId, puuid)

      return data
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return null
      }

      throw error
    }
  }

  private _handleIpcCall() {
    this._ipc.onCall(SgpMain.id, 'getSupportedSgpServers', () => {
      return this._sgp.sgpServers()
    })

    this._ipc.onCall(
      SgpMain.id,
      'getMatchHistoryLcuFormat',
      async (
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
        playerPuuid: string,
        start: number,
        count: number,
        tag?: string,
        sgpServerId?: string
      ) => {
        return await this.getMatchHistory(playerPuuid, start, count, tag, sgpServerId)
      }
    )

    this._ipc.onCall(SgpMain.id, 'getSummoner', async (puuid: string, sgpServerId?: string) => {
      return this.getSummoner(puuid, sgpServerId)
    })

    this._ipc.onCall(
      SgpMain.id,
      'getSummonerLcuFormat',
      async (puuid: string, sgpServerId?: string) => {
        return this.getSummonerLcuFormat(puuid, sgpServerId)
      }
    )

    this._ipc.onCall(SgpMain.id, 'getGameSummary', async (gameId: number, sgpServerId?: string) => {
      return this.getGameSummary(gameId, sgpServerId)
    })

    this._ipc.onCall(
      SgpMain.id,
      'getGameSummaryLcuFormat',
      async (gameId: number, sgpServerId?: string) => {
        return this.getGameSummaryLcuFormat(gameId, sgpServerId)
      }
    )

    this._ipc.onCall(SgpMain.id, 'getRankedStats', async (puuid: string, sgpServerId?: string) => {
      return this.getRankedStats(puuid, sgpServerId)
    })

    this._ipc.onCall(
      SgpMain.id,
      'getSpectatorGameflow',
      async (puuid: string, sgpServerId?: string) => {
        return this.getSpectatorGameflow(puuid, sgpServerId)
      }
    )
  }

  private _maintainEntitlementsToken() {
    this._mobx.reaction(
      () => this._lc.data.entitlements.token,
      (token) => {
        if (!token) {
          this._sgp.setEntitlementsToken(null)
          return
        }

        const copiedToken = structuredClone(token)

        copiedToken.accessToken = copiedToken.accessToken?.slice(0, 24) + '...'
        copiedToken.token = copiedToken.token?.slice(0, 24) + '...'

        this._log.info(`更新 Entitlements Token: ${JSON.stringify(copiedToken)}`)

        this._sgp.setEntitlementsToken(token.accessToken)
      },
      { fireImmediately: true }
    )
  }

  private _maintainLolLeagueSessionToken() {
    this._mobx.reaction(
      () => this._lc.data.lolLeagueSession.token,
      (token) => {
        if (!token) {
          this._sgp.setEntitlementsToken(null)
          return
        }

        const copied = token.slice(0, 24) + '...'

        this._log.info(`更新 Lol League Session Token: ${copied}`)

        this._sgp.setLolLeagueSessionToken(token)
      },
      { fireImmediately: true }
    )
  }
}
