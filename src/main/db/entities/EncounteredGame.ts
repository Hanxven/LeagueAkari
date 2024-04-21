import { Column, Entity, Index, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm'

/**
 * 记录与某位玩家相遇的情况，遇到 ta 的每一局游戏都会被记录在内
 */
@Entity('EncounteredGames')
export class EncounteredGame {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', nullable: false })
  @Index('encountered_games_rso_game_id_index')
  gameId: number

  @Column({ type: 'integer' })
  @Index('encountered_games_summoner_id_index')
  summonerId: number

  /**
   * 记录游戏时，使用 League Akari 的玩家是谁
   */
  @Column({ type: 'integer', nullable: false })
  @Index('encountered_games_self_summoner_id_index')
  selfSummonerId: number

  /**
   * 地区
   */
  @Column({ type: 'varchar', nullable: false })
  @Index('encountered_games_region_index')
  region: string

  /**
   * 平台
   */
  @Column({ type: 'varchar', nullable: false })
  @Index('encountered_games_rso_platform_id_index')
  rsoPlatformId: string

  @Column({ type: 'datetime', nullable: false })
  @Index('encountered_games_update_at_index')
  updateAt: Date
}
