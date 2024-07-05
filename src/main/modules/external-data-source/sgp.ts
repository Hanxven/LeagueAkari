import { SgpApi } from '@shared/external-data-source/sgp'
import { SgpMatchHistoryLol } from '@shared/external-data-source/sgp/types'
import { MatchHistory } from '@shared/types/lcu/match-history'
import { formatError } from '@shared/utils/errors'
import { makeAutoObservable, observable } from 'mobx'

import { ExternalDataSourceModule } from '.'
import { LcuConnectionModule } from '../akari-core/lcu-connection'
import { LcuSyncModule } from '../lcu-state-sync'

export class SgpEdsState {
  availability = {
    currentRegion: '',
    currentRegionSupported: false,
    regionsSupported: [] as string[]
  }

  constructor() {
    makeAutoObservable(this, {
      availability: observable.ref
    })
  }

  setAvailability(
    currentRegion: string,
    currentRegionSupported: boolean,
    regionsSupported: string[]
  ) {
    this.availability.currentRegion = currentRegion
    this.availability.currentRegionSupported = currentRegionSupported
    this.availability.regionsSupported = regionsSupported
  }
}

export class SgpEds {
  public state = new SgpEdsState()

  private _lcu: LcuSyncModule
  private _lc: LcuConnectionModule
  private _sgp = new SgpApi()

  static TENCENT_REGION = 'TENCENT'

  constructor(private _edsm: ExternalDataSourceModule) {}

  async setup() {
    this._lcu = this._edsm.manager.getModule('lcu-state-sync')
    this._lc = this._edsm.manager.getModule('lcu-connection')

    this._setupMethodCall()
    this._handleUpdateSupportedInfo()
    this._maintainSessionToken()
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
  parseSgpToLcu0Format(sgpMh: SgpMatchHistoryLol, start = 0, count = 0): MatchHistory {
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
            baronKills: objectives.baron.kills,
            dragonKills: objectives.dragon.kills,
            firstBaron: objectives.baron.first,
            firstBlood: firstBloodTeamId === t.teamId,
            firstDargon: objectives.dragon.first, // LCU 接口中的 Dragon 拼写就是如此，不确定是否是有意为之
            firstInhibitor: objectives.inhibitor.first,
            firstTower: objectives.tower.first,
            hordeKills: objectives.horde.kills,
            inhibitorKills: objectives.inhibitor.kills,
            riftHeraldKills: objectives.riftHerald.kills,
            vilemawKills: 0, // 默认值
            dominionVictoryScore: 0, // 默认值
            towerKills: objectives.tower.kills,
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
