import { SummonerInfo } from '@renderer/types/summoner'

import { request } from './common'

export function getCurrentSummoner() {
  return request<SummonerInfo>({
    method: 'GET',
    url: '/lol-summoner/v1/current-summoner'
  })
}

export function getSummoner(id: number) {
  return request<SummonerInfo>({
    method: 'GET',
    url: `/lol-summoner/v1/summoners/${id}`
  })
}

export function getSummonerByPuuid(puuid: string) {
  return request<SummonerInfo>({
    method: 'GET',
    url: `/lol-summoner/v2/summoners/puuid/${puuid}`
  })
}

export function getSummonerByName(name: string) {
  return request<SummonerInfo>({
    method: 'GET',
    url: `/lol-summoner/v1/summoners?name=${name}`
  })
}

export function checkAvailability(name: string) {
  return request<boolean>({
    method: 'GET',
    url: `/lol-summoner/v1/check-name-availability-new-summoners/${name}`
  })
}

export function updateSummonerProfile(data: { inventory?: string; key: string; value: any }) {
  return request({
    url: '/lol-summoner/v1/current-summoner/summoner-profile',
    method: 'POST',
    data
  })
}

export function updateSummonerName(name: string) {
  return request({
    url: '/lol-summoner/v1/current-summoner/name',
    method: 'POST',
    data: name
  })
}

// 用于新的召唤师创建时，可以设置较长的名称
export function newSummonerName(name: string) {
  return request({
    url: '/lol-summoner/v1/summoners',
    method: 'POST',
    data: { name }
  })
}

/**
 * 皮肤的 ID 是可以推算出来。恒等于 Number(`${championId}${skinIndex.toString().padStart(3, '0')}`)
 * 其中，skinIndex 为皮肤的第几个，这个值根据皮肤发布的时间依次递增。0 为原皮。
 * 如：安妮的第一个皮肤 = 1001，1 为英雄 ID，001 为第一个皮肤。
 * @param skinId 皮肤的 ID
 */
export function setSummonerBackgroundSkin(skinId: number) {
  return updateSummonerProfile({
    key: 'backgroundSkinId',
    value: skinId
  })
}

export function getSummonerAliases(nameTagList: { gameName: string; tagLine: string }[]) {
  return request<SummonerInfo[]>({
    url: '/lol-summoner/v1/summoners/aliases',
    method: 'POST',
    data: nameTagList
  })
}

/**
  同名函数
 */
export async function getSummonerAlias(name: string, tag: string) {
  const response = await getSummonerAliases([{ gameName: name, tagLine: tag }])
  const result = response.data[0]
  return result || null
}
