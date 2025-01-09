import axios from 'axios'
import { AxiosRetry } from 'axios-retry'

const axiosRetry = require('axios-retry').default as AxiosRetry

export interface GtimgHeroListJs {
  hero: Hero[]
  version: string
  fileName: string
  fileTime: string
}

export interface Hero {
  heroId: string
  name: string
  alias: string
  title: string
  roles: string[]
  isWeekFree: string
  attack: string
  defense: string
  magic: string
  difficulty: string
  selectAudio: string
  banAudio: string
  isARAMweekfree: string
  ispermanentweekfree: string
  changeLabel: string
  goldPrice: string
  couponPrice: string
  camp: string
  campId: string
  keywords: string
  instance_id: string
}

export class GtimgApi {
  static BASE_URL = 'https://game.gtimg.cn/'

  static USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'

  private _http = axios.create({
    headers: {
      'User-Agent': GtimgApi.USER_AGENT
    },
    baseURL: GtimgApi.BASE_URL
  })

  get http() {
    return this._http
  }

  constructor() {
    axiosRetry(this._http, {
      retries: 2,
      retryDelay: () => 0,
      retryCondition: (error) => {
        return Boolean(error.response)
      }
    })
  }

  async getHeroList() {
    const { data } = await this._http.get<GtimgHeroListJs>(
      '/images/lol/act/img/js/heroList/hero_list.js'
    )
    return data
  }
}
