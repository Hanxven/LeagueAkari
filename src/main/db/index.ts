import { LEAGUE_AKARI_DB_FILENAME } from '@shared/constants'
import { app } from 'electron'
import { join } from 'node:path'
import { DataSource } from 'typeorm'

import { EncounteredGame } from './entities/EncounteredGame'
import { Metadata } from './entities/Metadata'
import { SavedPlayer } from './entities/SavedPlayers'
import { Setting } from './entities/Settings'
import { checkAndInitializeDatabase } from './upgrades'

export const dataSource = new DataSource({
  type: 'sqlite',
  database: join(app.getPath('userData'), LEAGUE_AKARI_DB_FILENAME),
  synchronize: false,
  entities: [Metadata, SavedPlayer, Setting, EncounteredGame]
})

export async function initDatabase() {
  await checkAndInitializeDatabase(dataSource)
}
