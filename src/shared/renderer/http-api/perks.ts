import { PerkInventory, PerkPage } from '@shared/types/lcu/perks'

import { request } from './common'

export interface PostPerkDto {
  name: string
  isEditable: boolean
  primaryStyleId: string
}

export function postPerkPage(perkData: PostPerkDto) {
  return request<PerkPage>({
    url: '/lol-perks/v1/pages/',
    method: 'POST',
    data: perkData
  })
}

export function getPerkInventory() {
  return request<PerkInventory>({
    method: 'GET',
    url: '/lol-perks/v1/inventory'
  })
}

export function getPerkPages() {
  return request<PerkPage[]>({
    method: 'GET',
    url: '/lol-perks/v1/pages'
  })
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

export function putPage(perkData: Partial<PutPageDto>) {
  return request({
    method: 'PUT',
    url: `/lol-perks/v1/pages/${perkData.id}`,
    data: perkData
  })
}

export function putCurrentPage(id: number) {
  return request({
    method: 'PUT',
    url: '/lol-perks/v1/currentpage',
    data: id,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

/**
 * // post data
 * {"name":"新的符文页2","isEditable":true,"primaryStyleId":"8100"}
 *
 * // put data
 * {"isTemporary":false,"runeRecommendationId":"","recommendationChampionId":0,"isRecommendationOverride":false,"recommendationIndex":-1,"quickPlayChampionids":[],"primaryStyleId":8100,"subStyleId":8000,"name":"新的符文页2","selectedPerkIds":[9923,8143,8120,8135,8009,9103,5005,5001,5011],"order":1}
 *
 */
