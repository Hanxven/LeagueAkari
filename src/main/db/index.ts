import { app } from 'electron'
import { join } from 'node:path'
import { DataSource } from 'typeorm'

import { Metadata } from './entities/Metadata'
import { TaggedPlayer } from './entities/TaggedPlayer'
import { DatabaseInitialization } from './migrations/db-init'

const LEAGUE_AKARI_DB_FILE = 'league-akari.db'

export const dataSource = new DataSource({
  type: 'sqlite',
  database: join(app.getPath('userData'), LEAGUE_AKARI_DB_FILE),
  synchronize: false,
  entities: [Metadata, TaggedPlayer],
  migrations: [DatabaseInitialization],
  migrationsTableName: 'Migrations'
})

export async function initDatabase() {
  await dataSource.initialize()
  await dataSource.runMigrations()
}
