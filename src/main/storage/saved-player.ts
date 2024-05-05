import { SavedPlayer } from '@main/db/entities/SavedPlayers'
import { Equal } from 'typeorm'

import { dataSource } from '../db'
import { onRendererCall } from '../utils/ipc'
import { queryEncounteredGames } from './encountered-games'

interface SavedPlayerQueryDto {
  selfPuuid: string
  puuid: string
  rsoPlatformId: string
  region: string
}

interface SavedPlayerSaveDto extends SavedPlayerQueryDto {
  tag?: string
  encountered: boolean // 在遇到时更新
}

export function querySavedPlayer(query: SavedPlayerQueryDto) {
  if (!query.puuid || !query.selfPuuid || !query.region || !query.rsoPlatformId) {
    throw new Error('puuid, selfPuuid, region or rsoPlatformId cannot be empty')
  }

  return dataSource.manager.findOneBy(SavedPlayer, {
    puuid: Equal(query.puuid),
    selfPuuid: Equal(query.selfPuuid),
    region: Equal(query.region),
    rsoPlatformId: Equal(query.rsoPlatformId)
  })
}

export async function querySavedPlayerWithGames(query: SavedPlayerQueryDto) {
  if (!query.puuid || !query.selfPuuid || !query.region || !query.rsoPlatformId) {
    throw new Error('puuid, selfPuuid, region or rsoPlatformId cannot be empty')
  }

  const savedPlayer = await dataSource.manager.findOneBy(SavedPlayer, {
    puuid: Equal(query.puuid),
    selfPuuid: Equal(query.selfPuuid),
    region: Equal(query.region),
    rsoPlatformId: Equal(query.rsoPlatformId)
  })

  if (savedPlayer) {
    const encounteredGames = await queryEncounteredGames({
      puuid: query.puuid,
      selfPuuid: query.selfPuuid,
      region: query.region,
      rsoPlatformId: query.rsoPlatformId
    })

    return { ...savedPlayer, encounteredGames: encounteredGames.map((g) => g.gameId) }
  }

  return null
}

export function deleteSavedPlayer(query: SavedPlayerQueryDto) {
  if (!query.puuid || !query.selfPuuid || !query.region || !query.rsoPlatformId) {
    throw new Error('puuid, selfPuuid, region or rsoPlatformId cannot be empty')
  }

  return dataSource.manager.delete(SavedPlayer, query)
}

export function saveSavedPlayer(player: SavedPlayerSaveDto) {
  if (!player.puuid || !player.selfPuuid || !player.region || !player.rsoPlatformId) {
    throw new Error('puuid, selfPuuid, region or rsoPlatformId cannot be empty')
  }

  const savedPlayer = new SavedPlayer()
  const date = new Date()
  savedPlayer.puuid = player.puuid

  if (player.tag) {
    savedPlayer.tag = player.tag
  }

  savedPlayer.selfPuuid = player.selfPuuid
  savedPlayer.rsoPlatformId = player.rsoPlatformId
  savedPlayer.region = player.region
  savedPlayer.updateAt = date

  if (player.encountered) {
    savedPlayer.lastMetAt = date
  }

  return dataSource.manager.save(savedPlayer)
}

export async function initSavedPlayersStorageIpc() {
  onRendererCall('storage/saved-player/save', (_, player: SavedPlayerSaveDto) => {
    return saveSavedPlayer(player)
  })

  onRendererCall('storage/saved-player/delete', (_, query: SavedPlayerQueryDto) => {
    return deleteSavedPlayer(query)
  })

  onRendererCall('storage/saved-player/query', (_, query: SavedPlayerQueryDto) => {
    return querySavedPlayer(query)
  })

  onRendererCall('storage/saved-player-with-games/query', (_, query: SavedPlayerQueryDto) => {
    return querySavedPlayerWithGames(query)
  })
}
