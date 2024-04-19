import { Column, Entity, PrimaryColumn } from 'typeorm'

/**
 * 伟大的数据库需要一些基本指导方针
 */
@Entity('Metadata')
export class Metadata {
  /**
   * 元信息键
   */
  @PrimaryColumn()
  key: string

  /**
   * 元信息值
   */
  @Column({ type: 'json' })
  value: any

  static create(key: string, value: any) {
    const m = new Metadata()
    m.key = key
    m.value = value
    return m
  }
}
