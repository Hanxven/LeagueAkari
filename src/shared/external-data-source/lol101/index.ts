import axios from 'axios'

import {
  NormalizedChampionInformation,
  NormalizedExternalRunesDataSource
} from '../normalized/runes'

export interface Lol101ChampDetails20240425 {
  status: string
  list: Lol101List
  gameVer: string
  date: string
}

export interface Lol101List {
  championLane: ChampionLane
  championTrend: ChampionTrend
  championFight: ChampionFight
}

export interface ChampionFight {
  jungle: Jungle[]
  top: Jungle[]
}

export interface Jungle {
  dtstatdate: string
  championid1: string
  championid2: string
  lane: string
  champion1showrate: string
  champion2showrate: string
  igamecnt: string
  iwincnt: string
  allgamecnt: string
  gamerate: string
  winrate: string
  easy_order: string
  hard_order: string
  killcnt: string
  allkillcnt: string
  ikillrate: string
  teamkillrate: string
  goldpermin: string
  kda: string
  totaldamagetaken: string
  totaldamagedealt: string
  mintime: string
  hold1: string
  hold2: string
  hold3: string
  hold4: string
  hold5: string
  hold6: string
  hold7: string
  hold8: string
  hold9: string
  hold10: string
  etl_stamp: string
}

export interface ChampionTrend {
  bottom: Bottom2
  jungle: Bottom2
  mid: Bottom2
  other: Bottom2
  support: Bottom2
  top: Bottom2
}

export interface Bottom2 {
  dtstatdate: string
  championid: string
  lane: string
  playtime_json: string
  gamecnt_json: string
  hold1: string
  hold2: string
  hold3: string
  hold4: string
  hold5: string
  hold6: string
  etl_stamp: string
}

export interface ChampionLane {
  bottom: Bottom
  jungle: Bottom
  mid: Bottom
  support: Bottom
  top: Bottom
}

export interface Bottom {
  dtstatdate: string
  championid: string
  gameversion: string
  lane: string
  wincnt: string
  igamecnt: string
  lanrate: string
  lanewinrate: string
  lanshowrate: string
  champlanorder: string
  mainviceperk: string
  perkdetail: string
  spellidjson: string
  itemoutjson: string
  core3itemjson: string
  shoesjson: string
  skilljson: string
  winrate_flow_playtime: string
  deaths: string
  kills: string
  assists: string
  kda: string
  timeplayed: string
  goldearned: string
  goldearnedpergame: string
  minionskilled: string
  damagerate: string
  damagetochamprate: string
  killsrate: string
  hold1: string
  hold2: string
  hold4: string
  hold5: string
  hold6: string
  hold7: string
  hold8: string
  hold9: string
  hold10: string
  etl_stamp: string
  hold3: string
}

const FABRICATED_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'

/**
 * 通过分析 LOL 101 接口的数据源
 *
 * 说实话如此奇妙的解析方式还是第一次见，估计 robustness 超级差
 */
export class Lol101DataSource implements NormalizedExternalRunesDataSource {
  name = 'LOL101'

  version = '2024-04-25T13:46:45.490Z'

  updateAt = new Date(2024, 3, 1)

  private axiosLol = axios.create({
    baseURL: 'https://lol.qq.com/',
    headers: {
      'User-Agent': FABRICATED_USER_AGENT
    }
  })

  private axiosSwGame = axios.create({
    baseURL: 'https://lol.sw.game.qq.com/',
    headers: {
      'User-Agent': FABRICATED_USER_AGENT,
      Referer: 'https://101.qq.com/'
    }
  })

  async getChampionDetailNormal(championId: number) {
    const result = await this.axiosLol.get(
      `/act/lbp/common/guides/champDetail/champDetail_${championId}.js`
    )

    const raw = result.data as string

    const firstEqualSymbolIndex = raw.indexOf('=')
    const lastIndex = raw.lastIndexOf(';')

    const javaScriptedObject = JSON.parse(raw.slice(firstEqualSymbolIndex, lastIndex))

    return javaScriptedObject
  }

