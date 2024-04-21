import { Column, Entity, Index, PrimaryColumn } from 'typeorm'

/**
 * 标记 ta，铭记 ta
 */
@Entity('SavedPlayers')
export class SavedPlayer {
  @PrimaryColumn()
  summonerId: number

  /**
   * 记录游戏时，使用 League Akari 的玩家是谁
   */
  @Column({ type: 'integer', nullable: false })
  @Index('saved_players_self_summoner_id_index')
  selfSummonerId: number

  /**
   * 标记的内容
   */
  @Column({ type: 'varchar', nullable: true })
  tag: string | null

  /**
   * 上次一更新的时间
   */
  @Column({ nullable: false })
  @Index('saved_players_update_at_index')
  updateAt: Date

  /**
   * 上一次匹配到的时间，可以为空
   */
  @Column({ nullable: true, type: 'datetime' })
  @Index('saved_players_last_met_at_index')
  lastMetAt: Date | null

  /**
   * 地区
   */
  @Column({ type: 'varchar', nullable: false })
  @Index('saved_players_region_index')
  region: string

  /**
   * 平台，腾讯服务器会有，用作区服
   *
   * 如新加披服 (SG2)，无此字段
   */
  @Column({ type: 'varchar', nullable: false })
  @Index('saved_players_rso_platform_id_index')
  rsoPlatformId: string
}
