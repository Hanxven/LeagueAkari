import { dataSource } from '@main/db'
import { EncounteredGame } from '@main/db/entities/EncounteredGame'
import { onRendererCall } from '@main/utils/ipc'
import { Equal } from 'typeorm'

interface EncounteredGameQueryDto {
  selfPuuid: string
  puuid: string
  region: string
  rsoPlatformId: string
  pageSize?: number
  page?: number
  timeOrder?: 'desc' | 'asc'
}

interface EncounteredGameSaveDto {
  selfPuuid: string
  puuid: string
  region: string
  rsoPlatformId: string
  gameId: number
}

const ENCOUNTERED_GAME_QUERY_DEFAULT_PAGE_SIZE = 40

export async function queryEncounteredGames(query: EncounteredGameQueryDto) {
  const pageSize = query.pageSize || ENCOUNTERED_GAME_QUERY_DEFAULT_PAGE_SIZE
  const page = query.page || 1

  const take = pageSize
  const skip = (page - 1) * pageSize

  const encounteredGames = await dataSource.manager.find(EncounteredGame, {
    where: {
      selfPuuid: Equal(query.selfPuuid),
      puuid: Equal(query.puuid),
      region: Equal(query.region),
      rsoPlatformId: Equal(query.rsoPlatformId)
    },
    order: { updateAt: query.timeOrder || 'desc' },
    take,
    skip
  })

  return encounteredGames
}

export async function saveEncounteredGame(dto: EncounteredGameSaveDto) {
  const g = new EncounteredGame()
  g.gameId = dto.gameId
  g.region = dto.region
  g.rsoPlatformId = dto.rsoPlatformId
  g.selfPuuid = dto.selfPuuid
  g.puuid = dto.puuid
  g.updateAt = new Date()
  return dataSource.manager.save(g)
}

export async function initEncounteredGamesStorageIpc() {
  onRendererCall('storage/encountered-games/query', async (_, query: EncounteredGameQueryDto) => {
    return queryEncounteredGames(query)
  })

  onRendererCall('storage/encountered-games/save', (_, dto: EncounteredGameSaveDto) => {
    return saveEncounteredGame(dto)
  })
}