  async getChampionDetailARAM(championId: number) {
    const result = await this.axiosSwGame.get(
      `/lol/lwdcommact/a20211015billboard/a20211015api/fighthero?dtstatdate=20240424&championid=${championId}&callback=getFightheroCallback`
    )

    const funcName = 'getFightheroCallback'

    const funcNameIndex = result.data.indexOf(funcName)

    const rawResponse = result.data.slice(
      funcNameIndex + funcName.length + 1,
      result.data.length - 1
    )

    const shit = JSON.parse(JSON.parse(rawResponse).data.result)

    return {
      timeSelectionWinRate: this.parseTimeSectionWinRate(shit.timesectionwinrate),
      runes: this.parseStyleDetails(shit.styledetails),
      spells: this.parseSpells(shit.spellid),
      singleItems: this.parseItems(shit.itemover),
      staringItems: this.parseItems(shit.itemout),
      coreItems: this.parseItems(shit.itemcore),
      shoes: this.parseItems(shit.itemshoes),
      duoChampions: this.parseDuoChampions(shit.doublechampiondetails),
      skillBuilds: this.parseRecommendedSkills(shit.skilllist)
    }
  }

  private parseTimeSectionWinRate(raw: string) {
    const sections = raw?.split('#')
    return (
      sections?.map((section) => {
        const [time, winRate] = section.split('&')
        return { time, winRate: parseFloat(winRate) }
      }) || null
    )
  }

  private parseStyleDetails(raw: string) {
    const details = raw?.split('#')
    return (
      details?.map((detail) => {
        const [runes, pickRate, winRate] = detail.split('$')
        const [primaryPerks, secondaryPerks, statShards] = runes.split('&').map((r) => r.split(','))
        return {
          primaryPerks: primaryPerks.map(Number),
          secondaryPerks: secondaryPerks.map(Number),
          statShards: statShards.map(Number),
          pickRate: parseFloat(pickRate),
          winRate: parseFloat(winRate)
        }
      }) || null
    )
  }

  private parseSpells(raw: string) {
    const spells = raw?.split('#')
    return (
      spells?.map((spell) => {
        const [ids, pickRate, winRate] = spell.split('$')

        return {
          spellIds: ids.split(',').map(Number),
          pickRate: parseFloat(pickRate),
          winRate: parseFloat(winRate)
        }
      }) || null
    )
  }

  private parseItems(raw: string) {
    const items = raw?.split('#')
    return (
      items?.map((item) => {
        const [ids, pickRate, winRate] = item.split('$')

        return {
          itemIds: ids.split(',').map(Number),
          pickRate: parseFloat(pickRate),
          winRate: parseFloat(winRate)
        }
      }) || null
    )
  }

  private parseDuoChampions(raw: string) {
    const details = raw?.split('#')
    return (
      details?.map((detail) => {
        const [championId, pickRate, winRate] = detail.split('&')
        return {
          championId: parseInt(championId),
          pickRate: parseFloat(pickRate),
          winRate: parseFloat(winRate)
        }
      }) || null
    )
  }

  private parseRecommendedSkills(raw: string) {
    const skillList = raw?.split('_')
    const [skills, order] = skillList
    const skillUpgradeDetails = skills?.split('#').map((skill) => {
      const [sequence, pickRate] = skill.split('&')

      return {
        sequence: sequence.split(',').map(Number),
        pickRate: parseFloat(pickRate)
      }
    })
    return (
      {
        skillLevelingOrder: order?.split(',').map(Number),
        skillUpgradeDetails
      } || null
    )
  }

  private parseUpdateDate(result: any, response: any) {
    const dt = result.dtstatdate || response.update.split(' ')[0]
    return dt ? `${dt.substr(0, 4)}-${dt.substr(4, 2)}-${dt.substr(6, 2)}` : null
  }

  getNormalizedChampionARAM(championId: number): Promise<NormalizedChampionInformation> {
    return this.getChampionDetailARAM(championId)
  }
}
