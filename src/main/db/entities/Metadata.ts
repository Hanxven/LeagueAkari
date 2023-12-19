import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('Metadata')
export class Metadata {
  /**
   * 元信息键
   */
  @PrimaryColumn()
  name: string

  /**
   * 元信息值
   */
  @Column()
  value: number
}
