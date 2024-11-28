import {
  PerkInventory,
  PerkPage,
  RecommendPage,
  RecommendPositions
} from '@shared/types/league-client/perks'
import { AxiosInstance } from 'axios'

export interface PostPerkDto {
  name: string
  isEditable: boolean
  primaryStyleId: string
}

export interface PutPageDto {
  isTemporary: boolean
  runeRecommendationId: string
  recommendationChampionId: number
  isRecommendationOverride: boolean
  recommendationIndex: number
  quickPlayChampionids: number[]
  primaryStyleId: number
  subStyleId: number
  selectedPerkIds: number[]
  name: string
  order: number
  id: number
}

export class PerksHttpApi {
  constructor(private _http: AxiosInstance) {}

  postPerkPage(perkData: PostPerkDto) {
    return this._http.post<PerkPage>('/lol-perks/v1/pages/', perkData)
  }

  getPerkInventory() {
    return this._http.get<PerkInventory>('/lol-perks/v1/inventory')
  }

  getPerkPages() {
    return this._http.get<PerkPage[]>('/lol-perks/v1/pages')
  }

  putPage(perkData: Partial<PutPageDto>) {
    return this._http.put(`/lol-perks/v1/pages/${perkData.id}`, perkData)
  }

  putCurrentPage(id: number) {
    return this._http.put('/lol-perks/v1/currentpage', id, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  getRecommendedChampionPositions() {
    return this._http.get<RecommendPositions>('/lol-perks/v1/recommended-champion-positions')
  }

  getRecommendedPagesPosition(championId: number) {
    return this._http.get(`/lol-perks/v1/recommended-pages-position/champion/${championId}`)
  }

  postRecommendedPagePosition(championId: number, position: string) {
    return this._http.post(
      `/lol-perks/v1/recommended-pages-position/champion/${championId}/position/${position}`
    )
  }

  getRecommendedPages(championId: number, position: string, mapId: number) {
    return this._http.get<RecommendPage[]>(
      `/lol-perks/v1/recommended-pages/champion/${championId}/position/${position}/map/${mapId}`
    )
  }

  /**
   * 是否系统级别自动选择
   * @returns
   */
  getRuneRecommenderAutoSelect() {
    return this._http.get<boolean>(`/lol-perks/v1/rune-recommender-auto-select`)
  }

  /**
   * 开启系统级别自动选择
   * @returns
   */
  postRuneRecommenderAutoSelect(data: object) {
    return this._http.post(`/lol-perks/v1/rune-recommender-auto-select`, data)
  }
}
