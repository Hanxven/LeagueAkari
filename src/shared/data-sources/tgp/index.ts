import { TgpGame, TgpPlayers, Player, TgpBattles } from '@shared/data-sources/tgp/types'
import axios from 'axios'
import { AxiosRetry } from 'axios-retry'

const axiosRetry = require('axios-retry').default as AxiosRetry

export class TgpLoginManager {
  static USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'

  private _http = axios.create({
    headers: {
      'User-Agent': TgpLoginManager.USER_AGENT
    }
  })

  constructor() {
    // 设置自动重试
    axiosRetry(this._http, {
      retries: 3,
      retryDelay: () => 0,
      retryCondition: (error) => {
        return Boolean(error.response)
      }
    })
  }

  async checkQrCodeStatus(qrsig: string) {
    let ptqrtoken = this.hash33(qrsig!)
    const url =
      'https://xui.ptlogin2.qq.com/ssl/ptqrlogin?' +
      `u1=https%3A%2F%2Fwww.wegame.com.cn%2Fmiddle%2Flogin%2Fthird_callback.html&ptqrtoken=${ptqrtoken}&ptredirect=0&h=1&t=1&g=1&from_ui=1&ptlang=2052&action=0-0-${Date.now()}&js_ver=24091915&js_type=1&pt_uistyle=40&aid=1600001063&daid=733&pt_js_version=v1.57.0`
    const response = await this._http.get(url, { headers: { Cookie: `qrsig=${qrsig}` } })

    if (response.data.includes('二维码未失效')) {
      return ['二维码有效']
    } else if (response.data.includes('二维码认证中')) {
      return ['认证中']
    } else if (response.data.includes('二维码已失效')) {
      return ['二维码已失效']
    } else {
      const match = response.data.match(/https:\/\/[^']+/)
      if (match) {
        const httpsUrl = match[0]
        const loginResponse = await this._http.get(httpsUrl, {
          maxRedirects: 0,
          validateStatus: (s) => s === 302
        })
        const qq =
          loginResponse.headers['set-cookie']
            ?.find((cookie: string) => cookie.includes('uin'))
            ?.split(';')[0]
            .split('=')[1]
            .replace(/^o/, '') || null
        const pskey = loginResponse.headers['set-cookie']
          ?.find((cookie: string) => cookie.includes('p_skey='))
          ?.split(';')[0]
          ?.split('=')[1] || null;


        return ['登录成功', qq, pskey]
      } else {
        return ['登录失败']
      }
    }
  }

  async getQrCode() {
    const url =
      'https://ssl.ptlogin2.qq.com/ptqrshow?appid=1600001063&e=2&l=M&s=3&d=72&v=4&t=0.8692955245720428&daid=733&pt_3rd_aid=0&u1=https%3A%2F%2Fwww.wegame.com.cn%2Fmiddle%2Flogin%2Fthird_callback.html'
    const response = await this._http.get(url, { responseType: 'arraybuffer' })

    const qrsig =
      response.headers['set-cookie']
        ?.find((cookie: string) => cookie.includes('qrsig'))
        ?.split(';')[0]
        .split('=')[1] || null
    const imageBuffer = Buffer.from(response.data, 'binary')
    return [`data:image/png;base64,${imageBuffer.toString('base64')}`, qrsig]
  }

  async loginByQQ(qq: string, pskey: string) {
    const url = 'https://www.wegame.com.cn/api/middle/clientapi/auth/login_by_qq'
    const headers = {
      referer: 'https://www.wegame.com.cn/middle/login/third_callback.html',
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*'
    }

    const payload = {
      login_info: {
        qq_info_type: 6,
        uin: qq,
        sig: pskey
      },
      config_params: {
        lang_type: 0
      },
      mappid: '10001',
      mcode: '',
      clienttype: '1000005'
    }

    const response = await this._http.post(url, payload, { headers })
    const tgpId =
      response.headers['set-cookie']
        ?.find((cookie: string) => cookie.includes('tgp_id'))
        ?.split(';')[0]
        .split('=')[1] || null
    const tgpTicket =
      response.headers['set-cookie']
        ?.find((cookie: string) => cookie.includes('tgp_ticket'))
        ?.split(';')[0]
        .split('=')[1] || null
    return [tgpId, tgpTicket]
  }

  // 计算 ptqrtoken
  private hash33(qrsig: string): number {
    let e = 0
    for (let i = 0; i < qrsig.length; i++) {
      e += (e << 5) + qrsig.charCodeAt(i)
    }
    return 2147483647 & e
  }
}

export class TgpApi {
  private _tgpTicket: string | null = null
  private _tgpId: string | null = null

  setTgpTicket(ticket: string | null) {
    this._tgpTicket = ticket
  }

  setTgpId(id: string | null) {
    this._tgpId = id
  }

  private _http = axios.create({
    headers: {
      'User-Agent': TgpLoginManager.USER_AGENT,
      'Referer': 'https://www.wegame.com.cn/helper/lol/v2/index.html'
    },
    baseURL: 'https://www.wegame.com.cn/api/v1/wegame.pallas.game.LolBattle'
  })

  constructor(private _tam) {
    axiosRetry(this._http, {
      retries: 3,
      retryDelay: () => 0,
      retryCondition: (error) => {
        return Boolean(error.response)
      }
    })
    this._http.interceptors.request.use(
      (config) => {
        config.headers['Cookie'] = `tgp_id=${this._tgpId}; tgp_ticket=${this._tgpTicket}`
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )
    this._http.interceptors.response.use(
      (response) => {
        this._tam.state.settings.setExpired(response.data.result.error_code === 8000102)
        return response;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  async checkExpiration(qq: string) {
    const payload = { area: 1, game_id: qq }
    const data = (await this._http.post('/GetSummonerInfo', payload)).data;
    return !data.result || data.result.error_code === 8000102
  }

  async searchPlayer(nickname: string, pageSize: number) {
    const payload = {
      nickname: nickname,
      page_size: pageSize,
    }

    return this._http.post<TgpPlayers>('/SearchPlayer', payload);
  }

  async getBattleList(player: Player, offset: number, count: number, filter: string) {
    const payload = {
      account_type: 2,
      area: player.area,
      id: player.openid,
      count: count,
      offset: offset,
      filter: filter,
    }

    return this._http.post<TgpBattles>('/GetBattleList', payload);
  }

  async getBattleDetail(area: string, gameId: number) {
    const payload = {
      area,
      game_id: gameId.toString()
    }

    return this._http.post<TgpGame>('/GetBattleDetail', payload)
  }
}
