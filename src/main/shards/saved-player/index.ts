import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { Equal, FindOptionsOrder, FindOptionsWhere, IsNull, Not } from 'typeorm'

import { AkariIpcMain } from '../ipc'
import { StorageMain } from '../storage'
import { EncounteredGame } from '../storage/entities/EncounteredGame'
import { SavedPlayer } from '../storage/entities/SavedPlayers'
import {
  EncounteredGameQueryDto,
  EncounteredGameSaveDto,
  OrderByDto,
  PaginationDto,
  QueryAllSavedPlayersDto,
  SavedPlayerQueryDto,
  SavedPlayerSaveDto,
  UpdateTagDto,
  WithEncounteredGamesQueryDto
} from './types'

/**
 * 记录的玩家信息查询
 */
export class SavedPlayerMain implements IAkariShardInitDispose {
  static id = 'saved-player-main'
  static dependencies = ['akari-ipc-main', 'storage-main']

  static ENCOUNTERED_GAME_QUERY_DEFAULT_PAGE_SIZE = 40

  private readonly _ipc: AkariIpcMain
  private readonly _storage: StorageMain

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
    this._storage = deps['storage-main']
  }

  async onInit() {
    this._handleIpcCall()
  }

  /**
   *
   * @param query
   * @returns
   */
  async queryEncounteredGames(query: EncounteredGameQueryDto) {
    const pageSize = query.pageSize || SavedPlayerMain.ENCOUNTERED_GAME_QUERY_DEFAULT_PAGE_SIZE
    const page = query.page || 1

    const take = pageSize
    const skip = (page - 1) * pageSize

    const encounteredGames = await this._storage.dataSource.manager.find(EncounteredGame, {
      where: {
        selfPuuid: Equal(query.selfPuuid),
        puuid: Equal(query.puuid),
        queueType: query.queueType ? Equal(query.queueType) : undefined
      },
      order: { updateAt: query.timeOrder || 'desc' },
      take,
      skip
    })

    return encounteredGames
  }

  async saveEncounteredGame(dto: EncounteredGameSaveDto) {
    const g = new EncounteredGame()
    g.gameId = dto.gameId
    g.region = dto.region
    g.rsoPlatformId = dto.rsoPlatformId
    g.selfPuuid = dto.selfPuuid
    g.puuid = dto.puuid
    g.queueType = dto.queueType || ''
    g.updateAt = new Date()
    return this._storage.dataSource.manager.save(g)
  }

  async queryAllSavedPlayers(query: QueryAllSavedPlayersDto) {
    const data = await this._storage.dataSource.manager.find(SavedPlayer, {
      take: query.pageSize,
      skip: (query.page - 1) * query.pageSize
    })
    const count = await this._storage.dataSource.manager.count(SavedPlayer)

    return { data, count, page: query.page, pageSize: query.pageSize }
  }

  async querySavedPlayer(query: SavedPlayerQueryDto) {
    if (!query.puuid || !query.selfPuuid) {
      throw new Error('puuid, selfPuuid cannot be empty')
    }

    return this._storage.dataSource.manager.findOneBy(SavedPlayer, {
      puuid: Equal(query.puuid),
      selfPuuid: Equal(query.selfPuuid)
    })
  }

  async querySavedPlayerWithGames(query: SavedPlayerQueryDto & WithEncounteredGamesQueryDto) {
    if (!query.puuid || !query.selfPuuid) {
      throw new Error('puuid, selfPuuid or region cannot be empty')
    }

    const savedPlayer = await this._storage.dataSource.manager.findOneBy(SavedPlayer, {
      puuid: Equal(query.puuid),
      selfPuuid: Equal(query.selfPuuid)
    })

    if (savedPlayer) {
      const encounteredGames = await this.queryEncounteredGames({
        puuid: query.puuid,
        selfPuuid: query.selfPuuid,
        queueType: query.queueType
      })

      return { ...savedPlayer, encounteredGames }
    }

    return null
  }

  async deleteSavedPlayer(query: SavedPlayerQueryDto) {
    if (!query.puuid || !query.selfPuuid) {
      throw new Error('puuid, selfPuuid or region cannot be empty')
    }

    return this._storage.dataSource.manager.remove(SavedPlayer, query)
  }

  async saveSavedPlayer(player: SavedPlayerSaveDto) {
    if (!player.puuid || !player.selfPuuid || !player.region) {
      throw new Error('puuid, selfPuuid or region cannot be empty')
    }

    const savedPlayer = new SavedPlayer()
    const date = new Date()
    savedPlayer.puuid = player.puuid

    if (player.tag !== undefined) {
      savedPlayer.tag = player.tag
    }

    savedPlayer.selfPuuid = player.selfPuuid
    savedPlayer.rsoPlatformId = player.rsoPlatformId
    savedPlayer.region = player.region
    savedPlayer.updateAt = date

    if (player.encountered) {
      savedPlayer.lastMetAt = date
    }

    return this._storage.dataSource.manager.save(savedPlayer)
  }

  /**
   * 用于管理的 API, 查询所有玩家的标记, 甚至可以跨区服查询
   * @param query
   */
  async getAllPlayerTags(query: SavedPlayerQueryDto & PaginationDto & OrderByDto) {
    const whereClause: FindOptionsWhere<SavedPlayer> = {
      tag: Not(IsNull())
    }
    const orderBy: FindOptionsOrder<SavedPlayer> = {}

    const { page = 1, pageSize = 40 } = query

    if (query.puuid !== undefined) {
      whereClause.puuid = Equal(query.puuid)
    }

    if (query.selfPuuid !== undefined) {
      whereClause.selfPuuid = Equal(query.selfPuuid)
    }

    if (query.region !== undefined) {
      whereClause.region = Equal(query.region)
    }

    if (query.rsoPlatformId !== undefined) {
      whereClause.rsoPlatformId = Equal(query.rsoPlatformId)
    }

    if (query.timeOrder) {
      orderBy.updateAt = query.timeOrder
    } else {
      orderBy.updateAt = 'desc'
    }

    const players = await this._storage.dataSource.manager.find(SavedPlayer, {
      take: pageSize || 20,
      skip: (page - 1) * pageSize,
      where: whereClause,
      order: orderBy
    })

    const total = await this._storage.dataSource.manager.count(SavedPlayer, {
      where: whereClause
    })

    return {
      data: players,
      page,
      pageSize,
      total
    }
  }

  /**
   * 查询玩家的所有标记, 包括非此账号标记的
   * 不可跨区服查询
   * @param query
   */
  async getPlayerTags(query: SavedPlayerQueryDto) {
    if (!query.puuid || !query.selfPuuid) {
      throw new Error('puuid, selfPuuid or region cannot be empty')
    }

    const players = await this._storage.dataSource.manager.findBy(SavedPlayer, {
      puuid: Equal(query.puuid)
    })

    return players
      .filter((p) => p.tag)
      .map((p) => {
        return {
          ...p,
          markedBySelf: p.selfPuuid === query.selfPuuid
        }
      })
  }

  /**
   * 更改某个玩家的 Tag, 提供标记者和被标记者的 puuid
   * 提供为空则为删除标记
   */
  async updatePlayerTag(dto: UpdateTagDto) {
    // 这里的 selfPuuid 是标记者的 puuid
    if (!dto.puuid || !dto.selfPuuid) {
      throw new Error('puuid, selfPuuid cannot be empty')
    }

    const player = await this._storage.dataSource.manager.findOneBy(SavedPlayer, {
      puuid: Equal(dto.puuid),
      selfPuuid: Equal(dto.selfPuuid)
    })

    if (player) {
      player.tag = dto.tag
      player.updateAt = new Date()

      return this._storage.dataSource.manager.save(player)
    } else {
      if (dto.rsoPlatformId === undefined || dto.region === undefined) {
        throw new Error('When creating tag, rsoPlatformId, region cannot be empty')
      }

      const newPlayer = new SavedPlayer()
      const date = new Date()
      newPlayer.puuid = dto.puuid
      newPlayer.tag = dto.tag
      newPlayer.selfPuuid = dto.selfPuuid
      newPlayer.updateAt = date
      newPlayer.rsoPlatformId = dto.rsoPlatformId
      newPlayer.region = dto.region

      return this._storage.dataSource.manager.save(newPlayer)
    }
  }

  private _handleIpcCall() {
    this._ipc.onCall(SavedPlayerMain.id, 'querySavedPlayer', (_, query: SavedPlayerQueryDto) => {
      return this.querySavedPlayer(query)
    })

    this._ipc.onCall(
      SavedPlayerMain.id,
      'querySavedPlayerWithGames',
      (_, query: SavedPlayerQueryDto & WithEncounteredGamesQueryDto) => {
        return this.querySavedPlayerWithGames(query)
      }
    )

    this._ipc.onCall(SavedPlayerMain.id, 'saveSavedPlayer', (_, player: SavedPlayerSaveDto) => {
      return this.saveSavedPlayer(player)
    })

    this._ipc.onCall(SavedPlayerMain.id, 'deleteSavedPlayer', (_, query: SavedPlayerQueryDto) => {
      return this.deleteSavedPlayer(query)
    })

    this._ipc.onCall(
      SavedPlayerMain.id,
      'queryEncounteredGames',
      (_, query: EncounteredGameQueryDto) => {
        return this.queryEncounteredGames(query)
      }
    )

    this._ipc.onCall(
      SavedPlayerMain.id,
      'saveEncounteredGame',
      (_, dto: EncounteredGameSaveDto) => {
        return this.saveEncounteredGame(dto)
      }
    )

    this._ipc.onCall(SavedPlayerMain.id, 'getPlayerTags', (_, query: SavedPlayerQueryDto) => {
      return this.getPlayerTags(query)
    })

    this._ipc.onCall(SavedPlayerMain.id, 'updatePlayerTag', (_, dto: UpdateTagDto) => {
      return this.updatePlayerTag(dto)
    })

    this._ipc.onCall(
      SavedPlayerMain.id,
      'queryAllSavedPlayers',
      (_, query: QueryAllSavedPlayersDto) => {
        return this.queryAllSavedPlayers(query)
      }
    )

    this._ipc.onCall(
      SavedPlayerMain.id,
      'getAllPlayerTags',
      (_, query: SavedPlayerQueryDto & PaginationDto & OrderByDto) => {
        return this.getAllPlayerTags(query)
      }
    )
  }
}
