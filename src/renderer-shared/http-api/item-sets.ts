import { request } from './common'

interface ItemSet {
  uid: string
  title: string
  sortrank: number
  type: string // 'custom'
  map: string // 'any'
  mode: string // 'any'
  blocks: {
    items: {
      id: string // 没错, id 字段是 string
      count: number
    }[]
    type: string
  }[]
  associatedChampions: number[] // 空数组代表所有英雄都可以使用
  associatedMaps: number[]

  // 没错, id 字段是 string
  // preferredItemSlot 从 0 到 5
  preferredItemSlots: { id: string; preferredItemSlot: number }[]
}

/**
 *
 * @param sets 一个物品集, 总之会被存储到本地文件中, 位于: {GameDir}/Game/Config/ItemSets.json
 * @param accountId 估计是已经废弃的参数, 无论填什么都是指向自己的, 但必须得填充一个数字
 * @returns 完整的 json
 */
export function putItemSets(sets: ItemSet[], accountId?: number) {
  return request<any>({
    url: `/lol-item-sets/v1/item-sets/${accountId || 0}/sets`,
    method: 'PUT',
    data: { itemSets: sets }
  })
}

export function getItemSets(accountId?: number) {
  return request<{ itemSets: ItemSet[] }>({
    url: `/lol-item-sets/v1/item-sets/${accountId || 0}/sets`,
    method: 'GET'
  })
}
