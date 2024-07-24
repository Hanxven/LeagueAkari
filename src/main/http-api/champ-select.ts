import { lcuConnectionModule as lcm } from '@main/modules/akari-core/lcu-connection'
import {
  CarouselSkins,
  ChampSelectSession,
  ChampSelectSummoner,
  GridChamp
} from '@shared/types/lcu/champ-select'

export function getChampSelectSession() {
  return lcm.lcuRequest<ChampSelectSession>({
    method: 'GET',
    url: '/lol-champ-select/v1/session'
  })
}

// 当前存在的英雄列表
export function getAllGridChamps() {
  return lcm.lcuRequest<GridChamp[]>({
    method: 'GET',
    url: '/lol-champ-select/v1/all-grid-champions'
  })
}

// 操作部分
export function action(actionId: string | number, data: any) {
  return lcm.lcuRequest({
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
  return lcm.lcuRequest<ChampSelectSession>({
    method: 'GET',
    url: '/lol-champ-select/v1/session'
  })
}

export function benchSwap(champId: string | number) {
  return lcm.lcuRequest<void>({
    url: `/lol-champ-select/v1/session/bench/swap/${champId}`,
    method: 'POST'
  })
}

export function declineTrade(tradeId: string | number) {
  return lcm.lcuRequest({
    url: `/lol-champ-select/v1/session/trades/${tradeId}/decline`,
    method: 'POST'
  })
}

export function getPickableChampIds() {
  return lcm.lcuRequest<number[]>({
    url: '/lol-champ-select/v1/pickable-champion-ids',
    method: 'GET'
  })
}

export function getBannableChampIds() {
  return lcm.lcuRequest<number[]>({
    url: '/lol-champ-select/v1/bannable-champion-ids',
    method: 'GET'
  })
}

export function reroll() {
  return lcm.lcuRequest({
    url: '/lol-champ-select/v1/session/my-selection/reroll',
    method: 'POST'
  })
}

export function getCurrentChamp() {
  return lcm.lcuRequest<number>({
    url: '/lol-champ-select/v1/current-champion',
    method: 'GET'
  })
}

export function getChampSelectSummoner(cellId: number) {
  return lcm.lcuRequest<ChampSelectSummoner>({
    url: `/lol-champ-select/v1/summoners/${cellId}`,
    method: 'GET'
  })
}

export function setSkin(skinId: number) {
  return lcm.lcuRequest({
    url: '/lol-champ-select/v1/session/my-selection',
    method: 'PATCH',
    data: {
      selectedSkinId: skinId
    }
  })
}

export function getCarouselSkins() {
  return lcm.lcuRequest<CarouselSkins[]>({
    url: '/lol-champ-select/v1/skin-carousel-skins'
  })
}
