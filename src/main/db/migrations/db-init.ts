import { Equal, MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm'

import { Metadata } from '../entities/Metadata'

export class DatabaseInitialization implements MigrationInterface {
  public name = 'initialization1000000000003'

  private async createMetadataTable(queryRunner: QueryRunner) {
    const table = new Table({ name: 'Metadata' })
    table.addColumn(new TableColumn({ name: 'name', type: 'VARCHAR', isPrimary: true }))
    table.addColumn(new TableColumn({ name: 'value', type: 'INTEGER' }))
    await queryRunner.createTable(table, false)
    await queryRunner.createIndex(
      'Metadata',
      new TableIndex({ name: 'METADATA_NAME_IDX', columnNames: ['name'] })
    )

    const metadata = new Metadata()
    metadata.name = 'version'
    metadata.value = 3
    await queryRunner.manager.save(metadata)
  }

  private async createTaggedPlayersTable(queryRunner: QueryRunner) {
    const table = new Table({ name: 'TaggedPlayers' })
    table.addColumn(new TableColumn({ name: 'id', type: 'INTEGER', isPrimary: true }))
    table.addColumn(new TableColumn({ name: 'tag', type: 'VARCHAR', isNullable: true }))
    table.addColumn(new TableColumn({ name: 'updateAt', type: 'INTEGER', isNullable: true }))
    table.addColumn(new TableColumn({ name: 'lastMet', type: 'INTEGER', isNullable: true }))
    table.addColumn(new TableColumn({ name: 'side', type: 'VARCHAR', isNullable: true }))
    table.addColumn(new TableColumn({ name: 'relatedGameIds', type: 'JSON', isNullable: true }))
    table.addColumn(new TableColumn({ name: 'summonerInfo', type: 'JSON', isNullable: true }))
    await queryRunner.createTable(table, false)
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const metadataTable = await queryRunner.getTable('Metadata')
    if (!metadataTable) {
      await this.createMetadataTable(queryRunner)
      await this.createTaggedPlayersTable(queryRunner)
      console.log('Version 3 - Database created')
      return
    }

    const metadata = await queryRunner.manager.findOneBy(Metadata, { name: Equal('version') })
    if (!metadata || metadata.value < 3) {
      await queryRunner.dropTable('TaggedPlayers')
      await this.createTaggedPlayersTable(queryRunner)
      await queryRunner.manager.update(Metadata, { name: 'version' }, { value: 3 })
      console.log('Version 3 - Database updated')
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    throw new Error('Not implemented')
  }
}
