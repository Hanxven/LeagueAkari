import {
  Augment,
  ChampDetails,
  ChampionSimple,
  GameMap,
  GameMapAsset,
  Item,
  Perk,
  Perkstyles,
  Queue,
  SummonerSpell
} from '@renderer/types/game-data'

import { request } from './common'

export function getSummonerSpells() {
  return request<SummonerSpell[]>({
    url: '/lol-game-data/assets/v1/summoner-spells.json',
    method: 'GET'
  })
}

export function getPerkstyles() {
  return request<Perkstyles>({
    url: '/lol-game-data/assets/v1/perkstyles.json',
    method: 'GET'
  })
}

export function getItems() {
  return request<Item[]>({
    url: '/lol-game-data/assets/v1/items.json',
    method: 'GET'
  })
}

export function getChampionSummary() {
  return request<ChampionSimple[]>({
    url: '/lol-game-data/assets/v1/champion-summary.json',
    method: 'GET'
  })
}

export function getMaps() {
  return request<GameMap[]>({
    url: '/lol-game-data/assets/v1/maps.json',
    method: 'GET'
  })
}

export function getPerks() {
  return request<Perk[]>({
    url: '/lol-game-data/assets/v1/perks.json',
    method: 'GET'
  })
}

export function getQueues() {
  return request<Record<number, Queue>>({
    url: '/lol-game-data/assets/v1/queues.json',
    method: 'GET'
  })
}

export function getMapAssets() {
  return request<GameMapAsset>({
    url: '/lol-game-data/assets/v1/map-assets/map-assets.json',
    method: 'GET'
  })
}

export function getChampDetails(champId: number) {
  return request<ChampDetails>({
    url: `/lol-game-data/assets/v1/champions/${champId}.json`,
    method: 'GET'
  })
}

export function getAugments() {
  return request<Augment[]>({
    method: 'GET',
    url: '/lol-game-data/assets/v1/cherry-augments.json'
  })
}
