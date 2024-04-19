import { Column, Entity, PrimaryColumn } from 'typeorm'

/**
 * 存放了一位灵魂所在
 */
@Entity('Settings')
export class Setting {
  /**
   * 设置项唯一标识，e.g. `some-function/setting-1/setting-2`
   */
  @PrimaryColumn({ type: 'varchar' })
  key: string

  /**
   * 设置内容
   */
  @Column({ type: 'json' })
  value: any

  static create(key: string, value: any) {
    const s = new Setting()
    s.key = key
    s.value = value
    return s
  }
}
