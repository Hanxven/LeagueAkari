export interface EncounteredGameQueryDto {
  selfPuuid: string
  puuid: string
  region?: string
  rsoPlatformId?: string
  queueType?: string
  pageSize?: number
  page?: number
  timeOrder?: 'desc' | 'asc'
}

export interface EncounteredGameSaveDto {
  selfPuuid: string
  puuid: string
  region: string
  rsoPlatformId: string
  gameId: number
  queueType: string
}

export interface SavedPlayerQueryDto {
  selfPuuid: string
  puuid: string
  rsoPlatformId: string
  region: string
}

export interface PaginationDto {
  page: number
  pageSize: number
}

export interface OrderByDto {
  timeOrder: 'desc' | 'asc'
}

export interface WithEncounteredGamesQueryDto {
  queueType?: string
}

export interface SavedPlayerSaveDto extends SavedPlayerQueryDto {
  tag?: string
  encountered: boolean // 在遇到时更新
}

export interface UpdateTagDto {
  selfPuuid: string
  puuid: string
  tag: string | null
  rsoPlatformId: string
  region: string
}

export interface QueryAllSavedPlayersDto {
  page: number
  pageSize: number
}
