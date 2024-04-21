import { SavedPlayer } from '@main/db/entities/SavedPlayers'
import { Equal } from 'typeorm'

import { dataSource } from '../db'
import { onRendererCall } from '../utils/ipc'

interface SavedPlayerQueryDto {
  summonerId: number
  selfSummonerId: number
  rsoPlatformId: string
  region: string
}

interface SavedPlayerSaveDto extends SavedPlayerQueryDto {
  tag?: string
  encountered: boolean // 在遇到时更新
}

export function querySavedPlayer(query: SavedPlayerQueryDto) {
  if (!query.summonerId || !query.selfSummonerId || !query.region || !query.rsoPlatformId) {
    throw new Error('summonerId, selfSummonerId, region or rsoPlatformId cannot be empty')
  }

  return dataSource.manager.findOneBy(SavedPlayer, {
    summonerId: Equal(query.summonerId),
    selfSummonerId: Equal(query.selfSummonerId),
    region: Equal(query.region),
    rsoPlatformId: Equal(query.rsoPlatformId)
  })
}

export function deleteSavedPlayer(query: SavedPlayerQueryDto) {
  if (!query.summonerId || !query.selfSummonerId || !query.region || !query.rsoPlatformId) {
    throw new Error('summonerId, selfSummonerId, region or rsoPlatformId cannot be empty')
  }

  return dataSource.manager.delete(SavedPlayer, query)
}

export function saveSavedPlayer(player: SavedPlayerSaveDto) {
  if (!player.summonerId || !player.selfSummonerId || !player.region || !player.rsoPlatformId) {
    throw new Error('summonerId, selfSummonerId, region or rsoPlatformId cannot be empty')
  }

  const isExists = dataSource.manager.existsBy(SavedPlayer, {
    summonerId: Equal(player.summonerId),
    selfSummonerId: Equal(player.selfSummonerId),
    rsoPlatformId: Equal(player.rsoPlatformId),
    region: Equal(player.region)
  })

  const savedPlayer = new SavedPlayer()
  const date = new Date()
  savedPlayer.summonerId = player.summonerId
  savedPlayer.tag = player.tag || null
  savedPlayer.selfSummonerId = player.selfSummonerId
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
}
