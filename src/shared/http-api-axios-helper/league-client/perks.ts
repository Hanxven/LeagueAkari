import { PerkInventory, PerkPage } from '@shared/types/league-client/perks'
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
}
