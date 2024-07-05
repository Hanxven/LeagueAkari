import { SgpApi } from '@shared/external-data-source/sgp/match-history'

import { ExternalDataSourceModule } from '.'
import { LcuConnectionModule } from '../akari-core/lcu-connection'
import { LcuSyncModule } from '../lcu-state-sync'

export class SgpEds {
  private _lcu: LcuSyncModule
  private _lc: LcuConnectionModule
  private _sgp = new SgpApi()

  static TENCENT_REGION = 'TENCENT'

  constructor(private _edsm: ExternalDataSourceModule) {}

  async setup() {
    this._lcu = this._edsm.manager.getModule('lcu-state-sync')
    this._lc = this._edsm.manager.getModule('lcu-connection')

    this._setupMethodCall()
    this._maintainSessionToken()
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

  private _setupMethodCall() {
    this._edsm.onCall('supported-sgp-servers', () => {
      return this._sgp.supportedPlatforms()
    })

    this._edsm.onCall(
      'get-match-history',
      (playerPuuid: string, start: number, count: number, sgpServerId?: string) => {
        return this.getMatchHistory(playerPuuid, start, count, sgpServerId)
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

        this._sgp.setJwtToken(token.accessToken)
      }
    )
  }
}
