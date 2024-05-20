import { QueryRunner, TableColumn, TableIndex } from 'typeorm'

import { EncounteredGame } from '../entities/EncounteredGame'

/**
 * The first version of League Akari 1.2.0
 */
export async function v15_LA1_2_2Upgrade(queryRunner: QueryRunner) {
  const encounteredGames = queryRunner.connection.getMetadata(EncounteredGame)

  const table = await queryRunner.getTable(encounteredGames.tablePath)

  if (table) {
    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: 'queueType',
        type: 'varchar',
        isNullable: false,
        default: "''"
      })
    )

    await queryRunner.createIndex(
      table,
      new TableIndex({
        name: 'encountered_games_queue_type',
        columnNames: ['queueType']
      })
    )
  }

  await queryRunner.query(`UPDATE Metadata SET value = json('15') WHERE key = 'version'`)
}
