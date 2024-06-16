import { EncounteredGame } from '@main/db/entities/EncounteredGame'
import { Metadata } from '@main/db/entities/Metadata'
import { SavedPlayer } from '@main/db/entities/SavedPlayers'
import { Setting } from '@main/db/entities/Settings'
import { v10_LA1_2_0initializationUpgrade } from '@main/db/upgrades/version-10'
import { v15_LA1_2_2Upgrade } from '@main/db/upgrades/version-15'
import { MobxBasedModule } from '@shared/akari/mobx-based-module'
import { LEAGUE_AKARI_DB_CURRENT_VERSION, LEAGUE_AKARI_DB_FILENAME } from '@shared/constants/common'
import dayjs from 'dayjs'
import { app } from 'electron'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { DataSource, Equal, QueryRunner } from 'typeorm'

import { AppLogger, LogModule } from './log-new'

interface EncounteredGameQueryDto {
  selfPuuid: string
  puuid: string
  region: string
  rsoPlatformId: string
  queueType?: string
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
  queueType: string
}

interface SavedPlayerQueryDto {
  selfPuuid: string
  puuid: string
  rsoPlatformId: string
  region: string
}

interface WithEncounteredGamesQueryDto {
  queueType?: string
}

interface SavedPlayerSaveDto extends SavedPlayerQueryDto {
  tag?: string
  encountered: boolean // 在遇到时更新
}

export class StorageModule extends MobxBasedModule {
  private _ds: DataSource
  private _logModule: LogModule
  private _logger: AppLogger

  static ENCOUNTERED_GAME_QUERY_DEFAULT_PAGE_SIZE = 40

  constructor() {
    super('storage')
  }

  private _upgrades = {
    // 10 is the first version starting with League Akari 1.2.0
    10: v10_LA1_2_0initializationUpgrade,
    15: v15_LA1_2_2Upgrade
  }

  override async setup() {
    await super.setup()

    this._logModule = this.manager.getModule<LogModule>('log')
    this._logger = this._logModule.createLogger('storage')

    this._ds = new DataSource({
      type: 'sqlite',
      database: join(app.getPath('userData'), LEAGUE_AKARI_DB_FILENAME),
      synchronize: false,
      entities: [Metadata, SavedPlayer, Setting, EncounteredGame]
    })

    await this._initDatabase()
    this._setupMethodCall()

    this._logger.info('初始化完成')
  }

