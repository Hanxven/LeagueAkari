import { SummonerInfo } from '@shared/types/league-client/summoner'
import LRUMap from 'quick-lru'

import { AkariIpcRenderer } from '../ipc'

const MAIN_SHARD_NAMESPACE = 'saved-player-main'

// copied from main shard
interface SavedPlayerQueryDto {
  selfPuuid: string
  puuid: string
}

interface AllTaggedPlayerQueryDto {
  selfPuuid: string
  puuid: string
  region: string
  rsoPlatformId: string
  timeOrder: 'desc' | 'asc'
  page: number
  pageSize: number
}

// copied from main shard
export interface PlayerTagDto {
  markedBySelf: boolean
  puuid: string
  selfPuuid: string
  region: string
  rsoPlatformId: string
  tag: string | null
  updateAt: Date
  lastMetAt: Date | null
}

// copied from main shard
interface UpdateTagDto {
  selfPuuid: string
  puuid: string
  tag: string | null
}

export class SavedPlayerRenderer {
  static id = 'saved-player-renderer'
  static dependencies = [AkariIpcRenderer.id]

  private readonly _ipc: AkariIpcRenderer

  public readonly summonerLruMap = new LRUMap<string, SummonerInfo>({
    maxSize: 200
  })

  constructor(deps: any) {
    this._ipc = deps[AkariIpcRenderer.id]
  }

  querySavedPlayerWithGames(dto: SavedPlayerQueryDto) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'querySavedPlayerWithGames', dto)
  }

  getAllPlayerTags(dto: Partial<AllTaggedPlayerQueryDto> = {}) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getAllPlayerTags', dto)
  }

  getPlayerTags(dto: SavedPlayerQueryDto): Promise<PlayerTagDto[]> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getPlayerTags', dto)
  }

  updatePlayerTag<T extends UpdateTagDto>(dto: T) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'updatePlayerTag', dto)
  }

  deleteSavedPlayer(dto: SavedPlayerQueryDto) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'deleteSavedPlayer', dto)
  }

  queryAllSavedPlayers(dto: object): Promise<{
    count: number
    page: number
    pageSize: number
    data: any[]
  }> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'queryAllSavedPlayers', dto)
  }
}
