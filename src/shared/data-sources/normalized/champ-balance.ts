export interface ChampBalanceDataSourceV1 {
  /**
   * 数据源名称
   */
  name: string

  /**
   * 唯一标识
   */
  id: string

  /**
   * 数据源版本
   */
  version: string

  /**
   * 最后一次更新的日期
   */
  updateAt: Date

  /** 获取数据 */
  get data(): ChampBalanceMapV1 | null

  /**
   * 更新数据
   */
  update(): Promise<ChampBalanceMapV1 | null>

  /**
   * 数据是否合法，null 也是合法数据
   */
  validate(obj: any): boolean
}

export interface ChampBalanceMapV1 {
  [key: string]: ChampBalanceInfoV1
}

export interface ChampBalanceInfoV1 {
  id: number
  balance: ChampBalanceModeMapV1
}

export interface ChampBalanceModeMapV1 {
  [key: string]: ChampModeBalanceV1
}

export interface ChampModeBalanceV1 {
  dmg_dealt?: number
  dmg_taken?: number
  healing?: number
  shielding?: number
  ability_haste?: number
  mana_regen?: number
  energy_regen?: number
  attack_speed?: number
  movement_speed?: number
  tenacity?: number
}
