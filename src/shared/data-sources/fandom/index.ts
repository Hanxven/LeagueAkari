import axios from 'axios'
import { AxiosRetry } from 'axios-retry'
import luaparse from 'luaparse'

const axiosRetry = require('axios-retry').default as AxiosRetry

export interface BalanceType {
  id: number
  balance: Record<string, Balance>
}

export interface Balance {
  dmg_dealt?: number
  dmg_taken?: number
  shielding?: number
  healing?: number
  ability_haste?: number
  attack_speed?: number
  energy_regen?: number
  tenacity?: number
  movement_speed?: number
}

export class LolFandomWikiApi {
  static BASE_URL = 'https://leagueoflegends.fandom.com'
  static USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  static GAME_MODES = ['aram', 'ar', 'nb', 'ofa', 'urf', 'usb'] as const
  static BALANCE_TYPES = [
    'dmg_dealt',
    'dmg_taken',
    'healing',
    'shielding',
    'ability_haste',
    'mana_regen',
    'energy_regen',
    'attack_speed',
    'movement_speed',
    'tenacity'
  ] as const

  get http() {
    return this._http
  }

  constructor() {
    axiosRetry(this._http, {
      retries: 3,
      retryDelay: () => 0,
      retryCondition: (error) => {
        return Boolean(error.response)
      }
    })
  }

  async getBalance() {
    const raw = await this._fetchScriptRawString()
    return this._parseBalanceData(raw)
  }

  private _getValue(obj: any, key: string): any {
    if (Array.isArray(obj)) {
      for (const { key: key2, value } of obj) {
        if (key2.raw === `"${key}"`) {
          return value
        }
      }
    }
    return null
  }

  private _http = axios.create({
    baseURL: LolFandomWikiApi.BASE_URL,
    headers: {
      'User-Agent': LolFandomWikiApi.USER_AGENT
    }
  })

  private _getNumberValue(obj: any, key: string): number | null {
    const field = this._getValue(obj, key)
    if (field) {
      if (typeof field.value === 'number') {
        return field.value
      }

      if (field.operator === '-') {
        return field.argument.value * -1
      }
    }

    return null
  }

  private async _fetchScriptRawString() {
    const res = await this._http.get<string>('/wiki/Module:ChampionData/data')

    const regex =
      /<pre\b(?=[^>]*?\bclass=['"]mw-code mw-script['"])(?=[^>]*?\bdir=['"]ltr['"])[^>]*?>([\s\S]*?)<\/pre>/

    const match = res.data.match(regex)
    if (!match) {
      throw new Error('未找到符合条件的 <pre> 标签')
    }

    const raw = match[1]
    const purified = raw
      .replace(/\&quot\;/g, '"')
      .replace(/\&lt\;/g, '<')
      .replace(/\&gt\;/g, '>')

    return purified
  }

  private _parseBalanceData(rawScriptString: string): Record<string, BalanceType> {
    const ret = {} as Record<string, any>
    const parsed: any = luaparse.parse(rawScriptString)
    const all = parsed.body[0].arguments[0]

    for (const obj of all.fields) {
      const fields = obj.value.fields
      const stats = this._getValue(fields, 'stats')

      if (!stats) {
        continue
      }

      const balance = {} as any
      for (const m of LolFandomWikiApi.GAME_MODES) {
        const fields = this._getValue(stats.fields, m)?.fields

        const modeBalance = {} as any
        for (const t of LolFandomWikiApi.BALANCE_TYPES) {
          const value = this._getNumberValue(fields, t)
          if (value !== null) {
            switch (t) {
              case 'dmg_dealt':
              case 'dmg_taken':
              case 'tenacity':
                if (value === 1.0) {
                  continue
                }
            }

            modeBalance[t] = value
          }
        }

        if (Object.keys(modeBalance).length) {
          balance[m] = modeBalance
        }
      }

      if (Object.keys(balance).length) {
        const id = this._getNumberValue(fields, 'id')

        if (id !== null) {
          const intId = Math.floor(id)
          ret[intId] = { id: intId, balance }
        }
      }
    }

    return ret
  }

  static validateBalance(obj: any): boolean {
    if (obj === null) {
      return true
    }

    if (typeof obj !== 'object') {
      return false
    }

    for (const key in obj) {
      const info = obj[key]

      if (
        typeof info !== 'object' ||
        info === null ||
        typeof info.id !== 'number' ||
        typeof info.balance !== 'object' ||
        info.balance === null
      ) {
        return false
      }

      const modes = ['ar', 'aram', 'nb', 'ofa', 'urf', 'usb']
      for (const mode of modes) {
        const modeInfo = info.balance[mode]
        if (modeInfo && typeof modeInfo !== 'object') {
          return false
        }

        if (modeInfo) {
          const properties = [
            'dmg_dealt',
            'dmg_taken',
            'healing',
            'shielding',
            'ability_haste',
            'mana_regen',
            'energy_regen',
            'attack_speed',
            'movement_speed',
            'tenacity'
          ]
          for (const prop of properties) {
            if (modeInfo[prop] !== undefined && typeof modeInfo[prop] !== 'number') {
              return false
            }
          }
        }
      }
    }

    return true
  }
}
