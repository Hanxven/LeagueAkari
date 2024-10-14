import { QueryRunner, Table, TableIndex } from 'typeorm'

/**
 * 来自 League Akari 1.2.0 的第一次新建数据库, 这是伟大的开始
 */
export async function v10_LA1_2_0initializationUpgrade(queryRunner: QueryRunner) {
  await queryRunner.createTable(
    new Table({
      name: 'Metadata',
      columns: [
        {
          name: 'key',
          type: 'varchar',
          isPrimary: true
        },
        {
          name: 'value',
          type: 'json'
        }
      ]
    })
  )

  await queryRunner.createTable(
    new Table({
      name: 'SavedPlayers',
      columns: [
        {
          name: 'puuid',
          type: 'varchar',
          isPrimary: true
        },
        {
          name: 'selfPuuid',
          type: 'varchar',
          isPrimary: true
        },
        {
          name: 'region',
          type: 'varchar',
          isPrimary: true
        },
        {
          name: 'rsoPlatformId',
          type: 'varchar',
          isPrimary: true
        },
        {
          name: 'tag',
          type: 'varchar',
          isNullable: true
        },
        {
          name: 'updateAt',
          type: 'datetime',
          isNullable: false
        },
        {
          name: 'lastMetAt',
          type: 'datetime',
          isNullable: true
        }
      ]
    })
  )

  await queryRunner.createIndex(
    'SavedPlayers',
    new TableIndex({
      name: 'saved_players_update_at_index',
      columnNames: ['updateAt']
    })
  )

  await queryRunner.createIndex(
    'SavedPlayers',
    new TableIndex({
      name: 'saved_players_last_met_at_index',
      columnNames: ['lastMetAt']
    })
  )

  await queryRunner.createTable(
    new Table({
      name: 'Settings',
      columns: [
        {
          name: 'key',
          type: 'varchar',
          isPrimary: true
        },
        {
          name: 'value',
          type: 'json'
        }
      ]
    })
  )

  await queryRunner.createTable(
    new Table({
      name: 'EncounteredGames',
      columns: [
        {
          name: 'id',
          type: 'integer',
          isPrimary: true,
          isGenerated: true,
          generationStrategy: 'increment'
        },
        {
          name: 'gameId',
          type: 'integer',
          isNullable: false
        },
        {
          name: 'puuid',
          type: 'varchar',
          isNullable: false
        },
        {
          name: 'selfPuuid',
          type: 'varchar',
          isNullable: false
        },
        {
          name: 'region',
          type: 'varchar',
          isNullable: false
        },
        {
          name: 'rsoPlatformId',
          type: 'varchar',
          isNullable: false
        },
        {
          name: 'updateAt',
          type: 'datetime',
          isNullable: false
        }
      ]
    })
  )

  await queryRunner.createIndex(
    'EncounteredGames',
    new TableIndex({
      name: 'encountered_games_game_id_index',
      columnNames: ['gameId']
    })
  )

  await queryRunner.createIndex(
    'EncounteredGames',
    new TableIndex({
      name: 'encountered_games_puuid_index',
      columnNames: ['puuid']
    })
  )

  await queryRunner.createIndex(
    'EncounteredGames',
    new TableIndex({
      name: 'encountered_games_self_puuid_index',
      columnNames: ['selfPuuid']
    })
  )

  await queryRunner.createIndex(
    'EncounteredGames',
    new TableIndex({
      name: 'encountered_games_region_index',
      columnNames: ['region']
    })
  )

  await queryRunner.createIndex(
    'EncounteredGames',
    new TableIndex({
      name: 'encountered_games_rso_platform_id_index',
      columnNames: ['rsoPlatformId']
    })
  )

  await queryRunner.createIndex(
    'EncounteredGames',
    new TableIndex({
      name: 'encountered_games_update_at_index',
      columnNames: ['updateAt']
    })
  )

  await queryRunner.query(`INSERT INTO Metadata (key, value) VALUES ('version', json('10'))`)
  await queryRunner.query(
    `INSERT INTO Metadata (key, value) VALUES ('debugging-text-0', json('"League Akari, Hanxven@2024"'))`
  )
  await queryRunner.query(
    `INSERT INTO Metadata (key, value) VALUES ('debugging-text-1', json('"Ayano"'))`
  )
}
