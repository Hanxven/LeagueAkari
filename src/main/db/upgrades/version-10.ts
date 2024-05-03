import { QueryRunner, Table } from 'typeorm'

import { EncounteredGame } from '../entities/EncounteredGame'
import { Metadata } from '../entities/Metadata'
import { SavedPlayer } from '../entities/SavedPlayers'
import { Setting } from '../entities/Settings'

/**
 * The first version of League Akari 1.2.0
 */
export async function v10_LA1_2_0initializationUpgrade(queryRunner: QueryRunner) {
  const metadata = queryRunner.connection.getMetadata(Metadata)
  const savedPlayers = queryRunner.connection.getMetadata(SavedPlayer)
  const settings = queryRunner.connection.getMetadata(Setting)
  const encounteredGames = queryRunner.connection.getMetadata(EncounteredGame)

  await queryRunner.dropTable(metadata.tableName, true)
  await queryRunner.dropTable(savedPlayers.tableName, true)
  await queryRunner.dropTable(settings.tableName, true)
  await queryRunner.dropTable(encounteredGames.tableName, true)

  await queryRunner.createTable(Table.create(metadata, queryRunner.connection.driver))
  await queryRunner.createTable(Table.create(savedPlayers, queryRunner.connection.driver))
  await queryRunner.createTable(Table.create(settings, queryRunner.connection.driver))
  await queryRunner.createTable(Table.create(encounteredGames, queryRunner.connection.driver))

  await queryRunner.manager.save(Metadata.create('version', 10))
  await queryRunner.manager.save(Metadata.create('debugging-text-0', 'League Akari, Hanxven@2024'))
  await queryRunner.manager.save(Metadata.create('debugging-text-1', 'Ayano'))
}
