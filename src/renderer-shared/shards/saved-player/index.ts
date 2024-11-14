import { AkariIpcRenderer } from '../ipc'

const MAIN_SHARD_NAMESPACE = 'saved-player-main'

// copied from main shard
interface SavedPlayerQueryDto {
  selfPuuid: string
  puuid: string
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
  static dependencies = ['akari-ipc-renderer']

  private readonly _ipc: AkariIpcRenderer

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-renderer']
  }

  querySavedPlayerWithGames(dto: SavedPlayerQueryDto) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'querySavedPlayerWithGames', dto)
  }

  getPlayerTags(dto: SavedPlayerQueryDto): Promise<PlayerTagDto[]> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getPlayerTags', dto)
  }

  updatePlayerTag<T extends UpdateTagDto>(dto: T) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'updatePlayerTag', dto)
  }
}
