import { createLogger } from '@main/core/log'
import { LEAGUE_AKARI_DB_CURRENT_VERSION } from '@shared/constants'
import { unlinkSync } from 'node:fs'
import { DataSource, QueryRunner } from 'typeorm'

import { v10_LA1_2_0initializationUpgrade } from './version-10'

const logger = createLogger('database')

const upgrades = {
  // 10 is the first version starting with League Akari 1.2.0
  10: v10_LA1_2_0initializationUpgrade
}

/**
 * 处理 League Akari 的数据库的升级
 */
export async function performUpgrades(r: QueryRunner, currentVersion: number) {
  const pendingUpgrades = Object.entries(upgrades)
    .filter(([v]) => Number(v) > currentVersion)
    .toSorted(([v1], [v2]) => Number(v1) - Number(v2))

  logger.info(`Pending upgrades count: ${pendingUpgrades.length}`)

  for (const [v, fn] of pendingUpgrades) {
    logger.info(`now performing version ${v} migration`)
    await fn(r)
  }
}

export async function checkAndInitializeDatabase(dataSource: DataSource) {
  await initializeDatabase(dataSource)
  const dbPath = dataSource.options.database as string
  if (!dbPath) {
    return
  }

  logger.info(`Database path is ${dbPath}`)

  const { needToRecreateDatabase, needToPerformUpgrade, currentVersion } =
    await checkDatabaseVersion(dataSource)

  logger.info(`Current version ${currentVersion}`)

  let cv = currentVersion

  if (!needToPerformUpgrade && !needToPerformUpgrade) {
    logger.info(`Already the latest version, no need to upgrade`)
  }

  if (needToRecreateDatabase) {
    logger.warn(`Database needs recreation`)
    await recreateDatabase(dataSource, dbPath)
    cv = 0
  }

  if (needToPerformUpgrade) {
    logger.info(`Database needs upgrading, from ${cv}`)
    const queryRunner = dataSource.createQueryRunner()
    await queryRunner.startTransaction()

    try {
      await performUpgrades(queryRunner, cv)

      await queryRunner.commitTransaction()
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }
}

async function checkDatabaseVersion(dataSource: DataSource): Promise<{
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

async function initializeDatabase(dataSource: DataSource) {
  await dataSource.initialize()
}

async function recreateDatabase(dataSource: DataSource, dbPath: string) {
  await dataSource.destroy()
  unlinkSync(dbPath)
  await dataSource.initialize()
}
