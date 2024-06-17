import { lcuConnectionModule as lcm } from '@main/modules/akari-core/lcu-connection'
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
} from '@shared/types/lcu/game-data'

export function getSummonerSpells() {
  return lcm.request<SummonerSpell[]>({
    url: '/lol-game-data/assets/v1/summoner-spells.json',
    method: 'GET'
  })
}

export function getPerkstyles() {
  return lcm.request<Perkstyles>({
    url: '/lol-game-data/assets/v1/perkstyles.json',
    method: 'GET'
  })
}

export function getItems() {
  return lcm.request<Item[]>({
    url: '/lol-game-data/assets/v1/items.json',
    method: 'GET'
  })
}

export function getChampionSummary() {
  return lcm.request<ChampionSimple[]>({
    url: '/lol-game-data/assets/v1/champion-summary.json',
    method: 'GET'
  })
}

export function getMaps() {
  return lcm.request<GameMap[]>({
    url: '/lol-game-data/assets/v1/maps.json',
    method: 'GET'
  })
}

export function getPerks() {
  return lcm.request<Perk[]>({
    url: '/lol-game-data/assets/v1/perks.json',
    method: 'GET'
  })
}

export function getQueues() {
  return lcm.request<Record<number, Queue>>({
    url: '/lol-game-data/assets/v1/queues.json',
    method: 'GET'
  })
}

export function getMapAssets() {
  return lcm.request<GameMapAsset>({
    url: '/lol-game-data/assets/v1/map-assets/map-assets.json',
    method: 'GET'
  })
}

export function getChampDetails(champId: number) {
  return lcm.request<ChampDetails>({
    url: `/lol-game-data/assets/v1/champions/${champId}.json`,
    method: 'GET'
  })
}

export function getAugments() {
  return lcm.request<Augment[]>({
    method: 'GET',
    url: '/lol-game-data/assets/v1/cherry-augments.json'
  })
}
