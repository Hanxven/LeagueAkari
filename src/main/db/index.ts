import { app } from 'electron'
import { existsSync, renameSync } from 'fs'
import { join } from 'path'
import { DataSource } from 'typeorm'

import { Metadata } from './entities/Metadata'
import { TaggedPlayer } from './entities/TaggedPlayer'
import { DatabaseInitialization } from './migrations/db-init'

const LEAGUE_AKARI_PREVIOUS_VERSION_DB_FILE = 'league-toolkit.db'
const LEAGUE_AKARI_DB_FILE = 'league-akari.db'

// 重命名改名之前的数据库文件
function migrateFromPreviousVersion() {
  const userDataPath = app.getPath('userData')

  const oldFilePath = join(userDataPath, LEAGUE_AKARI_PREVIOUS_VERSION_DB_FILE)
  const newFilePath = join(userDataPath, LEAGUE_AKARI_DB_FILE)

  if (existsSync(oldFilePath)) {
    renameSync(oldFilePath, newFilePath)
  }
}

migrateFromPreviousVersion()

export const dataSource = new DataSource({
  type: 'sqlite',
  database: join(app.getPath('userData'), LEAGUE_AKARI_DB_FILE),
  synchronize: false,
  entities: [Metadata, TaggedPlayer],
  migrations: [DatabaseInitialization],
  migrationsTableName: 'Migrations'
})

export async function initDatabase() {
  // 迁移工

  await dataSource.initialize()
  await dataSource.runMigrations()
}
