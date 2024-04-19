import { dataSource } from '@main/db'
import { EncounteredGame } from '@main/db/entities/EncounteredGame'
import { onRendererCall } from '@main/utils/ipc'
import { Equal } from 'typeorm'

interface EncounteredGameQueryDto {
  selfSummonerId: number
  summonerId: number
  region: string
  rsoPlatformId: string
  pageSize?: number
  page?: number
  timeOrder?: 'desc' | 'asc'
}

interface EncounteredGameSaveDto {
  selfSummonerId: number
  summonerId: number
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
      selfSummonerId: Equal(query.selfSummonerId),
      summonerId: Equal(query.summonerId),
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
  g.selfSummonerId = dto.selfSummonerId
  g.summonerId = dto.summonerId
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
