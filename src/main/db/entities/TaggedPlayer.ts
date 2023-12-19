import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('TaggedPlayers')
export class TaggedPlayer {
  @PrimaryColumn()
  id: number

  /**
   * 标记的内容
   */
  @Column()
  tag: string

  /**
   * 和这名游戏玩家相关的游戏对局
   */
  @Column({ type: 'json' })
  relatedGameIds: any

  /**
   * 上次一更新的时间
   */
  @Column()
  updateAt: Date

  /**
   * 上一次匹配到的时间
   */
  @Column()
  lastMet: Date

  /**
   * 作为对手还是队友
   */
  @Column()
  side: 'teammate' | 'opponent'

  /**
   * 最近一次该玩家的信息缓存
   */
  @Column({ type: 'json' })
  summonerInfo: any
}
