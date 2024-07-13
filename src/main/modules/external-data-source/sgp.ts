import { AvailableServersMap, SgpApi } from '@shared/external-data-source/sgp'
import { SgpMatchHistoryLol } from '@shared/external-data-source/sgp/types'
import { MatchHistory } from '@shared/types/lcu/match-history'
import { formatError } from '@shared/utils/errors'
import { makeAutoObservable, observable } from 'mobx'
import fs from 'node:fs'

import { ExternalDataSourceModule } from '.'
import builtinSgpServersJson from '../../../../resources/builtin-config/external-data-source/mh-sgp-servers.json?commonjs-external&asset'
import { LcuConnectionModule } from '../akari-core/lcu-connection'
import { LcuSyncModule } from '../lcu-state-sync'

export class SgpEdsState {
  availability = {
    currentRegion: '',
    currentRegionSupported: false,
    supportedServers: {} as AvailableServersMap
  }

  constructor() {
    makeAutoObservable(this, {
      availability: observable.ref
    })
  }

  setAvailability(
    currentRegion: string,
    currentRegionSupported: boolean,
    supportedServers: AvailableServersMap
  ) {
    this.availability = {
      currentRegion,
      currentRegionSupported,
      supportedServers
    }
  }
}

export class SgpEds {
  public state = new SgpEdsState()

  private _lcu: LcuSyncModule
  private _lc: LcuConnectionModule
  private _sgp = new SgpApi()

  static TENCENT_REGION = 'TENCENT'
  static MH_SGP_SERVERS_JSON = 'mh-sgp-servers_v2.json'

  constructor(private _edsm: ExternalDataSourceModule) {}

  async setup() {
    this._lcu = this._edsm.manager.getModule('lcu-state-sync')
    this._lc = this._edsm.manager.getModule('lcu-connection')

    await this._loadAvailableServersFromLocalFile()
    this._setupMethodCall()
    this._handleUpdateSupportedInfo()
    this._maintainSessionToken()
  }

  private async _loadAvailableServersFromLocalFile() {
    try {
      if (!(await this._edsm.ss.jsonConfigExists(SgpEds.MH_SGP_SERVERS_JSON))) {
        if (fs.existsSync(builtinSgpServersJson)) {
          this._edsm.logger.info('配置文件目录不存在，将使用内置的 SGP 服务器配置文件')
          const data = await fs.promises.readFile(builtinSgpServersJson, 'utf-8')
          await this._edsm.ss.writeToJsonConfig(SgpEds.MH_SGP_SERVERS_JSON, JSON.parse(data))
        } else {
          this._edsm.logger.warn('未找到内置的 SGP 服务器配置文件')
          return
        }
      }

      this._edsm.logger.info('加载到本地 SGP 服务器配置文件')
      const json = await this._edsm.ss.readFromJsonConfig(SgpEds.MH_SGP_SERVERS_JSON)

      // 检测是否是 Record<string, AvailableServersMap> 类型
      if (typeof json !== 'object') {
        throw new Error('配置文件格式错误')
      }

      for (const key in json) {
        if (typeof json[key] !== 'object') {
          throw new Error('配置文件格式错误')
        }

        if (typeof json[key].name !== 'string' || typeof json[key].server !== 'string') {
          throw new Error('配置文件格式错误')
        }
      }

      this._sgp.setAvailableSgpServers(json)
      this.state.setAvailability('', false, json)
    } catch (error) {
      this._edsm.logger.warn(`加载 SGP 服务器配置文件时发生错误: ${formatError(error)}`)
    }
  }

  private _handleUpdateSupportedInfo() {
    this._edsm.simpleSync('sgp/availability', () => this.state.availability)

    this._edsm.autoDisposeReaction(
      () => this._lc.state.auth,
      async (auth) => {
        if (!auth) {
          return
        }

        let region = auth.region

        if (region === SgpEds.TENCENT_REGION) {
          region = auth.rsoPlatformId
        }

        const supported = this._sgp.supportsPlatform(region)
        const supportedPlatforms = this._sgp.supportedPlatforms()

        this.state.setAvailability(region, supported, supportedPlatforms)
      },
      { fireImmediately: true }
    )
  }

  /**
   * 获取玩家的战绩记录
   * @param playerPuuid 玩家的 PUUID
   * @param start 起始索引
   * @param count 获取数量
   * @param sgpServerId 目标 SGP 服务器 ID，如果不提供则使用当前登录 LCU 的服务器 ID
   * @returns
   */
  getMatchHistory(playerPuuid: string, start: number, count: number, sgpServerId?: string) {
    if (!sgpServerId) {
      const auth = this._lc.state.auth
      if (!auth) {
        throw new Error('LCU is not connected')
      }

      // 对于腾讯服务器，存在多个子服务器
      if (auth.region === SgpEds.TENCENT_REGION) {
        sgpServerId = auth.rsoPlatformId
      } else {
        sgpServerId = auth.region
      }
    }

    return this._sgp.getMatchHistory(sgpServerId, playerPuuid, start, count)
  }

  async getMatchHistoryLcuFormat(
    playerPuuid: string,
    start: number,
    count: number,
    sgpServerId?: string
  ) {
    const result = await this.getMatchHistory(playerPuuid, start, count, sgpServerId)

    try {
      return this.parseSgpToLcu0Format(result.data, start, count)
    } catch (error) {
      this._edsm.logger.warn(`转换战绩数据 SGP 到 LCU 时发生错误: ${formatError(error)}`)
      throw error
    }
  }

  /**
   * 始终是 detailed 的，但只有部分属性
   * 不是很优雅
   */
  parseSgpToLcu0Format(sgpMh: SgpMatchHistoryLol, start = 0, count = 20): MatchHistory {
    const jsonArr = sgpMh.games
      .map((game) => game.json)
      .map((json) => {
        const { participants, teams, ...rest } = json

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
      })

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

  private _setupMethodCall() {
    this._edsm.onCall('supported-sgp-servers', () => {
      return this._sgp.supportedPlatforms()
    })

    this._edsm.onCall(
      'get-match-history-lcu-format',
      async (playerPuuid: string, start: number, count: number, sgpServerId?: string) => {
        return this.getMatchHistoryLcuFormat(playerPuuid, start, count, sgpServerId)
      }
    )
  }

  private _maintainSessionToken() {
    this._edsm.autoDisposeReaction(
      () => this._lcu.entitlements.token,
      (token) => {
        if (!token) {
          this._sgp.setJwtToken(null)
          return
        }

        this._edsm.logger.info(`更新 Entitlements Token: ${JSON.stringify(token)}`)

        this._sgp.setJwtToken(token.accessToken)
      },
      { fireImmediately: true }
    )
  }
}