  async queryEncounteredGames(query: EncounteredGameQueryDto) {
    const pageSize = query.pageSize || StorageModule.ENCOUNTERED_GAME_QUERY_DEFAULT_PAGE_SIZE
    const page = query.page || 1

    const take = pageSize
    const skip = (page - 1) * pageSize

    const encounteredGames = await this._ds.manager.find(EncounteredGame, {
      where: {
        selfPuuid: Equal(query.selfPuuid),
        puuid: Equal(query.puuid),
        region: Equal(query.region),
        rsoPlatformId: Equal(query.rsoPlatformId),
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
    return this._ds.manager.save(g)
  }

  async querySavedPlayer(query: SavedPlayerQueryDto) {
    if (!query.puuid || !query.selfPuuid || !query.region) {
      throw new Error('puuid, selfPuuid or region cannot be empty')
    }

    return this._ds.manager.findOneBy(SavedPlayer, {
      puuid: Equal(query.puuid),
      selfPuuid: Equal(query.selfPuuid),
      region: Equal(query.region),
      rsoPlatformId: Equal(query.rsoPlatformId)
    })
  }

  async querySavedPlayerWithGames(query: SavedPlayerQueryDto & WithEncounteredGamesQueryDto) {
    if (!query.puuid || !query.selfPuuid || !query.region) {
      throw new Error('puuid, selfPuuid or region cannot be empty')
    }

    const savedPlayer = await this._ds.manager.findOneBy(SavedPlayer, {
      puuid: Equal(query.puuid),
      selfPuuid: Equal(query.selfPuuid),
      region: Equal(query.region),
      rsoPlatformId: Equal(query.rsoPlatformId)
    })

    if (savedPlayer) {
      const encounteredGames = await this.queryEncounteredGames({
        puuid: query.puuid,
        selfPuuid: query.selfPuuid,
        region: query.region,
        rsoPlatformId: query.rsoPlatformId,
        queueType: query.queueType
      })

      return { ...savedPlayer, encounteredGames: encounteredGames.map((g) => g.gameId) }
    }

    return null
  }

  async deleteSavedPlayer(query: SavedPlayerQueryDto) {
    if (!query.puuid || !query.selfPuuid || !query.region) {
      throw new Error('puuid, selfPuuid or region cannot be empty')
    }

    return this._ds.manager.delete(SavedPlayer, query)
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

    return this._ds.manager.save(savedPlayer)
  }

  async getSetting<T = any>(key: string, defaultValue: T) {
    const v = await this._ds.manager.findOneBy(Setting, { key })
    if (!v) {
      if (defaultValue !== undefined) {
        return defaultValue
      }
      throw new Error(`cannot find setting of key ${key}`)
    }

    return v.value as T
  }

  async setSetting(key: string, value: any) {
    if (!key || value === undefined) {
      throw new Error('key or value cannot be empty')
    }

    await this._ds.manager.save(Setting.create(key, value))
  }

  async removeSetting(key: string) {
    if (!key) {
      throw new Error('key is required')
    }

    await this._ds.manager.delete(Setting, { key })
  }

  private _setupMethodCall() {
    this.onCall('query/encountered-games', async (query: EncounteredGameQueryDto) => {
      return this.queryEncounteredGames(query)
    })

    this.onCall('save/encountered-game', (dto: EncounteredGameSaveDto) => {
      return this.saveEncounteredGame(dto)
    })

    this.onCall('save/saved-player', (player: SavedPlayerSaveDto) => {
      return this.saveSavedPlayer(player)
    })

    this.onCall('delete/saved-player', (query: SavedPlayerQueryDto) => {
      return this.deleteSavedPlayer(query)
    })

    this.onCall('query/saved-player', (query: SavedPlayerQueryDto) => {
      return this.querySavedPlayer(query)
    })

    this.onCall(
      'query/saved-player-with-games',
      (query: SavedPlayerQueryDto & WithEncounteredGamesQueryDto) => {
        return this.querySavedPlayerWithGames(query)
      }
    )
  }

  /**
   * 处理 League Akari 的数据库的升级
   */
  private async _performUpgrades(r: QueryRunner, currentVersion: number) {
    const pendingUpgrades = Object.entries(this._upgrades)
      .filter(([v]) => Number(v) > currentVersion)
      .toSorted(([v1], [v2]) => Number(v1) - Number(v2))

    this._logger.info(`即将进行的数据库升级数量: ${pendingUpgrades.length}`)

    for (const [v, fn] of pendingUpgrades) {
      this._logger.info(`正在执行版本 ${v} 的迁移`)
      await fn(r)
    }

    this._logger.info(`完成数据库升级`)
  }

  private async _initDatabase() {
    await this._checkAndInitializeDatabase(this._ds)
  }

  private async _checkAndInitializeDatabase(dataSource: DataSource) {
    await this._initializeDatabase(dataSource)
    const dbPath = dataSource.options.database as string
    if (!dbPath) {
      return
    }

    this._logger.info(`数据库位于 ${dbPath}`)

    const { needToRecreateDatabase, needToPerformUpgrade, currentVersion } =
      await this._checkDatabaseVersion(dataSource)

    this._logger.info(`当前版本 ${currentVersion}`)

    let cv = currentVersion

    if (!needToPerformUpgrade && !needToPerformUpgrade) {
      this._logger.info(`当前已经是最新的数据库版本`)
    }

    if (needToRecreateDatabase) {
      this._logger.warn(`错误的数据库格式，需要重建数据库`)
      await this._recreateDatabase(dataSource, dbPath)
      cv = 0
    }

    if (needToPerformUpgrade) {
      this._logger.info(`数据库需要从 ${cv} 版本升级`)
      const queryRunner = dataSource.createQueryRunner()
      await queryRunner.startTransaction()

      try {
        await this._performUpgrades(queryRunner, cv)

        await queryRunner.commitTransaction()
      } catch (error) {
        await queryRunner.rollbackTransaction()
        throw error
      } finally {
        await queryRunner.release()
      }
    }
  }

  private async _initializeDatabase(dataSource: DataSource) {
    await dataSource.initialize()
  }

  private async _recreateDatabase(dataSource: DataSource, dbPath: string) {
    await dataSource.destroy()

    if (existsSync(dbPath)) {
      const backupPath = join(dbPath, `../${dayjs().format('YYYYMMDDHHmmssSSS')}_bk.db`)

      renameSync(dbPath, backupPath)
      this._logger.info(`原数据库已放置于 ${backupPath}`)
    }

    await dataSource.initialize()
  }

  private async _checkDatabaseVersion(dataSource: DataSource): Promise<{
    needToRecreateDatabase: boolean
    needToPerformUpgrade: boolean
    currentVersion: number
  }> {
    const queryRunner = dataSource.createQueryRunner()
    let needToRecreateDatabase = false
    let needToPerformUpgrade = false
    let currentVersion = 0

    try {
      const metadataTable = await queryRunner.getTable('Metadata')
      if (metadataTable) {
        const versionResult = await queryRunner.manager.query(
          "SELECT value FROM Metadata WHERE key = 'version'"
        )
        if (versionResult.length) {
          currentVersion = parseInt(versionResult[0].value, 10)
          if (currentVersion > LEAGUE_AKARI_DB_CURRENT_VERSION) {
            // version is too high and needs recreation
            needToRecreateDatabase = true
            needToPerformUpgrade = true
          } else if (currentVersion < LEAGUE_AKARI_DB_CURRENT_VERSION) {
            // low version, need to upgrade
            needToPerformUpgrade = true
          }
        } else {
          // no version field, malformed db
          needToRecreateDatabase = true
          needToPerformUpgrade = true
        }
      } else {
        // just created, need to build the db
        needToPerformUpgrade = true
      }
    } finally {
      await queryRunner.release()
    }

    return { needToRecreateDatabase, needToPerformUpgrade, currentVersion }
  }
}

export const storageModule = new StorageModule()
