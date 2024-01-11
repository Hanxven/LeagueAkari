import { ChampSelectSession, GridChamp } from '@renderer/types/champ-select'

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

// 额外的一层封装, 包含了选择英雄和ban英雄.
// completed字段表示是否决定, 比如选英雄的时候, 为false的时候只是亮出来, true的时候才是真正的确认
// 玩家可执行的操作（如 ban 或 pick）被称为 action，在游戏开始时系统会为每个玩家所在的格子分配一个 action ID，通过这个 ID 即可执行 action
// 十名玩家占十个格子，一般来说只有五个格子是可见的（就是队友的），十个格子都可见，可能是当年的互选模式吧
export function pickOrBan(
  championId: number,
  completed: boolean,
  type: 'pick' | 'ban',
  actionId: number
) {
  return action(actionId, { championId, completed, type })
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
