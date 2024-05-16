import axios from 'axios'
import luaparse from 'luaparse'

import { ChampBalanceDataSourceV1, ChampBalanceMapV1 } from '../normalized/champ-balance'

const FANDOM_DATA_URL = 'https://leagueoflegends.fandom.com'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'

const GAME_MODES = ['aram', 'ar', 'nb', 'ofa', 'urf', 'usb'] as const

const BALANCE_TYPES = [
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

export class FandomWikiChampBalanceDataSource implements ChampBalanceDataSourceV1 {
  static UPDATE_INTERVAL = 60 * 60 * 1e3

  private _name = 'Fandom Wiki'

  private _version = 'v1.0.0'

  private _id = 'fandom-wiki'

  private _updateAt = new Date(1990, 0, 1)

  get updateAt() {
    return this._updateAt
  }

  get version() {
    return this._version
  }

  get name() {
    return this._name
  }

  get id() {
    return this._id
  }

  get() {
    return this._data
  }

  async update(force?: boolean) {
    // 更新间隔是 1 小时
    if (
      force ||
      !this._data ||
      Date.now() - this._updateAt.getTime() > FandomWikiChampBalanceDataSource.UPDATE_INTERVAL
    ) {
      const raw = await this._fetchScriptRawString()
      this._data = this._parseBalanceData(raw)
      this._updateAt = new Date()
      return this._data
    }

    return null
  }

  private _data: ChampBalanceMapV1 | null = null

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

  private _axiosInstance = axios.create({
    baseURL: FANDOM_DATA_URL,
    headers: {
      'User-Agent': USER_AGENT
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
    const res = await this._axiosInstance.get('/wiki/Module:ChampionData/data')

    const tagStart = "<pre class='mw-code mw-script' dir='ltr'>"
    const tagEnd = '</pre>'
    const startIndex = res.data.indexOf(tagStart) + tagStart.length
    const endIndex = res.data.indexOf(tagEnd, startIndex)

    const raw = res.data.substring(startIndex, endIndex) as string
    const purified = raw
      .replace(/\&quot\;/g, '"')
      .replace(/\&lt\;/g, '<')
      .replace(/\&gt\;/g, '>')

    return purified
  }

  private _parseBalanceData(rawScriptString: string) {
    const ret = {} as Record<string, any>
    const parsed: any = luaparse.parse(rawScriptString)
    const all = parsed.body[0].arguments[0]

    for (const obj of all.fields) {
      const fields = obj.value.fields
      const stats = this._getValue(fields, 'stats')
      const balance = {} as any
      for (const m of GAME_MODES) {
        const fields = this._getValue(stats.fields, m)?.fields

        const modeBalance = {} as any
        for (const t of BALANCE_TYPES) {
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

  validate(obj: any): boolean {
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
