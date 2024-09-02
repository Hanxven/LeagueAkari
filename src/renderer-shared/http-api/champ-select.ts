import {
  CarouselSkins,
  ChampSelectSession,
  GridChamp,
  MySelection
} from '@shared/types/lcu/champ-select'

import { request } from './common'

export function getChampSelectSession() {
  return request<ChampSelectSession>({
    method: 'GET',
    url: '/lol-champ-select/v1/session'
  })
}

// 当前存在的英雄列表
export function getAllGridChamps() {
  return request<GridChamp[]>({
    method: 'GET',
    url: '/lol-champ-select/v1/all-grid-champions'
  })
}

// 操作部分
export function action(actionId: string | number, data: any) {
  return request({
    method: 'PATCH',
    url: `/lol-champ-select/v1/session/actions/${actionId}`,
    data
  })
}

export function pickOrBan(
  championId: number,
  completed: boolean,
  type: 'pick' | 'ban',
  actionId: number
) {
  return action(actionId, { championId, completed, type })
}

export function intentChampion(actionId: number, championId: number) {
  return action(actionId, { championId })
}

export function getSession() {
  return request<ChampSelectSession>({
    method: 'GET',
    url: '/lol-champ-select/v1/session'
  })
}

export function benchSwap(champId: string | number) {
  return request<void>({
    url: `/lol-champ-select/v1/session/bench/swap/${champId}`,
    method: 'POST'
  })
}

export function declineTrade(tradeId: string | number) {
  return request({
    url: `/lol-champ-select/v1/session/trades/${tradeId}/decline`,
    method: 'POST'
  })
}

export function getPickableChampIds() {
  return request<number[]>({
    url: '/lol-champ-select/v1/pickable-champion-ids',
    method: 'GET'
  })
}

export function getBannableChampIds() {
  return request<number[]>({
    url: '/lol-champ-select/v1/bannable-champion-ids',
    method: 'GET'
  })
}

export function reroll() {
  return request({
    url: '/lol-champ-select/v1/session/my-selection/reroll',
    method: 'POST'
  })
}

export function getCurrentChamp() {
  return request<number>({
    url: '/lol-champ-select/v1/current-champion',
    method: 'GET'
  })
}

export function setSkin(skinId: number) {
  return request({
    url: '/lol-champ-select/v1/session/my-selection',
    method: 'PATCH',
    data: {
      selectedSkinId: skinId
    }
  })
}

export function getCarouselSkins() {
  return request<CarouselSkins[]>({
    url: '/lol-champ-select/v1/skin-carousel-skins'
  })
}

export function getMySelections() {
  return request<MySelection>({
    url: '/lol-champ-select/v1/session/my-selection'
  })
}

export function setMySummonerSpells(data: { spell1Id?: number; spell2Id?: number }) {
  return request<void>({
    url: '/lol-champ-select/v1/session/my-selection',
    method: 'PATCH',
    data
  })
}
