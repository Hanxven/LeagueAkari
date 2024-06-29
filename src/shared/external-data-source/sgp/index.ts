import axios, { AxiosInstance } from 'axios'

export class SgpApi {
  private _http: AxiosInstance
  private _httpAgent: string

  constructor(appVersion: string) {
    // 是的，没错
    this._httpAgent = `LeagueAkari/${appVersion}`

    this._http = axios.create({
      headers: {
        'User-Agent': this._httpAgent
      }
    })
  }

  /**
   * 将 SGP 格式的比赛历史数据转换为 LCU 格式，用于在英雄联盟客户端中展示
   */
  private _parseMatchHistoryLolToLcu() {}
}
